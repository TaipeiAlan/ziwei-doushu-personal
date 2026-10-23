/**
 * /library/search?q=xxx — 搜索结果页
 */

import { Suspense } from 'react';
import SearchResults from './SearchResults';

export const metadata = {
  title: '搜索 · 古籍原典库',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg-page)', minHeight: '100vh' }} />}>
      <SearchResults />
    </Suspense>
  );
}
