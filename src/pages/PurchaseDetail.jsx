import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useDB, findById, recordPurchasePayment, deletePurchase as deleteP } from '../lib/store.js';
import { fmt, fmtPlain, fmtQty, fmtDate, purchaseStatusBadge, num, UNITS } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Badge, DetailRow, useToast, useConfirm } from '../components/ui.jsx';

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const toast = useToast();
  const confirm = useConfirm();
  const p = findById(db.purchases, id);
  if (!p) return <Navigate to="/purchases" replace />;

  const s = findById(db.suppliers, p.supplierId);
  const balance = (Number(p.total) || 0) - (Number(p.paid) || 0);
  const badge = purchaseStatusBadge(p);
  const [payAmount, setPayAmount] = useState(balance > 0 ? fmtPlain(balance) : '');

  const onPay = () => {
    const amt = num(payAmount);
    if (amt <= 0) return toast('Введите сумму');
    recordPurchasePayment(p.id, amt);
    toast(`Выплачено: ${fmt(amt)}`);
    setPayAmount('');
  };

  const onDelete = async () => {
    if (await confirm('Удалить эту закупку?')) {
      deleteP(p.id);
      toast('Удалено');
      navigate('/purchases');
    }
  };

  return (
    <>
      <Header
        title="Закупка"
        subtitle={fmtDate(p.date)}
        back
        action={{ label: 'Изменить', onClick: () => navigate(`/purchases/${p.id}/edit`) }}
      />
      <div className="p-4">
        <div className="card">
          <div className="flex justify-between items-center mb-2.5">
            <div className="font-semibold text-base">{s ? s.name : 'Удалён'}</div>
            <Badge className={badge.cls}>{badge.label}</Badge>
          </div>
          {s && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/suppliers/${s.id}`)}>
              Открыть карточку поставщика
            </button>
          )}
        </div>

        <div className="card">
          <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Позиции</div>
          {(p.items || []).map((it, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-ink-2 num">
                  {fmtQty(it.qty, it.unit)} {UNITS[it.unit] || ''} × {fmtPlain(it.price)} смн
                </div>
              </div>
              <div className="font-semibold text-sm num">{fmt(it.qty * it.price)}</div>
            </div>
          ))}
          <div className="flex justify-between items-center py-2.5 font-bold text-base">
            <span>Итого</span>
            <span className="num">{fmt(p.total)}</span>
          </div>
        </div>

        <div className="card">
          <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Оплата поставщику</div>
          <DetailRow label="Выплачено" value={<span className="num text-ok">{fmt(p.paid || 0)}</span>} />
          <DetailRow
            label={<span className="font-semibold text-ink">К оплате</span>}
            value={<span className={`num text-base ${balance > 0.001 ? 'text-danger' : 'text-ok'}`}>{fmt(balance)}</span>}
          />
          {balance > 0.001 && (
            <div className="flex gap-2 mt-2">
              <input
                className="input flex-1"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="Сумма выплаты"
              />
              <button className="btn" onClick={onPay}>Выплачено</button>
            </div>
          )}
        </div>

        {p.note && (
          <div className="card">
            <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Заметка</div>
            <div>{p.note}</div>
          </div>
        )}

        <button className="btn btn-danger w-full mt-6" onClick={onDelete}>Удалить закупку</button>
      </div>
    </>
  );
}
