import { useEffect, useState, useRef, createContext, useContext, useCallback } from 'react';

// ========== MODAL ==========
export function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-[100] animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface w-full max-w-[480px] rounded-t-2xl max-h-[92dvh] overflow-hidden flex flex-col animate-slide-up">
        <div className="px-4 py-3.5 border-b border-border flex justify-between items-center bg-surface">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-2xl text-ink-2 leading-none px-1 cursor-pointer bg-transparent border-none"
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div
            className="px-4 py-3 border-t border-border bg-surface flex gap-2"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ========== TOAST ==========
const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const toast = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2100);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {msg && (
        <div
          className="fixed left-1/2 -translate-x-1/2 bg-ink text-white px-4 py-2.5 rounded-full text-sm z-[200] shadow-lg animate-toast-in"
          style={{ bottom: 'calc(100px + env(safe-area-inset-bottom))' }}
        >
          {msg}
        </div>
      )}
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

// ========== CONFIRM DIALOG ==========
const ConfirmCtx = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(
    (message, opts = {}) =>
      new Promise((resolve) => {
        setState({
          message,
          confirmLabel: opts.confirmLabel || 'Удалить',
          danger: opts.danger !== false,
          resolve,
        });
      }),
    []
  );

  const handle = (result) => {
    state.resolve(result);
    setState(null);
  };

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {state && (
        <Modal
          title="Подтверждение"
          onClose={() => handle(false)}
          footer={
            <>
              <button className="btn btn-secondary flex-1" onClick={() => handle(false)}>
                Отмена
              </button>
              <button
                className={`btn flex-1 ${state.danger ? 'btn-danger' : ''}`}
                onClick={() => handle(true)}
              >
                {state.confirmLabel}
              </button>
            </>
          }
        >
          <div className="text-ink-2 text-sm">{state.message}</div>
        </Modal>
      )}
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);

// ========== BADGE ==========
export const Badge = ({ children, className = '' }) => (
  <span className={`badge ${className}`}>{children}</span>
);

// ========== FAB ==========
export function FAB({ onClick, label = 'Добавить', icon = '+' }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed w-14 h-14 rounded-full bg-ember text-white border-none text-3xl cursor-pointer z-[5] flex items-center justify-center leading-none active:scale-95 transition-transform"
      style={{
        bottom: 'calc(82px + env(safe-area-inset-bottom))',
        right: 'max(16px, calc(50% - 240px + 16px))',
        boxShadow: '0 4px 14px rgba(181, 66, 30, 0.4)',
      }}
    >
      {icon}
    </button>
  );
}

// ========== EMPTY STATE ==========
export function Empty({ icon, title, desc, action }) {
  return (
    <div className="text-center py-14 px-6 text-ink-2">
      <div className="text-5xl mb-3 opacity-40">{icon}</div>
      <div className="text-base font-semibold text-ink mb-1.5">{title}</div>
      {desc && <div className="text-sm">{desc}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ========== DETAIL ROW ==========
export const DetailRow = ({ label, value, valueClass = '' }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
    <span className="text-ink-2 text-sm">{label}</span>
    <span className={`font-semibold text-sm text-right ${valueClass}`}>{value}</span>
  </div>
);

// ========== STAT CARD ==========
export const Stat = ({ label, value, sub, tone = '' }) => {
  const toneCls =
    tone === 'success' ? 'text-ok' :
    tone === 'danger' ? 'text-danger' :
    tone === 'warning' ? 'text-warn' :
    tone === 'info' ? 'text-info' : '';
  return (
    <div className="bg-surface border border-border rounded-xl p-3.5">
      <div className="text-[11px] text-ink-2 uppercase tracking-wider font-semibold">{label}</div>
      <div className={`text-lg font-bold mt-1.5 num -tracking-tight ${toneCls}`}>{value}</div>
      {sub && <div className="text-[11px] text-ink-3 mt-0.5">{sub}</div>}
    </div>
  );
};
