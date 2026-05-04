import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

const Overview = lazy(() => import('./pages/Overview'));
const QuickStart = lazy(() => import('./pages/QuickStart'));
const GuideCustom = lazy(() => import('./pages/Guides').then(m => ({ default: m.GuideCustom })));
const GuideShopify = lazy(() => import('./pages/Guides').then(m => ({ default: m.GuideShopify })));
const GuideWoo = lazy(() => import('./pages/Guides').then(m => ({ default: m.GuideWooCommerce })));
const GuidePHP = lazy(() => import('./pages/Guides').then(m => ({ default: m.GuidePHP })));
const GuidePython = lazy(() => import('./pages/Guides').then(m => ({ default: m.GuidePython })));
const ApiCheckout = lazy(() => import('./pages/API').then(m => ({ default: m.ApiCheckout })));
const ApiOrders = lazy(() => import('./pages/API').then(m => ({ default: m.ApiOrders })));
const ApiCustomers = lazy(() => import('./pages/API').then(m => ({ default: m.ApiCustomers })));
const ApiConfig = lazy(() => import('./pages/API').then(m => ({ default: m.ApiConfig })));
const ApiWebhooks = lazy(() => import('./pages/API').then(m => ({ default: m.ApiWebhooks })));
const Widget = lazy(() => import('./pages/Advanced').then(m => ({ default: m.DocsWidget })));
const Security = lazy(() => import('./pages/Advanced').then(m => ({ default: m.DocsSecurity })));
const Errors = lazy(() => import('./pages/Advanced').then(m => ({ default: m.DocsErrors })));
const SDK = lazy(() => import('./pages/Advanced').then(m => ({ default: m.DocsSDK })));

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/quickstart" element={<QuickStart />} />
          <Route path="/guide/custom" element={<GuideCustom />} />
          <Route path="/guide/shopify" element={<GuideShopify />} />
          <Route path="/guide/woocommerce" element={<GuideWoo />} />
          <Route path="/guide/php" element={<GuidePHP />} />
          <Route path="/guide/python" element={<GuidePython />} />
          <Route path="/api/checkout" element={<ApiCheckout />} />
          <Route path="/api/orders" element={<ApiOrders />} />
          <Route path="/api/customers" element={<ApiCustomers />} />
          <Route path="/api/config" element={<ApiConfig />} />
          <Route path="/api/webhooks" element={<ApiWebhooks />} />
          <Route path="/widget" element={<Widget />} />
          <Route path="/security" element={<Security />} />
          <Route path="/errors" element={<Errors />} />
          <Route path="/sdk" element={<SDK />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
