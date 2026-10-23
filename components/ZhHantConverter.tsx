'use client';

/**
 * 把页面上的简体文字即时转成繁体（台湾）。
 *
 * 在 hydration 之后才动 DOM，并用 MutationObserver 跟上 React 后续的更新；
 * 只改显示文字，不碰 <input>/<textarea> 里用户输入的值。
 * 转换完成前 <html> 带 zh-pending class（由 layout 的内联脚本加上）用来隐藏页面，避免闪出简体。
 */

import { useEffect } from 'react';
import { toHant } from '@/lib/zh-hant';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'CODE', 'PRE']);
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const HAN = /[㐀-鿿]/;

function convertText(node: Text) {
  const v = node.nodeValue;
  if (!v || !HAN.test(v)) return;
  const parent = node.parentElement;
  if (parent && (SKIP_TAGS.has(parent.tagName) || parent.isContentEditable)) return;
  const t = toHant(v);
  if (t !== v) node.nodeValue = t;
}

function convertAttrs(el: Element) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && HAN.test(v)) {
      const t = toHant(v);
      if (t !== v) el.setAttribute(a, t);
    }
  }
}

function convertTree(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return convertText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (SKIP_TAGS.has(el.tagName)) return;
  convertAttrs(el);
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n.nodeType === Node.TEXT_NODE) convertText(n as Text);
    else convertAttrs(n as Element);
  }
}

function convertTitle() {
  const t = toHant(document.title);
  if (t !== document.title) document.title = t;
}

export default function ZhHantConverter() {
  useEffect(() => {
    convertTree(document.body);
    convertTitle();
    document.documentElement.classList.remove('zh-pending');

    const observer = new MutationObserver(records => {
      for (const r of records) {
        if (r.type === 'characterData') convertText(r.target as Text);
        else if (r.type === 'attributes') convertAttrs(r.target as Element);
        else r.addedNodes.forEach(convertTree);
      }
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRS,
    });
    const titleObserver = new MutationObserver(convertTitle);
    titleObserver.observe(document.head, { childList: true, characterData: true, subtree: true });

    return () => {
      observer.disconnect();
      titleObserver.disconnect();
    };
  }, []);

  return null;
}
