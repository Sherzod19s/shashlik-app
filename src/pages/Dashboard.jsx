import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../lib/store.js';
import { dashboardStats, fmt, fmtDateShort, plural, orderStatusBadge, today } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Stat, Badge } from '../components/ui.jsx';

export default function Dashboard() {
  const db = useDB();
  const navigate = useNavigate();
  const s = dashboardStats(db);
  const recent = [...db.orders].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
  const profitSign = s.profit >= 0 ? '+' : '';

  // Group upcoming/overdue deliveries
  const deliveries = useMemo(() => {
    const todayStr = today();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    const overdue = [];
    const todayList = [];
    const tomorrowList = [];

    db.orders.forEach((o) => {
      if (o.status === 'paid') return;
      if (!o.deliveryDate) return;
      if (o.deliveryDate < todayStr) {
        if (o.status === 'pending') overdue.push(o);
      } else if (o.deliveryDate === todayStr) {
        todayList.push(o);
      } else if (o.deliveryDate === tomorrowStr) {
        tomorrowList.push(o);
      }
    });

    overdue.sort((a, b) => (a.deliveryDate || '').localeCompare(b.deliveryDate || ''));
    return { overdue, today: todayList, tomorrow: tomorrowList };
  }, [db.orders]);

  const totalUpcoming = deliveries.overdue.length + deliveries.today.length + deliveries.tomorrow.length;

  return (
    <>
      <Header title="Главная" subtitle="Шашлычный бизнес" />
      <div className="p-4">
        {/* Hero card */}
        <div
          className="rounded-xl p-5 mb-3 text-white"
          style={{ background: 'linear-gradient(135deg, #B5421E, #8B3216)' }}
        >
          <div className="text-xs uppercase tracking-wider opacity-85">Чистая прибыль</div>
          <div className="text-3xl font-bold mt-1 num -tracking-tight">
            {profitSign}{fmt(s.profit)}
          </div>
          <div className="text-[13px] opacity-85 mt-1.5">
            Доход {fmt(s.revenue)} − Расход {fmt(s.costs)}
          </div>
        </div>

        {/* Today's deliveries — show only if there's something */}
        {totalUpcoming > 0 && (
          <>
            <div className="flex justify-between items-center mt-5 mb-2">
              <div className="text-base font-bold">Доставки</div>
              <div className="text-ink-3 text-sm">{totalUpcoming}</div>
            </div>
            <div className="flex flex-col gap-2 mb-3">
              {deliveries.overdue.map((o) => (
                <DeliveryItem key={o.id} order={o} db={db} tone="overdue" onClick={() => navigate(`/orders/${o.id}`)} />
              ))}
              {deliveries.today.map((o) => (
                <DeliveryItem key={o.id} order={o} db={db} tone="today" onClick={() => navigate(`/orders/${o.id}`)} />
              ))}
              {deliveries.tomorrow.map((o) => (
                <DeliveryItem key={o.id} order={o} db={db} tone="tomorrow" onClick={() => navigate(`/orders/${o.id}`)} />
              ))}
            </div>
          </>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <Stat label="Доход" value={fmt(s.revenue)} sub={`Получено: ${fmt(s.cashIn)}`} tone="success" />
          <Stat label="Расход" value={fmt(s.costs)} sub={`Выплачено: ${fmt(s.cashOut)}`} tone="danger" />
          <Stat label="Долг клиентов" value={fmt(s.ar)} sub="К получению" tone="warning" />
          <Stat label="Долг поставщикам" value={fmt(s.ap)} sub="К оплате" tone="info" />
        </div>

        <div className="text-base font-bold mt-5 mb-2">Быстрые действия</div>
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <QuickButton icon="📝" label="Новый заказ" onClick={() => navigate('/orders/new')} />
          <QuickButton icon="🥩" label="Закупка мяса" onClick={() => navigate('/purchases/new')} />
          <QuickButton icon="📊" label="Аналитика" onClick={() => navigate('/analytics')} />
          <QuickButton icon="👥" label="Клиенты" onClick={() => navigate('/customers')} />
          <QuickButton icon="⚙️" label="Настройки" onClick={() => navigate('/settings')} />
        </div>

        <div className="flex justify-between items-center mt-5 mb-2">
          <div className="text-base font-bold">Последние заказы</div>
          {s.pending > 0 && <div className="text-ink-3 text-sm">{s.pending} в ожидании</div>}
        </div>

        {recent.length === 0 ? (
          <div className="card text-center text-ink-2 py-6">
            Заказов пока нет.
            <div className="mt-2.5">
              <button className="btn btn-sm" onClick={() => navigate('/orders/new')}>
                Создать первый заказ
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recent.map((o) => (
              <OrderListItem key={o.id} order={o} db={db} onClick={() => navigate(`/orders/${o.id}`)} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function DeliveryItem({ order, db, tone, onClick }) {
  const customer = db.customers.find((c) => c.id === order.customerId);
  const tones = {
    overdue: { label: `Просрочено (${fmtDateShort(order.deliveryDate)})`, cls: 'bg-danger/10 text-danger border-danger/30' },
    today: { label: 'Сегодня', cls: 'bg-ember-light text-ember border-ember/30' },
    tomorrow: { label: 'Завтра', cls: 'bg-warn-light text-warn border-warn/30' },
  };
  const t = tones[tone];
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-3.5 cursor-pointer active:opacity-80 flex justify-between items-center gap-2 ${t.cls}`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5">{t.label}</div>
        <div className="font-semibold text-[15px] truncate text-ink">
          {customer ? customer.name : 'Удалённый клиент'}
        </div>
        <div className="text-[13px] text-ink-2">
          {(order.items || []).length}{' '}
          {plural((order.items || []).length, 'позиция', 'позиции', 'позиций')}
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-[15px] num text-ink">{fmt(order.total)}</div>
      </div>
    </div>
  );
}

function QuickButton({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-surface border border-border rounded-xl p-3.5 cursor-pointer flex items-center gap-2.5 text-left text-sm font-semibold text-ink active:bg-surface2"
    >
      <span className="text-xl">{icon}</span>
      {label}
    </button>
  );
}

function OrderListItem({ order, db, onClick }) {
  const customer = db.customers.find((c) => c.id === order.customerId);
  const badge = orderStatusBadge(order);
  return (
    <div
      onClick={onClick}
      className="card p-3.5 mb-0 cursor-pointer active:bg-surface2 flex justify-between items-center gap-2"
    >
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[15px] truncate">
          {customer ? customer.name : 'Удалённый клиент'}
        </div>
        <div className="text-[13px] text-ink-2">
          {(order.items || []).length}{' '}
          {plural((order.items || []).length, 'позиция', 'позиции', 'позиций')} •{' '}
          {fmtDateShort(order.date)}
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-[15px] num">{fmt(order.total)}</div>
        <div className="mt-1">
          <Badge className={badge.cls}>{badge.label}</Badge>
        </div>
      </div>
    </div>
  );
}
