import { useSyncExternalStore } from 'react';

const KEY = 'shashlik_db_v1';

const initial = {
  products: [],
  customers: [],
  suppliers: [],
  orders: [],
  purchases: [],
  meta: { created: new Date().toISOString() },
};

function loadInitial() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { ...initial, ...parsed };
      ['products', 'customers', 'suppliers', 'orders', 'purchases'].forEach((k) => {
        if (!Array.isArray(merged[k])) merged[k] = [];
      });
      return merged;
    }
  } catch (e) {
    /* ignore */
  }
  return { ...initial };
}

let state = loadInitial();
const listeners = new Set();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    /* ignore quota / private mode */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

function set(updater) {
  state = typeof updater === 'function' ? updater(state) : updater;
  persist();
  emit();
}

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const getSnapshot = () => state;

export function useDB() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function getDB() {
  return state;
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const byId = (arr, id) => arr.find((x) => x.id === id);

// ====== ACTIONS ======

// Products
export const saveProduct = (id, data) =>
  set((s) => ({
    ...s,
    products: id
      ? s.products.map((p) => (p.id === id ? { ...p, ...data } : p))
      : [...s.products, { id: uid(), ...data }],
  }));

export const deleteProduct = (id) =>
  set((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));

// Customers
export const saveCustomer = (id, data) => {
  const newId = id || uid();
  set((s) => ({
    ...s,
    customers: id
      ? s.customers.map((c) => (c.id === id ? { ...c, ...data } : c))
      : [...s.customers, { id: newId, ...data }],
  }));
  return newId;
};

export const deleteCustomer = (id) =>
  set((s) => ({ ...s, customers: s.customers.filter((c) => c.id !== id) }));

// Suppliers
export const saveSupplier = (id, data) => {
  const newId = id || uid();
  set((s) => ({
    ...s,
    suppliers: id
      ? s.suppliers.map((x) => (x.id === id ? { ...x, ...data } : x))
      : [...s.suppliers, { id: newId, ...data }],
  }));
  return newId;
};

export const deleteSupplier = (id) =>
  set((s) => ({ ...s, suppliers: s.suppliers.filter((x) => x.id !== id) }));

// Orders
export const saveOrder = (id, data) => {
  const total = (data.items || []).reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.price || 0), 0);
  const final = { ...data, total };
  if (final.paid >= total - 0.001 && total > 0) final.status = 'paid';
  const newId = id || uid();
  set((s) => ({
    ...s,
    orders: id
      ? s.orders.map((o) => (o.id === id ? { ...o, ...final } : o))
      : [...s.orders, { id: newId, ...final }],
  }));
  return newId;
};

export const recordOrderPayment = (id, amount) =>
  set((s) => ({
    ...s,
    orders: s.orders.map((o) => {
      if (o.id !== id) return o;
      const paid = Number(o.paid || 0) + Number(amount);
      const status = paid >= (o.total || 0) - 0.001 ? 'paid' : o.status;
      return { ...o, paid, status };
    }),
  }));

export const markOrderDelivered = (id) =>
  set((s) => ({
    ...s,
    orders: s.orders.map((o) => (o.id === id ? { ...o, status: 'delivered' } : o)),
  }));

export const deleteOrder = (id) =>
  set((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }));

// Purchases
export const savePurchase = (id, data) => {
  const total = (data.items || []).reduce((sum, it) => sum + Number(it.qty || 0) * Number(it.price || 0), 0);
  const final = { ...data, total };
  const newId = id || uid();
  set((s) => ({
    ...s,
    purchases: id
      ? s.purchases.map((p) => (p.id === id ? { ...p, ...final } : p))
      : [...s.purchases, { id: newId, ...final }],
  }));
  return newId;
};

export const recordPurchasePayment = (id, amount) =>
  set((s) => ({
    ...s,
    purchases: s.purchases.map((p) =>
      p.id === id ? { ...p, paid: Number(p.paid || 0) + Number(amount) } : p
    ),
  }));

export const deletePurchase = (id) =>
  set((s) => ({ ...s, purchases: s.purchases.filter((p) => p.id !== id) }));

// Bulk
export const replaceAll = (newData) =>
  set(() => ({ ...initial, ...newData }));

export const clearAll = () =>
  set(() => ({ ...initial, meta: { created: new Date().toISOString() } }));

export const findById = byId;
