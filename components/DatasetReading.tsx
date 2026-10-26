'use client';

/**
 * 13 主题命盘解读 —— 来自原作者公开的 v4.0 解读数据集（见 lib/reading/dataset.ts）
 *
 * 只下载出生年份的数据档，在浏览器里还原全文；不调用任何 AI 或后端接口。
 */

import { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import type { ZiweiChart } from '@/lib/ziwei/types';
import { TOPIC_LABEL, type TopicKey } from '@/lib/ziwei/db-analysis';
import { getReading, READING_TOPICS, READING_YEAR_RANGE, type Reading } from '@/lib/reading/dataset';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'none' }
  | { status: 'ok'; reading: Reading };

/** 只处理数据里用到的 **粗体** */
function Inline({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <strong key={i} style={{ color: 'var(--tx-0)' }}>{p}</strong> : p))}</>;
}

function ReadingText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {blocks.map((block, i) => {
        const heading = block.match(/^\*\*【(.+?)】\*\*$/);
        if (heading) {
          return (
            <h3 key={i} style={{ fontSize: 15, fontWeight: 700, color: 'var(--ac)', marginTop: i ? 12 : 0, letterSpacing: '0.08em' }}>
              {heading[1]}
            </h3>
          );
        }
        return (
          <p key={i} style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--tx-1)', whiteSpace: 'pre-wrap' }}>
            <Inline text={block} />
          </p>
        );
      })}
    </div>
  );
}

function TopicChips({ topic, onPick, wrap = false }: { topic: TopicKey | null; onPick: (t: TopicKey) => void; wrap?: boolean }) {
  return (
    <div
      style={{
        display: 'flex', gap: 6, paddingBottom: wrap ? 0 : 10,
        flexWrap: wrap ? 'wrap' : 'nowrap', overflowX: wrap ? 'visible' : 'auto',
      }}
    >
      {READING_TOPICS.map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onPick(t)}
          style={{
            flexShrink: 0, padding: '5px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
            border: `1px solid ${t === topic ? 'var(--ac)' : 'var(--bdr)'}`,
            background: t === topic ? 'rgba(184,146,42,0.12)' : 'transparent',
            color: t === topic ? 'var(--ac)' : 'var(--tx-2)',
          }}
        >
          {TOPIC_LABEL[t]}
        </button>
      ))}
    </div>
  );
}

function MismatchNote({ dataset, ours }: { dataset: string | null; ours: string | null }) {
  return (
    <p style={{ fontSize: 12, color: 'var(--tx-2)', margin: '12px 0', lineHeight: 1.7 }}>
      ⚠ 资料集记录的命宫主星为「{dataset ?? '空宫'}」，与本页排出的「{ours ?? '空宫'}」不同，解读可能对不上这张盘，请谨慎参考。
    </p>
  );
}

export default function DatasetReading({ chart }: { chart: ZiweiChart }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [topic, setTopic] = useState<TopicKey>('overview');
  // 解读全文放在弹出视窗里，页面上只留主题按钮，不必在长文里上下捲
  const [open, setOpen] = useState(false);
  const info = chart.birthInfo;

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    getReading(info)
      .then(reading => { if (!cancelled) setState(reading ? { status: 'ok', reading } : { status: 'none' }); })
      .catch(e => { if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) }); });
    return () => { cancelled = true; };
  }, [info]);

  // 数据集记录的命宫主星与本站排出的不同时提醒（引擎版本差异）
  const ming = chart.palaces.find(p => p.isMingGong);
  const ourMingStar = ming?.stars.find(s => s.type === 'major')?.name ?? null;
  const mismatch = state.status === 'ok' && state.reading.mingStar !== ourMingStar;

  return (
    <section className="card-glass rounded-xl" style={{ padding: 20, marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.1em' }}>命盘解读</h2>
        <span style={{ fontSize: 11, color: 'var(--tx-3)' }}>v4.0 解读资料集 · 13 个主题</span>
      </div>

      {state.status === 'loading' && (
        <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>正在载入 {info.year} 年的解读资料…</p>
      )}
      {state.status === 'error' && (
        <p style={{ fontSize: 13, color: 'var(--tx-2)' }}>解读资料载入失败：{state.message}</p>
      )}
      {state.status === 'none' && (
        <p style={{ fontSize: 13, color: 'var(--tx-2)', lineHeight: 1.8 }}>
          解读资料集只涵盖 {READING_YEAR_RANGE[0]}–{READING_YEAR_RANGE[1]} 年出生的命盘，这张盘不在范围内。
          本页的格局识别与星曜说明仍可参考。
        </p>
      )}

      {state.status === 'ok' && (
        <>
          <p style={{ fontSize: 12, color: 'var(--tx-3)', marginBottom: 10 }}>点主题在弹出视窗中阅读：</p>
          <TopicChips topic={open ? topic : null} onPick={t => { setTopic(t); setOpen(true); }} wrap />
          {mismatch && <MismatchNote dataset={state.reading.mingStar} ours={ourMingStar} />}
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title={`命盘解读 · ${TOPIC_LABEL[topic]}`}
            toolbar={<TopicChips topic={topic} onPick={setTopic} />}
            scrollKey={topic}
          >
            {mismatch && <MismatchNote dataset={state.reading.mingStar} ours={ourMingStar} />}
            <ReadingText text={state.reading.topics[topic]} />
          </Modal>
        </>
      )}

      <p style={{ fontSize: 11, color: 'var(--tx-3)', marginTop: 20, lineHeight: 1.7 }}>
        解读内容来自 Renhuai123/ziwei-doushu 公开的解读资料集 v4.0（CC BY 4.0；其中《天纪》引文适用 CC BY-NC-SA 4.0）。
        查询时只会向本站下载出生年份的资料档，不会上传其他出生资料。
      </p>
    </section>
  );
}
