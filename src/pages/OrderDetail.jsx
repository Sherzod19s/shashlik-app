import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useDB, findById, recordOrderPayment, markOrderDelivered, deleteOrder as deleteO } from '../lib/store.js';
import { fmt, fmtPlain, fmtDate, orderStatusBadge, num, UNITS } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Badge, DetailRow, useToast, useConfirm } from '../components/ui.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const toast = useToast();
  const confirm = useConfirm();
  const o = findById(db.orders, id);
  if (!o) return <Navigate to="/orders" replace />;

  const c = findById(db.customers, o.customerId);
  const balance = (Number(o.total) || 0) - (Number(o.paid) || 0);
  const badge = orderStatusBadge(o);
  const [payAmount, setPayAmount] = useState(balance > 0 ? fmtPlain(balance) : '');

  const onPay = () => {
    const amt = num(payAmount);
    if (amt <= 0) return toast('Введите сумму');
    recordOrderPayment(o.id, amt);
    toast(`Получено: ${fmt(amt)}`);
    setPayAmount('');
  };

  const onMarkDelivered = () => {
    markOrderDelivered(o.id);
    toast('Отмечено доставленным');
  };

  const onDelete = async () => {
    if (await confirm('Удалить этот заказ?')) {
      deleteO(o.id);
      toast('Удалено');
      navigate('/orders');
    }
  };

  return (
    <>
      <Header
        title="Заказ"
        subtitle={fmtDate(o.date)}
        back
        action={{ label: 'Изменить', onClick: () => navigate(`/orders/${o.id}/edit`) }}
      />
      <div className="p-4">
        <div className="card">
          <div className="flex justify-between items-center mb-2.5">
            <div className="font-semibold text-base">{c ? c.name : 'Удалённый клиент'}</div>
            <Badge className={badge.cls}>{badge.label}</Badge>
          </div>
          {c && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/customers/${c.id}`)}>
              Открыть карточку клиента
            </button>
          )}
        </div>

        <div className="card">
          <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Позиции</div>
          {(o.items || []).map((it, i) => (
            <div key={i} className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
              <div>
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-ink-2 num">
                  {fmtPlain(it.qty)} {UNITS[it.unit] || ''} × {fmtPlain(it.price)} смн
                </div>
              </div>
              <div className="font-semibold text-sm num">{fmt(it.qty * it.price)}</div>
            </div>
          ))}
          <div className="flex justify-between items-center py-2.5 font-bold text-base">
            <span>Итого</span>
            <span className="num">{fmt(o.total)}</span>
          </div>
        </div>

        <div className="card">
          <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Оплата</div>
          <DetailRow label="Получено" value={<span className="num text-ok">{fmt(o.paid || 0)}</span>} />
          <DetailRow
            label={<span className="font-semibold text-ink">Долг</span>}
            value={
              <span className={`num text-base ${balance > 0.001 ? 'text-danger' : 'text-ok'}`}>{fmt(balance)}</span>
            }
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
                placeholder="Сумма к получению"
              />
              <button className="btn" onClick={onPay}>Получено</button>
            </div>
          )}
        </div>

        {o.deliveryDate && (
          <div className="card">
            <DetailRow label="Дата доставки" value={fmtDate(o.deliveryDate)} />
          </div>
        )}

        {o.note && (
          <div className="card">
            <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Заметка</div>
            <div>{o.note}</div>
          </div>
        )}

        <div className="mt-6">
          {o.status !== 'delivered' && o.status !== 'paid' && (
            <button className="btn btn-secondary w-full mb-2" onClick={onMarkDelivered}>
              Отметить доставленным
            </button>
          )}
          <button className="btn btn-danger w-full" onClick={onDelete}>Удалить заказ</button>
        </div>
      </div>
    </>
  );
}
