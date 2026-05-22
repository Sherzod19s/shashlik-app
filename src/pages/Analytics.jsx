import { useState, useMemo } from 'react';
import { useDB } from '../lib/store.js';
import { fmt, fmtQty, UNITS, plural } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Empty } from '../components/ui.jsx';

const RANGE_LABELS = { week: 'Неделя', month: 'Месяц', all: 'Всё время' };
const MONTH_NAMES = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const DOW = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function getRangeStart(range) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (range === 'week') { d.setDate(d.getDate() - 6); return d; }
  if (range === 'month') { d.setDate(d.getDate() - 29); return d; }
  return null;
}

function buildBuckets(range, orders, purchases) {
  if (range === 'all') {
    let earliest = null;
    [...orders, ...purchases].forEach((x) => {
      if (!x.date) return;
      const d = new Date(x.date);
      if (isNaN(d)) return;
      if (!earliest || d < earliest) earliest = d;
    });
    if (!earliest) return [];

    const buckets = [];
    const cur = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
    const end = new Date();
    end.setDate(1);
    end.setHours(0, 0, 0, 0);
    while (cur <= end) {
      buckets.push({
        key: `${cur.getFullYear()}-${String(cur.getMonth()).padStart(2, '0')}`,
        label: `${MONTH_NAMES[cur.getMonth()]} ${String(cur.getFullYear()).slice(2)}`,
        revenue: 0,
        expense: 0,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    const addTo = (dateStr, field, amount) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      const b = byKey.get(key);
      if (b) b[field] += amount;
    };
    orders.forEach((o) => addTo(o.date, 'revenue', Number(o.total) || 0));
    purchases.forEach((p) => addTo(p.date, 'expense', Number(p.total) || 0));
    return buckets;
  }

  const days = range === 'week' ? 7 : 30;
  const start = getRangeStart(range);
  const buckets = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    buckets.push({
      key: d.toISOString().slice(0, 10),
      label: range === 'week' ? DOW[d.getDay()] : String(d.getDate()),
      revenue: 0,
      expense: 0,
    });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  orders.forEach((o) => {
    const b = byKey.get(o.date);
    if (b) b.revenue += Number(o.total) || 0;
  });
  purchases.forEach((p) => {
    const b = byKey.get(p.date);
    if (b) b.expense += Number(p.total) || 0;
  });
  return buckets;
}

export default function Analytics() {
  const db = useDB();
  const [range, setRange] = useState('month');

  const data = useMemo(() => {
    const start = getRangeStart(range);
    const inRange = (s) => {
      if (!start) return true;
      if (!s) return false;
      const d = new Date(s);
      if (isNaN(d)) return false;
      return d >= start;
    };

    const ordersInRange = db.orders.filter((o) => inRange(o.date));
    const purchasesInRange = db.purchases.filter((p) => inRange(p.date));

    const productMap = new Map();
    let totalRevenue = 0;
    ordersInRange.forEach((o) => {
      totalRevenue += Number(o.total) || 0;
      (o.items || []).forEach((it) => {
        const key = it.productId || `__free__${it.name}`;
        const existing = productMap.get(key) || {
          name: it.name || 'Без названия',
          unit: it.unit || 'kg',
          qty: 0,
          revenue: 0,
          orderCount: 0,
        };
        const lineQty = Number(it.qty) || 0;
        existing.qty += lineQty;
        existing.revenue += lineQty * (Number(it.price) || 0);
        existing.orderCount += 1;
        productMap.set(key, existing);
      });
    });
    const products = Array.from(productMap.values()).sort((a, b) => b.qty - a.qty);
    const maxProductQty = products[0]?.qty || 0;

    const customerMap = new Map();
    ordersInRange.forEach((o) => {
      const key = o.customerId || '__unknown__';
      const customer = db.customers.find((c) => c.id === o.customerId);
      const existing = customerMap.get(key) || {
        name: customer?.name || 'Удалённый клиент',
        revenue: 0,
        orderCount: 0,
      };
      existing.revenue += Number(o.total) || 0;
      existing.orderCount += 1;
      customerMap.set(key, existing);
    });
    const customers = Array.from(customerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    const maxCustomerRevenue = customers[0]?.revenue || 0;

    const totalExpense = purchasesInRange.reduce((s, p) => s + (Number(p.total) || 0), 0);
    const profit = totalRevenue - totalExpense;

    const buckets = buildBuckets(range, ordersInRange, purchasesInRange);
    const maxBucket = buckets.reduce((m, b) => Math.max(m, b.revenue), 0);

    return {
      orderCount: ordersInRange.length,
      totalRevenue,
      totalExpense,
      profit,
      products,
      maxProductQty,
      customers,
      maxCustomerRevenue,
      buckets,
      maxBucket,
    };
  }, [db.orders, db.purchases, db.customers, range]);

  const noData = data.orderCount === 0 && data.totalExpense === 0;

  return (
    <>
      <Header title="Аналитика" back />
      <div className="p-4">
        <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-none pb-1">
          {['week', 'month', 'all'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`chip ${range === r ? 'chip-active' : ''}`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>

        {noData ? (
          <Empty
            icon="📊"
            title="Нет данных за этот период"
            desc={range === 'all' ? 'Создайте хотя бы один заказ' : 'Попробуйте другой период'}
          />
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <SummaryCard label="Заказов" value={data.orderCount} />
              <SummaryCard label="Доход" value={fmt(data.totalRevenue)} small />
              <SummaryCard
                label="Прибыль"
                value={(data.profit >= 0 ? '+' : '') + fmt(data.profit)}
                small
                tone={data.profit >= 0 ? 'ok' : 'danger'}
              />
            </div>

            {data.buckets.length > 0 && (
              <>
                <div className="text-base font-bold mb-2">Динамика дохода</div>
                <div className="card">
                  <RevenueTrend buckets={data.buckets} max={data.maxBucket} range={range} />
                </div>
              </>
            )}

            <div className="text-base font-bold mb-2 mt-2">Доход и расход</div>
            <div className="card">
              <CashFlow revenue={data.totalRevenue} expense={data.totalExpense} profit={data.profit} />
            </div>

            <div className="text-base font-bold mb-2 mt-2">Продажи по товарам</div>
            {data.products.length === 0 ? (
              <div className="card text-center text-ink-2">Нет проданных товаров</div>
            ) : (
              <div className="card">
                <div className="flex flex-col gap-3.5">
                  {data.products.map((p, i) => {
                    const pct = data.maxProductQty > 0 ? (p.qty / data.maxProductQty) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-baseline mb-1.5 gap-2">
                          <div className="font-semibold text-sm truncate flex-1 min-w-0">{p.name}</div>
                          <div className="text-sm font-bold num whitespace-nowrap">
                            {fmtQty(p.qty, p.unit)} {UNITS[p.unit] || ''}
                          </div>
                        </div>
                        <div className="h-7 bg-surface2 rounded-md overflow-hidden">
                          <div
                            className="h-full bg-ember rounded-md transition-all duration-500"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-ink-2">
                          <span>
                            {p.orderCount} {plural(p.orderCount, 'заказ', 'заказа', 'заказов')}
                          </span>
                          <span className="num">{fmt(p.revenue)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-base font-bold mb-2 mt-2">Топ клиентов</div>
            {data.customers.length === 0 ? (
              <div className="card text-center text-ink-2">Нет клиентов с заказами</div>
            ) : (
              <div className="card">
                <div className="flex flex-col gap-3.5">
                  {data.customers.map((c, i) => {
                    const pct = data.maxCustomerRevenue > 0 ? (c.revenue / data.maxCustomerRevenue) * 100 : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between items-baseline mb-1.5 gap-2">
                          <div className="font-semibold text-sm truncate flex-1 min-w-0">{c.name}</div>
                          <div className="text-sm font-bold num whitespace-nowrap">{fmt(c.revenue)}</div>
                        </div>
                        <div className="h-7 bg-surface2 rounded-md overflow-hidden">
                          <div
                            className="h-full bg-info rounded-md transition-all duration-500"
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </div>
                        <div className="text-xs text-ink-2 mt-1">
                          {c.orderCount} {plural(c.orderCount, 'заказ', 'заказа', 'заказов')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="text-center text-ink-3 text-xs mt-6">
          Учитываются заказы и закупки в выбранном периоде.
        </div>
      </div>
    </>
  );
}

function SummaryCard({ label, value, small, tone }) {
  const toneCls = tone === 'ok' ? 'text-ok' : tone === 'danger' ? 'text-danger' : '';
  return (
    <div className="bg-surface border border-border rounded-xl p-3 text-center">
      <div className="text-[11px] text-ink-2 uppercase tracking-wider font-semibold">{label}</div>
      <div className={`font-bold mt-1 num ${small ? 'text-[13px]' : 'text-base'} ${toneCls}`}>{value}</div>
    </div>
  );
}

function RevenueTrend({ buckets, max, range }) {
  const labelStep = range === 'month' ? 5 : 1;
  return (
    <div>
      <div className="flex items-end gap-1 h-32 mb-2">
        {buckets.map((b, i) => {
          const pct = max > 0 ? (b.revenue / max) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col justify-end min-w-0">
              <div
                className={`rounded-t-sm w-full ${b.revenue > 0 ? 'bg-ember' : 'bg-surface2'}`}
                style={{
                  height: `${Math.max(pct, 1)}%`,
                  minHeight: b.revenue > 0 ? '3px' : '2px',
                }}
                title={`${b.label}: ${fmt(b.revenue)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1 text-[10px] text-ink-3">
        {buckets.map((b, i) => (
          <div key={i} className="flex-1 text-center truncate">
            {i % labelStep === 0 ? b.label : ''}
          </div>
        ))}
      </div>
    </div>
  );
}

function CashFlow({ revenue, expense, profit }) {
  const max = Math.max(revenue, expense, 1);
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <div className="text-sm font-semibold">Доход</div>
          <div className="text-sm font-bold num text-ok">{fmt(revenue)}</div>
        </div>
        <div className="h-7 bg-surface2 rounded-md overflow-hidden">
          <div className="h-full bg-ok rounded-md" style={{ width: `${(revenue / max) * 100}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <div className="text-sm font-semibold">Расход</div>
          <div className="text-sm font-bold num text-danger">{fmt(expense)}</div>
        </div>
        <div className="h-7 bg-surface2 rounded-md overflow-hidden">
          <div className="h-full bg-danger rounded-md" style={{ width: `${(expense / max) * 100}%` }} />
        </div>
      </div>
      <div className="border-t border-border pt-3 flex justify-between items-center">
        <div className="font-semibold">Прибыль</div>
        <div className={`text-lg font-bold num ${profit >= 0 ? 'text-ok' : 'text-danger'}`}>
          {profit >= 0 ? '+' : ''}{fmt(profit)}
        </div>
      </div>
    </div>
  );
}
