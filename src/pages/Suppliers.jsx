import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB, saveSupplier, deleteSupplier as deleteS, findById } from '../lib/store.js';
import { supplierBalance, fmt, plural } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Modal, FAB, Empty, useToast, useConfirm } from '../components/ui.jsx';

export default function Suppliers() {
  const db = useDB();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);

  const suppliers = db.suppliers
    .map((s) => ({ ...s, balance: supplierBalance(db, s.id) }))
    .sort((a, b) => b.balance - a.balance || (a.name || '').localeCompare(b.name || '', 'ru'));
  const totalAP = suppliers.reduce((sum, s) => sum + s.balance, 0);

  return (
    <>
      <Header title="Поставщики" subtitle={`${suppliers.length} ${plural(suppliers.length, 'поставщик', 'поставщика', 'поставщиков')}`} />
      <div className="p-4">
        <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none pb-1">
          <button className="chip chip-active" onClick={() => navigate('/suppliers')}>Мясники</button>
          <button className="chip" onClick={() => navigate('/purchases')}>История закупок</button>
        </div>

        {suppliers.length > 0 && (
          <div className="card">
            <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Общий долг поставщикам</div>
            <div className={`text-2xl font-bold num ${totalAP > 0 ? 'text-danger' : ''}`}>{fmt(totalAP)}</div>
          </div>
        )}

        {suppliers.length === 0 ? (
          <Empty icon="🥩" title="Поставщиков пока нет" desc="Добавьте мясников, у которых покупаете сырьё" />
        ) : (
          <div className="flex flex-col gap-2">
            {suppliers.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/suppliers/${s.id}`)}
                className="card mb-0 cursor-pointer active:bg-surface2 flex justify-between items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">{s.name}</div>
                  <div className="text-[13px] text-ink-2 truncate">{s.phone || 'Мясник'}</div>
                </div>
                <div className="text-right">
                  {s.balance > 0 ? (
                    <>
                      <div className="font-bold text-[15px] num text-danger">{fmt(s.balance)}</div>
                      <div className="text-xs text-ink-3">к оплате</div>
                    </>
                  ) : (
                    <div className="text-xs text-ink-3">нет долга</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FAB onClick={() => setEditing('new')} />
      {editing && (
        <SupplierForm
          id={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

export function SupplierForm({ id, onClose }) {
  const db = useDB();
  const toast = useToast();
  const confirm = useConfirm();
  const existing = id ? findById(db.suppliers, id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [note, setNote] = useState(existing?.note || '');

  const onSave = () => {
    if (!name.trim()) return toast('Укажите имя');
    saveSupplier(id, { name: name.trim(), phone: phone.trim(), address: address.trim(), note: note.trim() });
    toast('Сохранено');
    onClose();
  };

  const onDelete = async () => {
    const hasPurchases = db.purchases.some((p) => p.supplierId === id);
    if (hasPurchases) return toast('Нельзя удалить — есть закупки');
    if (await confirm('Удалить этого поставщика?')) {
      deleteS(id);
      toast('Удалено');
      onClose();
    }
  };

  return (
    <Modal
      title={id ? 'Изменить поставщика' : 'Новый поставщик'}
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
        <label className="label">Название / Имя</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Мясник Ахмад" autoFocus />
      </div>
      <div className="mb-3.5">
        <label className="label">Телефон</label>
        <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+992 ..." />
      </div>
      <div className="mb-3.5">
        <label className="label">Адрес</label>
        <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div>
        <label className="label">Заметка</label>
        <textarea className="input min-h-[72px]" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
