import { useNavigate } from 'react-router-dom';
import { useDB, replaceAll, clearAll, getDB } from '../lib/store.js';
import { today, buildDemoData } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { DetailRow, useToast, useConfirm } from '../components/ui.jsx';

export default function Settings() {
  const db = useDB();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getDB(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shashlik-backup-${today()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Файл сохранён');
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const parsed = JSON.parse(reader.result);
          if (await confirm('Заменить все текущие данные данными из файла?', { confirmLabel: 'Заменить', danger: false })) {
            replaceAll(parsed);
            toast('Импорт выполнен');
          }
        } catch (err) {
          toast('Ошибка чтения файла');
        }
      };
      reader.readAsText(f);
    };
    input.click();
  };

  const loadDemo = async () => {
    if (await confirm('Заменить текущие данные демо-примером?', { confirmLabel: 'Загрузить', danger: false })) {
      replaceAll(buildDemoData());
      toast('Демо-данные загружены');
      navigate('/');
    }
  };

  const onClearAll = async () => {
    if (await confirm('ВНИМАНИЕ! Это удалит ВСЕ данные. Действие нельзя отменить. Сначала сделайте резервную копию.')) {
      clearAll();
      toast('Все данные удалены');
      navigate('/');
    }
  };

  return (
    <>
      <Header title="Настройки" back />
      <div className="p-4">
        <div className="card">
          <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Данные</div>
          <DetailRow label="Товары" value={db.products.length} />
          <DetailRow label="Клиенты" value={db.customers.length} />
          <DetailRow label="Поставщики" value={db.suppliers.length} />
          <DetailRow label="Заказы" value={db.orders.length} />
          <DetailRow label="Закупки" value={db.purchases.length} />
        </div>

        <div className="card">
          <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Резервная копия</div>
          <p className="text-sm text-ink-2 mb-3">
            Скачайте файл с данными, чтобы сохранить копию. Используйте «Импорт» для восстановления.
          </p>
          <button className="btn btn-secondary w-full mb-2" onClick={exportData}>📥 Экспорт (скачать)</button>
          <button className="btn btn-secondary w-full" onClick={importData}>📤 Импорт (восстановить)</button>
        </div>

        <div className="card">
          <div className="text-[13px] uppercase tracking-wider text-ink-2 mb-2 font-semibold">Демо-данные</div>
          <p className="text-sm text-ink-2 mb-3">
            Заполнить приложение примерами, чтобы посмотреть, как всё работает.
          </p>
          <button className="btn btn-secondary w-full" onClick={loadDemo}>Загрузить пример</button>
        </div>

        <div className="card">
          <div className="text-[13px] uppercase tracking-wider text-danger mb-2 font-semibold">Опасная зона</div>
          <button className="btn btn-danger w-full" onClick={onClearAll}>Очистить все данные</button>
        </div>

        <div className="text-center text-ink-3 text-xs mt-6">
          Приложение работает офлайн. Данные хранятся только на этом устройстве.
        </div>
      </div>
    </>
  );
}
