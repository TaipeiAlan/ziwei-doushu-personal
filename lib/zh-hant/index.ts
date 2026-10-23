/**
 * 简 → 繁（台湾）转换
 *
 * 排盘引擎与 iztro 内部一律使用简体（星曜、宫位名都是查表用的 key），
 * 所以不改原始码，只在显示层把 DOM 文字转成繁体（见 components/ZhHantConverter.tsx）。
 * 字典由 scripts/gen-zh-hant-dict.mjs 依站内文字裁剪产生。
 */

import { ConverterFactory } from 'opencc-js/core';
import { STAGE1, STAGE2 } from './dict.generated';

export const toHant = ConverterFactory([[STAGE1]], [[STAGE2]]);

let hantToHans: Map<string, string> | null = null;

/** 繁 → 简（逐字）。古籍搜索等需要拿用户输入去比对简体资料时使用 */
export function toHans(text: string): string {
  if (!hantToHans) {
    hantToHans = new Map();
    for (const entry of STAGE1.split('|')) {
      const [from, ...tos] = entry.split(' ');
      if (from.length !== 1) continue;
      for (const to of tos) if (to.length === 1 && !hantToHans.has(to)) hantToHans.set(to, from);
    }
  }
  return Array.from(text, ch => hantToHans!.get(ch) ?? ch).join('');
}
