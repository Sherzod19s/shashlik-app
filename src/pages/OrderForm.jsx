import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDB, saveOrder, findById } from '../lib/store.js';
import { fmt, fmtPlain, today, num, UNITS } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { useToast } from '../components/ui.jsx';
import { CustomerForm } from './Customers.jsx';

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const db = useDB();
  const toast = useToast();
  const existing = id ? findById(db.orders, id) : null;

  const [customerId, setCustomerId] = useState(
    existing?.customerId || location.state?.customerId || ''
  );
  const [date, setDate] = useState(existing?.date || today());
  const [deliveryDate, setDeliveryDate] = useState(existing?.deliveryDate || '');
  const [status, setStatus] = useState(existing?.status || 'pending');
  const [items, setItems] = useState(
    existing?.items?.length
      ? [...existing.items]
      : [{ productId: '', name: '', qty: 1, price: 0, unit: 'kg' }]
  );
  const [paid, setPaid] = useState(existing?.paid || '');
  const [note, setNote] = useState(existing?.note || '');
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const total = items.reduce((s, it) => s + num(it.qty) * num(it.price), 0);

  const updateItem = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === 'productId') {
        const p = findById(db.products, value);
        next[i] = {
          ...next[i],
          productId: value,
          name: p?.name || '',
          price: p?.price || 0,
          unit: p?.unit || 'kg',
        };
      } else if (field === 'qty' || field === 'price') {
        next[i] = { ...next[i], [field]: num(value) };
      }
      return next;
    });
  };
  const addLine = () => setItems((p) => [...p, { productId: '', name: '', qty: 1, price: 0, unit: 'kg' }]);
  const removeLine = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  const onSave = () => {
    if (!customerId) return toast('Выберите клиента');
    const valid = items.filter((it) => it.productId && num(it.qty) > 0);
    if (valid.length === 0) return toast('Добавьте хотя бы одну позицию');
    const cleaned = valid.map((it) => {
      const p = findById(db.products, it.productId);
      return { ...it, name: p?.name || it.name, unit: p?.unit || it.unit, qty: num(it.qty), price: num(it.price) };
    });
    const newId = saveOrder(id, {
      customerId,
      date: date || today(),
      deliveryDate: deliveryDate || '',
      status,
      items: cleaned,
      paid: num(paid),
      note: note.trim(),
    });
    toast(id ? 'Сохранено' : 'Заказ создан');
    navigate(`/orders/${newId}`);
  };

  return (
    <>
      <Header title={id ? 'Изменить заказ' : 'Новый заказ'} back />
      <div className="p-4">
        <div className="mb-3.5">
          <label className="label">Клиент</label>
          <select className="input" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">— выберите клиента —</option>
            {db.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="text-xs text-ink-3 mt-1">
            <button
              type="button"
              onClick={() => setShowNewCustomer(true)}
              className="text-ember bg-transparent border-none p-0 cursor-pointer"
            >
              {db.customers.length === 0 ? '+ Сначала добавьте клиента' : '+ Новый клиент'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <div>
            <label className="label">Дата заказа</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Дата доставки</label>
            <input className="input" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
        </div>

        <div className="mb-3.5">
          <label className="label">Статус</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">В ожидании</option>
            <option value="delivered">Доставлен</option>
            <option value="paid">Оплачен</option>
          </select>
        </div>

        <div className="flex justify-between items-center mt-4 mb-2">
          <div className="text-base font-bold">Позиции</div>
          <div className="text-ink-3 text-sm">Итого: {fmt(total)}</div>
        </div>

        {items.map((it, i) => (
          <div key={i} className="bg-surface2 border border-border rounded-lg p-3 mb-2">
            <div className="flex justify-between items-center mb-2.5 gap-2">
              <div className="font-semibold text-sm flex-1">Позиция {i + 1}</div>
              {items.length > 1 && (
                <button
                  onClick={() => removeLine(i)}
                  className="text-danger text-xl px-1 leading-none bg-transparent border-none cursor-pointer"
                  aria-label="Удалить"
                >×</button>
              )}
            </div>
            <div className="mb-2">
              <label className="label">Товар</label>
              <select className="input" value={it.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)}>
                <option value="">— выберите —</option>
                {db.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({fmtPlain(p.price)} смн/{UNITS[p.unit]})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="label">Количество</label>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={it.qty}
                  onChange={(e) => updateItem(i, 'qty', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Цена за ед.</label>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={it.price}
                  onChange={(e) => updateItem(i, 'price', e.target.value)}
                />
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-border flex justify-between font-semibold text-sm">
              <span>Сумма</span>
              <span className="num">{fmt(num(it.qty) * num(it.price))}</span>
            </div>
          </div>
        ))}

        <button className="btn btn-secondary w-full mb-4" onClick={addLine}>+ Добавить позицию</button>

        <div className="mb-3.5">
          <label className="label">Получено (необязательно)</label>
          <input
            className="input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            placeholder="0.00"
          />
          <div className="text-xs text-ink-3 mt-1">Сумма, уже полученная от клиента</div>
        </div>

        <div className="mb-3.5">
          <label className="label">Заметка</label>
          <textarea className="input min-h-[72px]" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="flex gap-2 mt-6">
          <button className="btn btn-secondary flex-1" onClick={() => navigate(-1)}>Отмена</button>
          <button className="btn flex-1" onClick={onSave}>Сохранить</button>
        </div>
      </div>
      {showNewCustomer && (
        <CustomerForm
          id={null}
          onClose={() => {
            setShowNewCustomer(false);
            // After modal closes, latest customer is last in DB array
            const latest = db.customers[db.customers.length - 1];
            if (latest && !customerId) setCustomerId(latest.id);
          }}
        />
      )}
    </>
  );
}
