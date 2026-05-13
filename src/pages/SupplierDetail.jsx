import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useDB, findById } from '../lib/store.js';
import { supplierBalance, fmt, fmtDateShort, plural, purchaseStatusBadge } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Badge, DetailRow } from '../components/ui.jsx';
import { SupplierForm } from './Suppliers.jsx';

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const db = useDB();
  const [editing, setEditing] = useState(false);

  const s = findById(db.suppliers, id);
  if (!s) return <Navigate to="/suppliers" replace />;

  const purchases = db.purchases
    .filter((p) => p.supplierId === id)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const balance = supplierBalance(db, id);
  const totalSpent = purchases.reduce((sum, p) => sum + (Number(p.total) || 0), 0);
  const totalPaid = purchases.reduce((sum, p) => sum + (Number(p.paid) || 0), 0);

  return (
    <>
      <Header
        title={s.name}
        subtitle="Поставщик"
        back
        action={{ label: 'Изменить', onClick: () => setEditing(true) }}
      />
      <div className="p-4">
        <div className="card">
          <DetailRow label="Всего закупок" value={purchases.length} />
          <DetailRow label="Общая сумма" value={<span className="num">{fmt(totalSpent)}</span>} />
          <DetailRow label="Выплачено" value={<span className="num text-ok">{fmt(totalPaid)}</span>} />
          <DetailRow
            label={<span className="font-semibold text-ink">К оплате</span>}
            value={<span className={`num text-base ${balance > 0 ? 'text-danger' : ''}`}>{fmt(balance)}</span>}
          />
        </div>

        {(s.phone || s.address || s.note) && (
          <div className="card">
            {s.phone && (
              <DetailRow
                label="Телефон"
                value={<a href={`tel:${s.phone}`} className="text-ember no-underline">{s.phone}</a>}
              />
            )}
            {s.address && <DetailRow label="Адрес" value={s.address} />}
            {s.note && <DetailRow label="Заметка" value={s.note} />}
          </div>
        )}

        <div className="flex justify-between items-center mt-5 mb-2">
          <div className="text-base font-bold">Закупки</div>
          <div className="text-ink-3 text-sm">{purchases.length}</div>
        </div>
        {purchases.length === 0 ? (
          <div className="card text-center text-ink-2">Закупок ещё не было</div>
        ) : (
          <div className="flex flex-col gap-2">
            {purchases.map((p) => {
              const badge = purchaseStatusBadge(p);
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/purchases/${p.id}`)}
                  className="card mb-0 cursor-pointer active:bg-surface2 flex justify-between items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px]">Закупка от {fmtDateShort(p.date)}</div>
                    <div className="text-[13px] text-ink-2">
                      {(p.items || []).length} {plural((p.items || []).length, 'позиция', 'позиции', 'позиций')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[15px] num">{fmt(p.total)}</div>
                    <div className="mt-1"><Badge className={badge.cls}>{badge.label}</Badge></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          className="btn w-full mt-4"
          onClick={() => navigate('/purchases/new', { state: { supplierId: s.id } })}
        >
          + Новая закупка
        </button>
      </div>
      {editing && <SupplierForm id={s.id} onClose={() => setEditing(false)} />}
    </>
  );
}
