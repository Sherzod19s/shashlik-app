import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { ToastProvider, ConfirmProvider } from './components/ui.jsx';

import Dashboard from './pages/Dashboard.jsx';
import Orders from './pages/Orders.jsx';
import OrderForm from './pages/OrderForm.jsx';
import OrderDetail from './pages/OrderDetail.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Suppliers from './pages/Suppliers.jsx';
import SupplierDetail from './pages/SupplierDetail.jsx';
import Purchases from './pages/Purchases.jsx';
import PurchaseForm from './pages/PurchaseForm.jsx';
import PurchaseDetail from './pages/PurchaseDetail.jsx';
import Products from './pages/Products.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/new" element={<OrderForm />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="orders/:id/edit" element={<OrderForm />} />
            <Route path="customers" element={<Customers />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="suppliers/:id" element={<SupplierDetail />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="purchases/new" element={<PurchaseForm />} />
            <Route path="purchases/:id" element={<PurchaseDetail />} />
            <Route path="purchases/:id/edit" element={<PurchaseForm />} />
            <Route path="products" element={<Products />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </ConfirmProvider>
    </ToastProvider>
  );
}
