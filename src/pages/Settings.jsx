import { useNavigate } from 'react-router-dom';
import { useDB, replaceAll, clearAll, getDB } from '../lib/store.js';
import { today, buildDemoData } from '../lib/utils.js';
import { Header } from '../components/Layout.jsx';
import { DetailRow, useToast, useConfirm } from '../components/ui.jsx';

// ===== CSV helpers =====
const csvEscape = (v) => {
  if (v == null) return '';
  const s = String(v);
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCsvRows = (rows, columns) => {
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => csvEscape(r[c])).join(',')).join('\n');
  return body ? `${header}\n${body}` : header;
};

const buildCsv = (db) => {
  const lines = [];
  lines.push('# Шашлык — резервная копия');
  lines.push(`# Дата: ${new Date().toISOString()}`);
  lines.push('');

  // Products
  lines.push('## ТОВАРЫ');
  lines.push(toCsvRows(db.products, ['id', 'name', 'price', 'unit', 'note']));
  lines.push('');

  // Customers
  lines.push('## КЛИЕНТЫ');
  lines.push(toCsvRows(db.customers, ['id', 'name', 'type', 'phone', 'address', 'note']));
  lines.push('');

  // Suppliers
  lines.push('## ПОСТАВЩИКИ');
  lines.push(toCsvRows(db.suppliers, ['id', 'name', 'phone', 'address', 'note']));
  lines.push('');

  // Orders (header row)
  lines.push('## ЗАКАЗЫ');
  lines.push(toCsvRows(db.orders, ['id', 'customerId', 'date', 'deliveryDate', 'status', 'total', 'paid', 'note']));
  lines.push('');

  // Order items (flat)
  lines.push('## ПОЗИЦИИ_ЗАКАЗОВ');
  const orderItems = [];
  db.orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      orderItems.push({
        orderId: o.id,
        productId: it.productId || '',
        name: it.name || '',
        qty: it.qty,
        price: it.price,
        unit: it.unit || '',
      });
    });
  });
  lines.push(toCsvRows(orderItems, ['orderId', 'productId', 'name', 'qty', 'price', 'unit']));
  lines.push('');

  // Purchases (header row)
  lines.push('## ЗАКУПКИ');
  lines.push(toCsvRows(db.purchases, ['id', 'supplierId', 'date', 'total', 'paid', 'note']));
  lines.push('');

  // Purchase items (flat)
  lines.push('## ПОЗИЦИИ_ЗАКУПОК');
  const purchaseItems = [];
  db.purchases.forEach((p) => {
    (p.items || []).forEach((it) => {
      purchaseItems.push({
        purchaseId: p.id,
        name: it.name || '',
        qty: it.qty,
        price: it.price,
        unit: it.unit || '',
      });
    });
  });
  lines.push(toCsvRows(purchaseItems, ['purchaseId', 'name', 'qty', 'price', 'unit']));

  return lines.join('\n');
};

// ===== CSV parser =====
const parseCsvLine = (line) => {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cur += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
};

const parseSection = (lines) => {
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).filter((l) => l.trim()).map((l) => {
    const cells = parseCsvLine(l);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cells[i] || ''; });
    return obj;
  });
};

const parseCsv = (text) => {
  // Strip BOM if present
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  const rawLines = text.split(/\r?\n/);
  const sections = {};
  let currentName = null;
  let buffer = [];
  for (const line of rawLines) {
    if (line.startsWith('# ')) continue; // top comments
    if (line.startsWith('## ')) {
      if (currentName) sections[currentName] = buffer;
      currentName = line.slice(3).trim();
      buffer = [];
    } else if (line.trim() === '' && buffer.length > 0 && parseCsvLine(buffer[0]).length > 1) {
      // blank line inside a section may signal end if followed by ##; handled below
      buffer.push(line);
    } else {
      buffer.push(line);
    }
  }
  if (currentName) sections[currentName] = buffer;

  // clean trailing empties
  Object.keys(sections).forEach((k) => {
    sections[k] = sections[k].filter((l) => l.trim() !== '');
  });

  const products = parseSection(sections['ТОВАРЫ'] || []).map((r) => ({
    id: r.id,
    name: r.name,
    price: Number(r.price) || 0,
    unit: r.unit || 'kg',
    note: r.note || '',
  }));

  const customers = parseSection(sections['КЛИЕНТЫ'] || []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type || 'restaurant',
    phone: r.phone || '',
    address: r.address || '',
    note: r.note || '',
  }));

  const suppliers = parseSection(sections['ПОСТАВЩИКИ'] || []).map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone || '',
    address: r.address || '',
    note: r.note || '',
  }));

  const ordersBase = parseSection(sections['ЗАКАЗЫ'] || []).map((r) => ({
    id: r.id,
    customerId: r.customerId,
    date: r.date || '',
    deliveryDate: r.deliveryDate || '',
    status: r.status || 'pending',
    total: Number(r.total) || 0,
    paid: Number(r.paid) || 0,
    note: r.note || '',
    items: [],
  }));
  const orderItemRows = parseSection(sections['ПОЗИЦИИ_ЗАКАЗОВ'] || []);
  orderItemRows.forEach((r) => {
    const o = ordersBase.find((x) => x.id === r.orderId);
    if (o) {
      o.items.push({
        productId: r.productId || '',
        name: r.name || '',
        qty: Number(r.qty) || 0,
        price: Number(r.price) || 0,
        unit: r.unit || 'kg',
      });
    }
  });

  const purchasesBase = parseSection(sections['ЗАКУПКИ'] || []).map((r) => ({
    id: r.id,
    supplierId: r.supplierId,
    date: r.date || '',
    total: Number(r.total) || 0,
    paid: Number(r.paid) || 0,
    note: r.note || '',
    items: [],
  }));
  const purchaseItemRows = parseSection(sections['ПОЗИЦИИ_ЗАКУПОК'] || []);
  purchaseItemRows.forEach((r) => {
    const p = purchasesBase.find((x) => x.id === r.purchaseId);
    if (p) {
      p.items.push({
        name: r.name || '',
        qty: Number(r.qty) || 0,
        price: Number(r.price) || 0,
        unit: r.unit || 'kg',
      });
    }
  });

  return {
    products,
    customers,
    suppliers,
    orders: ordersBase,
    purchases: purchasesBase,
    meta: { created: new Date().toISOString() },
  };
};

export default function Settings() {
  const db = useDB();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const exportData = () => {
    const csv = buildCsv(getDB());
    // Prepend UTF-8 BOM so Excel opens Cyrillic correctly
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shashlik-backup-${today()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Файл сохранён');
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.json,text/csv,application/json';
    input.onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const text = String(reader.result);
          let parsed;
          // Auto-detect: JSON starts with { or [, CSV starts with our markers
          const trimmed = text.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            parsed = JSON.parse(trimmed);
          } else {
            parsed = parseCsv(text);
          }
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
            Скачайте CSV-файл, чтобы сохранить копию. Файл можно открыть в Excel. Используйте «Импорт» для восстановления (поддерживаются CSV и старые JSON-файлы).
          </p>
          <button className="btn btn-secondary w-full mb-2" onClick={exportData}>📥 Экспорт (CSV)</button>
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