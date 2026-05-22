// ====== FORMATTERS ======
export const fmt = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' смн';
};

export const fmtPlain = (n) => {
  const v = Number(n) || 0;
  return v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Quantity formatter — integer for pieces, 2 decimals for kg
export const fmtQty = (n, unit) => {
  const v = Number(n) || 0;
  if (unit === 'pc') {
    if (v % 1 === 0) return String(Math.round(v));
    return v.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
  }
  return v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const fmtDate = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const fmtDateShort = (s) => {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

export const today = () => new Date().toISOString().slice(0, 10);

export const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? 0 : n;
};

// Russian plural rules: 1 заказ, 2 заказа, 5 заказов
export const plural = (n, one, few, many) => {
  const m = Math.abs(n) % 100;
  if (m >= 11 && m <= 14) return many;
  const r = m % 10;
  if (r === 1) return one;
  if (r >= 2 && r <= 4) return few;
  return many;
};

// ====== CONSTANTS ======
export const UNITS = { kg: 'кг', pc: 'шт' };
export const STATUS_LABEL = { pending: 'В ожидании', delivered: 'Доставлен', paid: 'Оплачен' };
export const CTYPE_LABEL = { restaurant: 'Ресторан', household: 'Частное лицо', event: 'Мероприятие' };

// ====== CALCULATIONS ======
export const customerBalance = (db, customerId) =>
  db.orders
    .filter((o) => o.customerId === customerId)
    .reduce((sum, o) => sum + (Number(o.total) || 0) - (Number(o.paid) || 0), 0);

export const supplierBalance = (db, supplierId) =>
  db.purchases
    .filter((p) => p.supplierId === supplierId)
    .reduce((sum, p) => sum + (Number(p.total) || 0) - (Number(p.paid) || 0), 0);

export const dashboardStats = (db) => {
  let revenue = 0, costs = 0, cashIn = 0, cashOut = 0, ar = 0, ap = 0, pending = 0;
  db.orders.forEach((o) => {
    revenue += Number(o.total) || 0;
    cashIn += Number(o.paid) || 0;
    ar += (Number(o.total) || 0) - (Number(o.paid) || 0);
    if (o.status === 'pending') pending++;
  });
  db.purchases.forEach((p) => {
    costs += Number(p.total) || 0;
    cashOut += Number(p.paid) || 0;
    ap += (Number(p.total) || 0) - (Number(p.paid) || 0);
  });
  return { revenue, costs, profit: revenue - costs, cashIn, cashOut, ar, ap, pending };
};

export const orderStatusBadge = (o) => {
  const balance = (Number(o.total) || 0) - (Number(o.paid) || 0);
  if (o.status === 'paid' || balance <= 0.001) return { label: 'Оплачен', cls: 'bg-ok-light text-ok' };
  if (Number(o.paid) > 0) return { label: 'Частично', cls: 'bg-ember-light text-ember' };
  if (o.status === 'delivered') return { label: 'Доставлен', cls: 'bg-info-light text-info' };
  return { label: 'В ожидании', cls: 'bg-warn-light text-warn' };
};

export const purchaseStatusBadge = (p) => {
  const balance = (Number(p.total) || 0) - (Number(p.paid) || 0);
  if (balance <= 0.001) return { label: 'Оплачено', cls: 'bg-ok-light text-ok' };
  if (Number(p.paid) > 0) return { label: 'Частично', cls: 'bg-ember-light text-ember' };
  return { label: 'К оплате', cls: 'bg-warn-light text-warn' };
};

// ====== DEMO DATA ======
// Products sold per piece (шт) — typical Tajikistan shashlik pricing
// Raw meat purchases stay in kg (that's how butchers sell)
export const buildDemoData = () => {
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const p1 = { id: uid(), name: 'Шашлык из баранины', price: 25, unit: 'pc', note: 'Маринад с луком и специями' };
  const p2 = { id: uid(), name: 'Шашлык из говядины', price: 20, unit: 'pc', note: '' };
  const p3 = { id: uid(), name: 'Шашлык из курицы', price: 15, unit: 'pc', note: '' };
  const p4 = { id: uid(), name: 'Люля-кебаб', price: 20, unit: 'pc', note: '' };

  const c1 = { id: uid(), name: 'Ресторан "Чайхона №1"', type: 'restaurant', phone: '+992 90 123 45 67', address: 'Душанбе, ул. Рудаки 25', note: '' };
  const c2 = { id: uid(), name: 'Кафе "Восток"', type: 'restaurant', phone: '+992 91 234 56 78', address: '', note: '' };
  const c3 = { id: uid(), name: 'Ахмад (свадьба)', type: 'event', phone: '+992 92 345 67 89', address: '', note: 'Свадьба 25.07' };
  const c4 = { id: uid(), name: 'Семья Каримовых', type: 'household', phone: '+992 93 456 78 90', address: '', note: '' };

  const s1 = { id: uid(), name: 'Мясник Ахмад', phone: '+992 90 111 22 33', address: 'Рынок Шохмансур', note: 'Баранина и говядина' };
  const s2 = { id: uid(), name: 'Фарход (курица)', phone: '+992 91 222 33 44', address: '', note: '' };

  const mkOrder = (cust, items, status, paid, dayOffset) => {
    const total = items.reduce((sum, it) => sum + it.qty * it.price, 0);
    return {
      id: uid(),
      customerId: cust.id,
      date: new Date(Date.now() - dayOffset * 86400000).toISOString().slice(0, 10),
      deliveryDate: '',
      status,
      items,
      total,
      paid,
      note: '',
    };
  };

  return {
    products: [p1, p2, p3, p4],
    customers: [c1, c2, c3, c4],
    suppliers: [s1, s2],
    orders: [
      mkOrder(c1, [
        { productId: p1.id, name: p1.name, unit: 'pc', qty: 30, price: 25 },
        { productId: p3.id, name: p3.name, unit: 'pc', qty: 20, price: 15 },
      ], 'paid', 30 * 25 + 20 * 15, 8), // 1050
      mkOrder(c2, [
        { productId: p1.id, name: p1.name, unit: 'pc', qty: 25, price: 25 },
      ], 'delivered', 200, 4), // 625, partially paid
      mkOrder(c3, [
        { productId: p1.id, name: p1.name, unit: 'pc', qty: 80, price: 25 },
        { productId: p2.id, name: p2.name, unit: 'pc', qty: 60, price: 20 },
        { productId: p4.id, name: p4.name, unit: 'pc', qty: 40, price: 20 },
      ], 'pending', 1000, 1), // 4000
      mkOrder(c4, [
        { productId: p3.id, name: p3.name, unit: 'pc', qty: 15, price: 15 },
      ], 'pending', 0, 0), // 225
    ],
    purchases: [
      {
        id: uid(),
        supplierId: s1.id,
        date: new Date(Date.now() - 9 * 86400000).toISOString().slice(0, 10),
        items: [
          { name: 'Баранина', qty: 20, price: 70, unit: 'kg' },
          { name: 'Говядина', qty: 15, price: 60, unit: 'kg' },
        ],
        total: 20 * 70 + 15 * 60,
        paid: 20 * 70 + 15 * 60,
        note: '',
      },
      {
        id: uid(),
        supplierId: s2.id,
        date: new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10),
        items: [{ name: 'Курица', qty: 12, price: 40, unit: 'kg' }],
        total: 12 * 40,
        paid: 200,
        note: '',
      },
    ],
    meta: { created: new Date().toISOString() },
  };
};
