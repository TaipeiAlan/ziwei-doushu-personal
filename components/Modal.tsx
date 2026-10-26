'use client';

/**
 * 通用弹出视窗：遮罩 + 置中面板，内容区自己捲动，不必上下捲整页。
 * 点遮罩、按 Esc 或右上角 × 关闭；打开时锁住背景捲动。
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** 标题下方、不随内容捲动的区域（如主题分页） */
  toolbar?: ReactNode;
  width?: number;
  /** 值改变时把内容区捲回顶端（例如切换主题） */
  scrollKey?: string;
  /** 内容自带标题列与关闭钮、自己处理捲动时用（如 StarDetailPanel） */
  bare?: boolean;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, toolbar, width = 760, scrollKey, bare = false, children }: ModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bodyRef.current?.scrollTo({ top: 0 }); }, [scrollKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 12,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: `min(${width}px, 100%)`, maxHeight: 'min(88vh, 100%)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg-0)', border: '1px solid var(--bdr)', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)', overflow: 'hidden',
        }}
      >
        {bare ? children : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--bdr)' }}>
              <div style={{ flex: 1, minWidth: 0, fontSize: 16, fontWeight: 700, color: 'var(--tx-0)', letterSpacing: '0.08em' }}>{title}</div>
              <button
                type="button"
                onClick={onClose}
                aria-label="关闭"
                style={{ fontSize: 22, lineHeight: 1, padding: '2px 8px', color: 'var(--tx-2)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            {toolbar && <div style={{ padding: '12px 18px 0' }}>{toolbar}</div>}
            <div ref={bodyRef} style={{ overflowY: 'auto', padding: '16px 18px 20px', overscrollBehavior: 'contain' }}>{children}</div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
