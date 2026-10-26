import Link from 'next/link';

export const metadata = { title: '服务条款 · 紫微命盘', description: '紫微命盘服务条款' };

export default function TermsPage() {
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
        <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>服务条款</h1>
        <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 32 }}>最后更新：2026年10月</p>

        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>1. 网站性质</h2>
        <p>
          本站为个人学习用途的紫微斗数排盘网站，免费、无会员、无付费功能。排盘规则与解读参考倪海厦先生《天纪》公开教学
          及《紫微斗数全书》等古籍整理，与倪海厦先生及其家属、汉唐中医均无关联。
        </p>

        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>2. 内容仅供参考</h2>
        <p>
          命理内容<strong>不保证准确</strong>，仅作文化研究与自我认识的参考，<strong>不构成任何医疗、投资、法律或重大人生决策建议</strong>。
          因使用本站内容所产生的任何后果，由使用者自行判断与承担。
        </p>

        <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 12 }}>3. 内容来源与授权</h2>
        <ul style={{ paddingLeft: 24 }}>
          <li>排盘程式：源自 Renhuai123/ziwei-doushu 开源项目（MIT 授权）</li>
          <li>十三主题解读：源自同项目公开的解读资料集 v4.0（CC BY 4.0）；其中《天纪》引文适用 CC BY-NC-SA 4.0，仅限非商业使用</li>
          <li>古籍原文：《紫微斗数全书》《紫微斗数全集》《骨髓赋》等属公有领域</li>
        </ul>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--tx-3)' }}>
          <Link href="/privacy" style={{ color: 'var(--ac)' }}>隐私政策</Link> · <Link href="/" style={{ color: 'var(--ac)' }}>返回首页</Link>
        </p>
      </main>
    </>
  );
}
