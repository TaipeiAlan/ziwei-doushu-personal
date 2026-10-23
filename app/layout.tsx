import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import ZhHantConverter from '@/components/ZhHantConverter';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: '紫微命盘 · 倪海厦正宗紫微斗数',
  description: '基于倪海厦正宗紫微斗数体系，AI深度解读您的命盘格局、大限流年、感情事业财富健康全方位解析',
  keywords: '紫微斗数, 倪海厦, 紫微斗数全集, 紫微斗数全书, 骨髓赋, 命盘, 命理, 14主星, 12宫位',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '紫微命盘 · 倪海厦正宗紫微斗数',
    description: '基于倪海厦正宗紫微斗数体系，AI深度解读您的命盘格局、大限流年、感情事业财富健康全方位解析',
    url: SITE_URL,
    siteName: '紫微研究',
    locale: 'zh_TW',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant-TW" suppressHydrationWarning>
      <head>
        {/* 繁体转换完成前先隐藏页面；没有 JS 时不隐藏，JS 出错时 3 秒后照常显示 */}
        <style dangerouslySetInnerHTML={{ __html: 'html.zh-pending body{visibility:hidden}' }} />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('zh-pending');setTimeout(function(){document.documentElement.classList.remove('zh-pending')},3000);" }} />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ziwei-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }} />
      </head>
      <body className="min-h-screen">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <ZhHantConverter />
      </body>
    </html>
  );
}
