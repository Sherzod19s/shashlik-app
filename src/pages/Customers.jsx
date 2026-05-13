import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB, saveCustomer, deleteCustomer as deleteC, findById } from '../lib/store.js';
import { customerBalance, fmt, plural, CTYPE_LABEL } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Modal, FAB, Empty, useToast, useConfirm } from '../components/ui.jsx';

export default function Customers() {
  const db = useDB();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(null);

  const customers = db.customers
    .map((c) => ({ ...c, balance: customerBalance(db, c.id) }))
    .sort((a, b) => b.balance - a.balance || (a.name || '').localeCompare(b.name || '', 'ru'));
  const totalAR = customers.reduce((s, c) => s + c.balance, 0);

  return (
    <>
      <Header title="Клиенты" subtitle={`${customers.length} ${plural(customers.length, 'клиент', 'клиента', 'клиентов')}`} />
      <div className="p-4">
        {customers.length > 0 && (
          <div className="card">
            <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Общий долг клиентов</div>
            <div className={`text-2xl font-bold num ${totalAR > 0 ? 'text-danger' : ''}`}>{fmt(totalAR)}</div>
          </div>
        )}
        {customers.length === 0 ? (
          <Empty icon="👥" title="Клиентов пока нет" desc="Добавьте ресторан, частное лицо или мероприятие" />
        ) : (
          <div className="flex flex-col gap-2">
            {customers.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="card mb-0 cursor-pointer active:bg-surface2 flex justify-between items-center gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] truncate">{c.name}</div>
                  <div className="text-[13px] text-ink-2 truncate">
                    {CTYPE_LABEL[c.type] || ''} {c.phone && `• ${c.phone}`}
                  </div>
                </div>
                <div className="text-right">
                  {c.balance > 0 ? (
                    <>
                      <div className="font-bold text-[15px] num text-danger">{fmt(c.balance)}</div>
                      <div className="text-xs text-ink-3">долг</div>
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
        <CustomerForm
          id={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

export function CustomerForm({ id, onClose }) {
  const db = useDB();
  const toast = useToast();
  const confirm = useConfirm();
  const existing = id ? findById(db.customers, id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [type, setType] = useState(existing?.type || 'restaurant');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [address, setAddress] = useState(existing?.address || '');
  const [note, setNote] = useState(existing?.note || '');

  const onSave = () => {
    if (!name.trim()) return toast('Укажите имя');
    saveCustomer(id, { name: name.trim(), type, phone: phone.trim(), address: address.trim(), note: note.trim() });
    toast('Сохранено');
    onClose();
  };

  const onDelete = async () => {
    const hasOrders = db.orders.some((o) => o.customerId === id);
    if (hasOrders) return toast('Нельзя удалить — есть заказы');
    if (await confirm('Удалить этого клиента?')) {
      deleteC(id);
      toast('Удалено');
      onClose();
    }
  };

  return (
    <Modal
      title={id ? 'Изменить клиента' : 'Новый клиент'}
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
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder='Ресторан "Душанбе"' autoFocus />
      </div>
      <div className="mb-3.5">
        <label className="label">Тип</label>
        <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="restaurant">Ресторан</option>
          <option value="household">Частное лицо</option>
          <option value="event">Мероприятие</option>
        </select>
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
