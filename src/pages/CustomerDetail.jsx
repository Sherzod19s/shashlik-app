import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useDB, findById } from '../lib/store.js';
import { customerBalance, fmt, fmtDateShort, plural, CTYPE_LABEL, orderStatusBadge } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Badge, DetailRow } from '../components/ui.jsx';
import { CustomerForm } from './Customers.jsx';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const [editing, setEditing] = useState(false);

  const c = findById(db.customers, id);
  if (!c) return <Navigate to="/customers" replace />;

  const orders = db.orders
    .filter((o) => o.customerId === id)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const balance = customerBalance(db, id);
  const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
  const totalPaid = orders.reduce((s, o) => s + (Number(o.paid) || 0), 0);

  return (
    <>
      <Header
        title={c.name}
        subtitle={CTYPE_LABEL[c.type]}
        back
        action={{ label: 'Изменить', onClick: () => setEditing(true) }}
      />
      <div className="p-4">
        <div className="card">
          <DetailRow label="Всего заказов" value={orders.length} />
          <DetailRow label="Общая сумма" value={<span className="num">{fmt(totalRevenue)}</span>} />
          <DetailRow label="Оплачено" value={<span className="num text-ok">{fmt(totalPaid)}</span>} />
          <DetailRow
            label={<span className="font-semibold text-ink">Долг</span>}
            value={<span className={`num text-base ${balance > 0 ? 'text-danger' : ''}`}>{fmt(balance)}</span>}
          />
        </div>

        {(c.phone || c.address || c.note) && (
          <div className="card">
            {c.phone && (
              <DetailRow
                label="Телефон"
                value={<a href={`tel:${c.phone}`} className="text-ember no-underline">{c.phone}</a>}
              />
            )}
            {c.address && <DetailRow label="Адрес" value={c.address} />}
            {c.note && <DetailRow label="Заметка" value={c.note} />}
          </div>
        )}

        <div className="flex justify-between items-center mt-5 mb-2">
          <div className="text-base font-bold">Заказы</div>
          <div className="text-ink-3 text-sm">{orders.length}</div>
        </div>
        {orders.length === 0 ? (
          <div className="card text-center text-ink-2">У клиента ещё нет заказов</div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((o) => {
              const badge = orderStatusBadge(o);
              return (
                <div
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="card mb-0 cursor-pointer active:bg-surface2 flex justify-between items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px]">Заказ от {fmtDateShort(o.date)}</div>
                    <div className="text-[13px] text-ink-2">
                      {(o.items || []).length} {plural((o.items || []).length, 'позиция', 'позиции', 'позиций')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[15px] num">{fmt(o.total)}</div>
                    <div className="mt-1"><Badge className={badge.cls}>{badge.label}</Badge></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          className="btn w-full mt-4"
          onClick={() => navigate('/orders/new', { state: { customerId: c.id } })}
        >
          + Новый заказ для клиента
        </button>
      </div>
      {editing && <CustomerForm id={c.id} onClose={() => setEditing(false)} />}
    </>
  );
}
