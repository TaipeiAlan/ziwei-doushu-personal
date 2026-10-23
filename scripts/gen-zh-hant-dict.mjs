/**
 * 生成繁体转换用的精简字典 → lib/zh-hant/dict.generated.ts
 *
 * OpenCC 完整的 STPhrases 有 1 MB，整包送到浏览器太重。
 * 这里只保留「站内原始码 + iztro 简中语系」实际出现过的词组，
 * 单字表（STCharacters）与台湾异体字表则全部保留，用户自行输入的姓名也能转换。
 *
 * 转换流程与 OpenCC 的 cn → tw 相同：[STPhrases, STCharacters] → [TWVariantsPhrases, TWVariants]
 * 由 npm run build 前的 prebuild 自动执行；原始码文字有变动时重新产生即可。
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DICT_DIR = join(ROOT, 'node_modules/opencc-js/dist/esm-lib/dict');
const OUT = join(ROOT, 'lib/zh-hant/dict.generated.ts');

function loadDict(name) {
  const src = readFileSync(join(DICT_DIR, `${name}.js`), 'utf8');
  const m = src.match(/export default "([\s\S]*)";?\s*$/);
  if (!m) throw new Error(`无法解析字典 ${name}`);
  return JSON.parse(`"${m[1]}"`).split('|').filter(Boolean);
}

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some(e => name.endsWith(e)) && !name.endsWith('.generated.ts')) out.push(p);
  }
  return out;
}

const files = [
  ...['app', 'components', 'lib'].flatMap(d => walk(join(ROOT, d), ['.ts', '.tsx'])),
  ...walk(join(ROOT, 'node_modules/iztro/lib/i18n/locales/zh-CN'), ['.js', '.json']),
];
const corpus = files.map(f => readFileSync(f, 'utf8')).join('\n');

// 紫微斗数用语与台湾惯用字的修正（OpenCC 预设：斗→鬥、干→幹、台→臺、冲→衝）
const OVERRIDES = [
  '斗 斗', '干 干', '台 台', '冲 沖',
  '台湾 台灣', '台辅 台輔',
  '冲动 衝動', '冲突 衝突', '冲击 衝擊', '冲劲 衝勁', '冲任 衝任', '气冲 氣衝', '上冲 上衝',
];
// 「年干起紫微」会被切成「干起 → 幹起」，直接去掉
const DROPPED = ['干起'];
const overridden = new Set([...OVERRIDES, ...DROPPED].map(e => e.split(' ')[0]));
const keep = entry => !overridden.has(entry.split(' ')[0]);

const phrases = loadDict('STPhrases')
  .filter(entry => keep(entry) && corpus.includes(entry.split(' ')[0]))
  // 台湾惯用「台」（平台、台北、三台），不用「臺」
  .map(entry => entry.replace(/臺/g, '台'));
const stage1 = [...phrases, ...loadDict('STCharacters').filter(keep), ...OVERRIDES].join('|');
const stage2 = [...loadDict('TWVariantsPhrases'), ...loadDict('TWVariants')].join('|');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  `// 由 scripts/gen-zh-hant-dict.mjs 自动生成，请勿手动修改\n` +
  `// 来源：OpenCC（Apache-2.0），经 opencc-js 取得\n\n` +
  `export const STAGE1 = ${JSON.stringify(stage1)};\n\n` +
  `export const STAGE2 = ${JSON.stringify(stage2)};\n`,
);

console.log(`zh-hant 字典：保留 ${phrases.length} 条词组，输出 ${(readFileSync(OUT).length / 1024).toFixed(1)} KB`);
