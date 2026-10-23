/**
 * v4.0 解读数据集的浏览器端查询
 *
 * 数据由 scripts/build-reading-dataset.mjs 转好放在 public/reading-v4/（格式见该脚本注释）。
 * 查询时只下载「共用行」与出生那一年的档案（各约 0.3 / 0.7 MB），在浏览器里解压还原全文；
 * 不会把月、日、时辰、性别等其他出生资料送出去。
 */

import { decompress } from 'fzstd';
import type { BirthInfo } from '@/lib/ziwei/types';
import type { TopicKey } from '@/lib/ziwei/db-analysis';

export const READING_TOPICS: TopicKey[] = [
  'overview', 'personality', 'love', 'career', 'wealth', 'health', 'family',
  'children', 'move', 'friends', 'home', 'spirit', 'parents',
];
export const READING_YEAR_RANGE = [1950, 2026] as const;

const BASE = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/reading-v4`;

interface YearShard {
  /** 键 `${月}-${日}-${时辰}-${性别0/1}` → [命宫主星, 正文偏移] */
  index: Map<string, [string | null, number]>;
  local: string[];
  body: Uint8Array;
}

export interface Reading {
  /** 数据集记录的命宫第一颗主星（空宫为 null），用来核对与本站排出的盘是否一致 */
  mingStar: string | null;
  topics: Record<TopicKey, string>;
}

async function fetchZst(name: string): Promise<Uint8Array> {
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`读取 ${name} 失败（${res.status}）`);
  return decompress(new Uint8Array(await res.arrayBuffer()));
}

function checkMagic(buf: Uint8Array, magic: string) {
  if (String.fromCharCode(...buf.subarray(0, 4)) !== magic) throw new Error('数据档格式不符');
}

let commonPromise: Promise<string[]> | null = null;
function loadCommon(): Promise<string[]> {
  commonPromise ??= fetchZst('common.zst').then(buf => {
    checkMagic(buf, 'ZWC1');
    return new TextDecoder().decode(buf.subarray(4)).split('\n');
  });
  commonPromise.catch(() => { commonPromise = null; });
  return commonPromise;
}

const yearPromises = new Map<number, Promise<YearShard>>();
function loadYear(year: number): Promise<YearShard> {
  let p = yearPromises.get(year);
  if (!p) {
    p = fetchZst(`${year}.zst`).then(buf => {
      checkMagic(buf, 'ZWR1');
      const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
      const dec = new TextDecoder();
      let at = 4;
      const headLen = view.getUint32(at, true); at += 4;
      const header = JSON.parse(dec.decode(buf.subarray(at, at + headLen))) as {
        charts: [number, number, number, number, string | null, number][];
      };
      at += headLen;
      const localLen = view.getUint32(at, true); at += 4;
      const local = dec.decode(buf.subarray(at, at + localLen)).split('\n');
      at += localLen;
      const index = new Map<string, [string | null, number]>();
      for (const [m, d, h, g, ms, off] of header.charts) index.set(`${m}-${d}-${h}-${g}`, [ms, off]);
      return { index, local, body: buf.subarray(at) };
    });
    p.catch(() => yearPromises.delete(year));
    yearPromises.set(year, p);
  }
  return p;
}

/** 出生年不在数据集范围内时回传 null */
export async function getReading(info: BirthInfo): Promise<Reading | null> {
  if (info.year < READING_YEAR_RANGE[0] || info.year > READING_YEAR_RANGE[1]) return null;
  const [common, shard] = await Promise.all([loadCommon(), loadYear(info.year)]);
  const hit = shard.index.get(`${info.month}-${info.day}-${info.hour}-${info.gender === 'female' ? 1 : 0}`);
  if (!hit) return null;

  const { body, local } = shard;
  let i = hit[1];
  const varint = () => {
    let n = 0, mul = 1, b: number;
    do { b = body[i++]; n += (b & 0x7f) * mul; mul *= 128; } while (b & 0x80);
    return n;
  };
  const topics = {} as Record<TopicKey, string>;
  for (const t of READING_TOPICS) {
    const n = varint();
    const lines: string[] = [];
    for (let k = 0; k < n; k++) {
      const ref = varint();
      lines.push(ref % 2 ? local[(ref - 1) / 2] : common[ref / 2]);
    }
    topics[t] = lines.join('\n');
  }
  return { mingStar: hit[0], topics };
}
