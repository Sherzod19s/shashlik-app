import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB, findById } from '../lib/store.js';
import { fmt, fmtDateShort, plural, orderStatusBadge } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Badge, FAB, Empty } from '../components/ui.jsx';

export default function Orders() {
  const db = useDB();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const all = [...db.orders].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const counts = {
    all: all.length,
    pending: all.filter((o) => o.status === 'pending').length,
    unpaid: all.filter((o) => (Number(o.total) || 0) - (Number(o.paid) || 0) > 0.001).length,
    paid: all.filter((o) => o.status === 'paid' || (Number(o.total) || 0) - (Number(o.paid) || 0) <= 0.001).length,
  };

  const filtered =
    filter === 'pending' ? all.filter((o) => o.status === 'pending')
    : filter === 'unpaid' ? all.filter((o) => (Number(o.total) || 0) - (Number(o.paid) || 0) > 0.001)
    : filter === 'paid' ? all.filter((o) => o.status === 'paid' || (Number(o.total) || 0) - (Number(o.paid) || 0) <= 0.001)
    : all;

  const filterLabels = { all: 'Все', pending: 'В ожидании', unpaid: 'Не оплачены', paid: 'Оплачены' };

  return (
    <>
      <Header title="Заказы" subtitle={`Всего: ${all.length}`} />
      <div className="p-4">
        <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none pb-1">
          {['all', 'pending', 'unpaid', 'paid'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`chip ${filter === f ? 'chip-active' : ''}`}
            >
              {filterLabels[f]} {counts[f] > 0 && `(${counts[f]})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Empty
            icon="📋"
            title={filter === 'all' ? 'Заказов пока нет' : 'Нет заказов в этой категории'}
            desc={filter === 'all' ? 'Создайте первый заказ' : null}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((o) => {
              const customer = findById(db.customers, o.customerId);
              const badge = orderStatusBadge(o);
              return (
                <div
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="card mb-0 cursor-pointer active:bg-surface2 flex justify-between items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] truncate">
                      {customer ? customer.name : 'Удалённый клиент'}
                    </div>
                    <div className="text-[13px] text-ink-2">
                      {(o.items || []).length} {plural((o.items || []).length, 'позиция', 'позиции', 'позиций')} • {fmtDateShort(o.date)}
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
      </div>
      <FAB onClick={() => navigate('/orders/new')} />
    </>
  );
}
