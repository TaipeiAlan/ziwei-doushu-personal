import Link from 'next/link';

export const metadata = { title: '隐私政策 · 紫微命盘', description: '紫微命盘隐私政策' };

export default function PrivacyPage() {
  return (
    <>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--bg-0)', borderBottom: '1px solid var(--bdr)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--tx-3)', textDecoration: 'none' }}>
          <span style={{ fontSize: '16px' }}>‹</span>
          <span>返回首页</span>
        </Link>
        <div style={{ width: '1px', height: '20px', background: 'var(--bdr-med)' }} />
        <span style={{ fontSize: '12px', color: 'var(--ac)', letterSpacing: '0.2em' }}>紫微命盘</span>
      </header>
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '60px 24px 80px', color: 'var(--tx-1)', lineHeight: 1.8 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>隐私政策</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>最后更新：2026年10月</p>

        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. 不收集个人资料</h2>
        <p>
          本站是纯静态网站，没有帐号、没有后端伺服器，也没有任何统计或广告追踪。
          你输入的姓名与出生资料<strong>只在你的浏览器里计算</strong>，不会上传到任何地方。
        </p>

        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. 解读资料的下载</h2>
        <p>
          显示十三主题解读时，浏览器会向本站下载「共用资料档」与<strong>出生年份</strong>对应的资料档。
          网站主机（GitHub Pages）的存取纪录因此可能看到「哪一年的档案被下载」，但不会看到月、日、时辰、性别或姓名。
        </p>

        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. 浏览器本地储存</h2>
        <p>
          本站使用浏览器的 localStorage 记住主题（亮色 / 暗色）与排盘设定，资料只存在你自己的装置上；
          清除浏览器网站资料即可删除。
        </p>

        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>4. 网站主机</h2>
        <p>
          本站由 GitHub Pages 托管，GitHub 作为主机商可能依其隐私政策记录一般存取纪录（如 IP 位址、浏览的页面）。
        </p>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <Link href="/terms" style={{ color: 'var(--ac)' }}>服务条款</Link> · <Link href="/" style={{ color: 'var(--ac)' }}>返回首页</Link>
        </p>
      </main>
    </>
  );
}
