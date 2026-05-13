import { useNavigate } from 'react-router-dom';
import { useDB, findById } from '../lib/store.js';
import { fmt, fmtDateShort, plural, purchaseStatusBadge } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { Badge, FAB, Empty } from '../components/ui.jsx';

export default function Purchases() {
  const db = useDB();
  const navigate = useNavigate();
  const purchases = [...db.purchases].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <>
      <Header title="Закупки" subtitle={`Всего: ${purchases.length}`} back />
      <div className="p-4">
        {purchases.length === 0 ? (
          <Empty icon="🥩" title="Закупок пока нет" desc="Запишите первую закупку мяса" />
        ) : (
          <div className="flex flex-col gap-2">
            {purchases.map((p) => {
              const s = findById(db.suppliers, p.supplierId);
              const badge = purchaseStatusBadge(p);
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/purchases/${p.id}`)}
                  className="card mb-0 cursor-pointer active:bg-surface2 flex justify-between items-center gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] truncate">{s ? s.name : 'Удалён'}</div>
                    <div className="text-[13px] text-ink-2">
                      {(p.items || []).length} {plural((p.items || []).length, 'позиция', 'позиции', 'позиций')} • {fmtDateShort(p.date)}
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
      </div>
      <FAB onClick={() => navigate('/purchases/new')} />
    </>
  );
}
