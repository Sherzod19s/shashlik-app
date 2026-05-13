import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';

export function Layout() {
  return (
    <>
      <div className="max-w-[480px] mx-auto min-h-[100dvh] bg-bg">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}

export function Header({ title, subtitle, back = false, action }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 bg-bg py-4 px-4 z-10 border-b border-border flex justify-between items-end gap-3">
      <div className="flex-1 flex items-center min-w-0">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="text-2xl text-ink mr-1 px-1 bg-transparent border-none cursor-pointer"
            aria-label="Назад"
          >
            ←
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold -tracking-tight truncate">{title}</h1>
          {subtitle && <div className="text-[13px] text-ink-2 mt-0.5 truncate">{subtitle}</div>}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-ember font-semibold text-[15px] px-2 py-1 bg-transparent border-none cursor-pointer whitespace-nowrap"
        >
          {action.label}
        </button>
      )}
    </header>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  const isActive = (key) => {
    const p = pathname;
    if (key === '/' && p === '/') return true;
    if (key === '/orders' && p.startsWith('/orders')) return true;
    if (key === '/customers' && p.startsWith('/customers')) return true;
    if (key === '/suppliers' && (p.startsWith('/suppliers') || p.startsWith('/purchases'))) return true;
    if (key === '/products' && p.startsWith('/products')) return true;
    return false;
  };
  const Tab = ({ to, icon, label }) => (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive: na }) =>
        `flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 text-[11px] font-medium no-underline ${
          isActive(to) ? 'text-ember' : 'text-ink-3'
        }`
      }
    >
      <span className="text-[22px] leading-none">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border flex z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-[480px] w-full mx-auto flex py-1.5">
        <Tab to="/" icon="🏠" label="Главная" />
        <Tab to="/orders" icon="📋" label="Заказы" />
        <Tab to="/customers" icon="👥" label="Клиенты" />
        <Tab to="/suppliers" icon="🥩" label="Поставщики" />
        <Tab to="/products" icon="🍢" label="Товары" />
      </div>
    </nav>
  );
}
