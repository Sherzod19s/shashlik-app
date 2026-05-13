import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDB, savePurchase, findById } from '../lib/store.js';
import { fmt, today, num } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { useToast } from '../components/ui.jsx';
import { SupplierForm } from './Suppliers.jsx';

export default function PurchaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const db = useDB();
  const toast = useToast();
  const existing = id ? findById(db.purchases, id) : null;

  const [supplierId, setSupplierId] = useState(
    existing?.supplierId || location.state?.supplierId || ''
  );
  const [date, setDate] = useState(existing?.date || today());
  const [items, setItems] = useState(
    existing?.items?.length ? [...existing.items] : [{ name: '', qty: 1, price: 0, unit: 'kg' }]
  );
  const [paid, setPaid] = useState(existing?.paid || '');
  const [note, setNote] = useState(existing?.note || '');
  const [showNewSupplier, setShowNewSupplier] = useState(false);

  const total = items.reduce((s, it) => s + num(it.qty) * num(it.price), 0);

  const updateItem = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === 'name' || field === 'unit') next[i] = { ...next[i], [field]: value };
      else next[i] = { ...next[i], [field]: num(value) };
      return next;
    });
  };
  const addLine = () => setItems((p) => [...p, { name: '', qty: 1, price: 0, unit: 'kg' }]);
  const removeLine = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  const onSave = () => {
    if (!supplierId) return toast('Выберите поставщика');
    const valid = items.filter((it) => it.name && num(it.qty) > 0);
    if (valid.length === 0) return toast('Добавьте позицию');
    const cleaned = valid.map((it) => ({ ...it, qty: num(it.qty), price: num(it.price) }));
    const newId = savePurchase(id, {
      supplierId,
      date: date || today(),
      items: cleaned,
      paid: num(paid),
      note: note.trim(),
    });
    toast(id ? 'Сохранено' : 'Закупка добавлена');
    navigate(`/purchases/${newId}`);
  };

  return (
    <>
      <Header title={id ? 'Изменить закупку' : 'Новая закупка'} back />
      <div className="p-4">
        <div className="mb-3.5">
          <label className="label">Поставщик</label>
          <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">— выберите —</option>
            {db.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="text-xs text-ink-3 mt-1">
            <button
              type="button"
              onClick={() => setShowNewSupplier(true)}
              className="text-ember bg-transparent border-none p-0 cursor-pointer"
            >+ Новый поставщик</button>
          </div>
        </div>

        <div className="mb-3.5">
          <label className="label">Дата</label>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
              <label className="label">Название (сырьё)</label>
              <input
                className="input"
                value={it.name || ''}
                onChange={(e) => updateItem(i, 'name', e.target.value)}
                placeholder="Баранина, говядина..."
              />
            </div>
            <div className="grid grid-cols-[2fr_1fr_1fr] gap-2.5">
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
                <label className="label">Ед.</label>
                <select className="input" value={it.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)}>
                  <option value="kg">кг</option>
                  <option value="pc">шт</option>
                </select>
              </div>
              <div>
                <label className="label">Цена</label>
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
          <label className="label">Выплачено (необязательно)</label>
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
          <div className="text-xs text-ink-3 mt-1">Сумма, уже выплаченная поставщику</div>
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
      {showNewSupplier && (
        <SupplierForm
          id={null}
          onClose={() => {
            setShowNewSupplier(false);
            const latest = db.suppliers[db.suppliers.length - 1];
            if (latest && !supplierId) setSupplierId(latest.id);
          }}
        />
      )}
    </>
  );
}
