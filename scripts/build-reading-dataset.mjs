/**
 * 把原作者公开的 v4.0 解读数据集（Release v4.0-13d，77 个 year-YYYY.jsonl.zst，解压后 56.6 GB）
 * 转成浏览器可以直接查的精简格式 → public/reading-v4/
 *
 * 用法：
 *   1. 从 https://github.com/Renhuai123/ziwei-doushu/releases/tag/v4.0-13d 下载全部 year-*.jsonl.zst
 *   2. node scripts/build-reading-dataset.mjs <下载目录> [输出目录=public/reading-v4]
 *
 * 为什么要转：原始数据每张盘约 3 万字、整年解压后 700 多 MB，浏览器没法直接用；
 * 但论断是由同一个论断库拼出来的，绝大多数「行」在不同盘之间重复。
 * 所以按行去重：
 *   - common.zst ：在 ≥2 个年份都出现过的行（论断库本体），所有年份共用
 *   - YYYY.zst   ：该年份独有的行 + 每张盘「第几行」的索引
 * 每个年份约 0.7 MB，前端只下载出生那一年的档案，在浏览器里解压、还原全文。
 *
 * 年份档格式（zstd 解压后）：
 *   "ZWR1" | u32 头长度 | 头 JSON | u32 本地行长度 | 本地行（\n 分隔）| 正文
 *   头 JSON：{ v, year, charts: [[月, 日, 时辰, 性别(0男1女), 命宫主星|null, 正文偏移], ...] }
 *   正文：每张盘 13 个主题依序为 varint(行数) + 每行 varint(编号*2 + 是否本地行)
 * 共用档：「ZWC1」+ 共用行（\n 分隔）
 */

import { createReadStream, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus, tmpdir } from 'node:os';
import zlib from 'node:zlib';

export const TOPICS = ['overview', 'personality', 'love', 'career', 'wealth', 'health', 'family', 'children', 'move', 'friends', 'home', 'spirit', 'parents'];

function pushVarint(out, n) {
  while (n >= 0x80) { out.push((n & 0x7f) | 0x80); n = Math.floor(n / 128); }
  out.push(n);
}

function readVarint(buf, pos) {
  let n = 0, shift = 1, b;
  do { b = buf[pos.i++]; n += (b & 0x7f) * shift; shift *= 128; } while (b & 0x80);
  return n;
}

/** 第一遍：读一个年份，得到「该年所有不重复的行」与按本地编号写的正文 */
async function pass1(src, year, tmp) {
  const input = createReadStream(join(src, `year-${year}.jsonl.zst`))
    .pipe(zlib.createZstdDecompress({ params: { [zlib.constants.ZSTD_d_windowLogMax]: 31 } }));
  const ids = new Map();
  const charts = [];
  const body = [];
  for await (const raw of createInterface({ input, crlfDelay: Infinity })) {
    if (!raw) continue;
    const d = JSON.parse(raw);
    if (d.y !== year) throw new Error(`${year} 档里出现 ${d.y} 年的盘`);
    charts.push([d.m, d.d, d.h, d.g === 'female' ? 1 : 0, d.ms ?? null]);
    for (const t of TOPICS) {
      const lines = (d.c[t] ?? '').split('\n');
      pushVarint(body, lines.length);
      for (const l of lines) {
        let id = ids.get(l);
        if (id === undefined) { id = ids.size; ids.set(l, id); }
        pushVarint(body, id);
      }
    }
  }
  writeFileSync(join(tmp, `${year}.lines.json`), JSON.stringify([...ids.keys()]));
  writeFileSync(join(tmp, `${year}.charts.json`), JSON.stringify(charts));
  writeFileSync(join(tmp, `${year}.body.bin`), Buffer.from(body));
  return charts.length;
}

function zstd(buf) {
  return zlib.zstdCompressSync(buf, {
    params: {
      [zlib.constants.ZSTD_c_compressionLevel]: 19,
      [zlib.constants.ZSTD_c_windowLog]: 27,
      [zlib.constants.ZSTD_c_enableLongDistanceMatching]: 1,
    },
  });
}

function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; }

if (!isMainThread) {
  const { src, year, tmp } = workerData;
  pass1(src, year, tmp).then(n => parentPort.postMessage(n));
} else {
  const [src, outArg] = process.argv.slice(2);
  if (!src) { console.error('用法：node scripts/build-reading-dataset.mjs <下载目录> [输出目录]'); process.exit(1); }
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const out = outArg ?? join(root, 'public/reading-v4');
  const manifest = JSON.parse(readFileSync(join(src, 'MANIFEST.json'), 'utf8'));
  const years = manifest.files.map(f => f.year);
  const tmp = join(tmpdir(), 'reading-v4-tmp');
  mkdirSync(tmp, { recursive: true });

  // 第一遍：多线程逐年解析
  const queue = years.filter(y => !existsSync(join(tmp, `${y}.body.bin`)));
  const runOne = () => {
    const year = queue.shift();
    if (year === undefined) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const w = new Worker(fileURLToPath(import.meta.url), { workerData: { src, year, tmp } });
      w.once('message', n => { console.log(`第一遍 ${year}：${n} 张盘`); resolve(); });
      w.once('error', reject);
    }).then(runOne);
  };
  await Promise.all(Array.from({ length: Math.max(1, cpus().length) }, runOne));

  // 统计每一行出现在几个年份，≥2 个年份的行进共用档
  const yearCount = new Map();
  for (const y of years) {
    for (const l of JSON.parse(readFileSync(join(tmp, `${y}.lines.json`), 'utf8'))) {
      yearCount.set(l, (yearCount.get(l) ?? 0) + 1);
    }
  }
  const common = [...yearCount.keys()].filter(l => yearCount.get(l) >= 2);
  const commonId = new Map(common.map((l, i) => [l, i]));
  yearCount.clear();

  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'common.zst'), zstd(Buffer.concat([Buffer.from('ZWC1'), Buffer.from(common.join('\n'))])));

  // 第二遍：把本地编号换成「共用 / 本年独有」编号，压缩输出
  let total = 0, charts = 0;
  for (const y of years) {
    const lines = JSON.parse(readFileSync(join(tmp, `${y}.lines.json`), 'utf8'));
    const meta = JSON.parse(readFileSync(join(tmp, `${y}.charts.json`), 'utf8'));
    const src1 = readFileSync(join(tmp, `${y}.body.bin`));
    const localId = new Map();
    const local = [];
    const remap = lines.map(l => {
      const c = commonId.get(l);
      if (c !== undefined) return c * 2;
      let id = localId.get(l);
      if (id === undefined) { id = local.length; localId.set(l, id); local.push(l); }
      return id * 2 + 1;
    });
    const body = [];
    const pos = { i: 0 };
    const header = { v: 1, year: y, charts: [] };
    for (const m of meta) {
      header.charts.push([...m, body.length]);
      for (let t = 0; t < TOPICS.length; t++) {
        const n = readVarint(src1, pos);
        pushVarint(body, n);
        for (let k = 0; k < n; k++) pushVarint(body, remap[readVarint(src1, pos)]);
      }
    }
    if (pos.i !== src1.length) throw new Error(`${y} 正文长度不符`);
    const head = Buffer.from(JSON.stringify(header));
    const localBuf = Buffer.from(local.join('\n'));
    const blob = zstd(Buffer.concat([Buffer.from('ZWR1'), u32(head.length), head, u32(localBuf.length), localBuf, Buffer.from(body)]));
    writeFileSync(join(out, `${y}.zst`), blob);
    total += blob.length;
    charts += meta.length;
    console.log(`输出 ${y}.zst：${(blob.length / 1e6).toFixed(2)} MB，${meta.length} 张盘，本年独有 ${local.length} 行`);
  }

  writeFileSync(join(out, 'manifest.json'), JSON.stringify({
    source: 'https://github.com/Renhuai123/ziwei-doushu/releases/tag/v4.0-13d',
    contentVersion: manifest.contentVersion,
    license: 'CC BY 4.0（数据集）；内含倪海厦《天纪》引文适用 CC BY-NC-SA 4.0',
    topics: TOPICS,
    years: [years[0], years[years.length - 1]],
    charts,
    commonLines: common.length,
  }, null, 1));
  rmSync(tmp, { recursive: true, force: true });
  console.log(`完成：${charts} 张盘，共用 ${common.length} 行，年份档合计 ${(total / 1e6).toFixed(1)} MB`);
}
