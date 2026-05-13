import { useState } from 'react';
import { useDB, saveProduct, deleteProduct as deleteP, findById } from '../lib/store.js';
import { fmt, fmtPlain, UNITS, plural, num } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Modal, FAB, Empty, useToast, useConfirm } from '../components/ui.jsx';

export default function Products() {
  const db = useDB();
  const [editing, setEditing] = useState(null); // null = closed, 'new' = new, or product id

  const products = [...db.products].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ru'));

  return (
    <>
      <Header title="Товары" subtitle={`${products.length} ${plural(products.length, 'товар', 'товара', 'товаров')}`} />
      <div className="p-4">
        {products.length === 0 ? (
          <Empty icon="🍢" title="Товаров пока нет" desc="Добавьте виды шашлыка с ценами" />
        ) : (
          <div className="flex flex-col gap-2">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => setEditing(p.id)}
                className="card mb-0 cursor-pointer active:bg-surface2 flex justify-between items-center"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[15px]">{p.name}</div>
                  {p.note && <div className="text-[13px] text-ink-2">{p.note}</div>}
                </div>
                <div className="text-right">
                  <div className="font-bold text-[15px] num">{fmt(p.price)}</div>
                  <div className="text-xs text-ink-3">за {UNITS[p.unit] || p.unit}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FAB onClick={() => setEditing('new')} />
      {editing && (
        <ProductForm
          id={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function ProductForm({ id, onClose }) {
  const db = useDB();
  const toast = useToast();
  const confirm = useConfirm();
  const existing = id ? findById(db.products, id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [price, setPrice] = useState(existing?.price || '');
  const [unit, setUnit] = useState(existing?.unit || 'kg');
  const [note, setNote] = useState(existing?.note || '');

  const onSave = () => {
    if (!name.trim()) return toast('Укажите название');
    if (num(price) <= 0) return toast('Укажите цену');
    saveProduct(id, { name: name.trim(), price: num(price), unit, note: note.trim() });
    toast('Сохранено');
    onClose();
  };

  const onDelete = async () => {
    if (await confirm('Удалить этот товар? Существующие заказы не изменятся.')) {
      deleteP(id);
      toast('Удалено');
      onClose();
    }
  };

  return (
    <Modal
      title={id ? 'Изменить товар' : 'Новый товар'}
      onClose={onClose}
      footer={
        <>
          {id && <button className="btn btn-danger" onClick={onDelete}>Удалить</button>}
          <button className="btn btn-secondary flex-1" onClick={onClose}>Отмена</button>
          <button className="btn flex-1" onClick={onSave}>Сохранить</button>
        </>
      }
    >
      <div className="mb-3.5">
        <label className="label">Название</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Шашлык из баранины" autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-3.5">
        <div>
          <label className="label">Цена (смн)</label>
          <input className="input" type="number" inputMode="decimal" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className="label">Единица</label>
          <select className="input" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="kg">кг</option>
            <option value="pc">шт</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Заметка (необязательно)</label>
        <textarea className="input min-h-[72px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Например: маринад с травами" />
      </div>
    </Modal>
  );
}
