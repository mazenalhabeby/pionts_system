import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useProject } from './context/ProjectContext';
import Layout from './components/Layout';
import DocsLayout from './components/DocsLayout';

const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'));
const Overview = lazy(() => import('./pages/Overview'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerDetail = lazy(() => import('./pages/CustomerDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Referrals = lazy(() => import('./pages/Referrals'));
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectCreate = lazy(() => import('./pages/ProjectCreate'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const OrgSettings = lazy(() => import('./pages/OrgSettings'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Billing = lazy(() => import('./pages/Billing'));
const Points = lazy(() => import('./pages/Points'));
const Partners = lazy(() => import('./pages/Partners'));
const Guides = lazy(() => import('./pages/Guides'));
const ShopifyGuide = lazy(() => import('./pages/guides/ShopifyGuide'));
const WordPressGuide = lazy(() => import('./pages/guides/WordPressGuide'));
const CustomGuide = lazy(() => import('./pages/guides/CustomGuide'));
const ApiReference = lazy(() => import('./pages/guides/ApiReference'));
const ShopifyOnboarding = lazy(() => import('./pages/ShopifyOnboarding'));
const PlatformDashboard = lazy(() => import('./pages/platform/Dashboard'));
const PlatformOrgs = lazy(() => import('./pages/platform/Organizations'));
const PlatformOrgDetail = lazy(() => import('./pages/platform/OrgDetail'));
const PlatformUsers = lazy(() => import('./pages/platform/Users'));

// Public docs pages (no auth required)
const DocsOverview = lazy(() => import('./pages/docs/DocsOverview'));
const DocsQuickStart = lazy(() => import('./pages/docs/DocsQuickStart'));
const DocsGuideCustom = lazy(() => import('./pages/docs/DocsGuides').then(m => ({ default: m.GuideCustom })));
const DocsGuideShopify = lazy(() => import('./pages/docs/DocsGuides').then(m => ({ default: m.GuideShopify })));
const DocsGuideWoo = lazy(() => import('./pages/docs/DocsGuides').then(m => ({ default: m.GuideWooCommerce })));
const DocsGuidePHP = lazy(() => import('./pages/docs/DocsGuides').then(m => ({ default: m.GuidePHP })));
const DocsGuidePython = lazy(() => import('./pages/docs/DocsGuides').then(m => ({ default: m.GuidePython })));
const DocsApiCheckout = lazy(() => import('./pages/docs/DocsAPI').then(m => ({ default: m.ApiCheckout })));
const DocsApiOrders = lazy(() => import('./pages/docs/DocsAPI').then(m => ({ default: m.ApiOrders })));
const DocsApiCustomers = lazy(() => import('./pages/docs/DocsAPI').then(m => ({ default: m.ApiCustomers })));
const DocsApiConfig = lazy(() => import('./pages/docs/DocsAPI').then(m => ({ default: m.ApiConfig })));
const DocsApiWebhooks = lazy(() => import('./pages/docs/DocsAPI').then(m => ({ default: m.ApiWebhooks })));
const DocsWidgetPage = lazy(() => import('./pages/docs/DocsAdvanced').then(m => ({ default: m.DocsWidget })));
const DocsSecurity = lazy(() => import('./pages/docs/DocsAdvanced').then(m => ({ default: m.DocsSecurity })));
const DocsErrors = lazy(() => import('./pages/docs/DocsAdvanced').then(m => ({ default: m.DocsErrors })));
const DocsSDK = lazy(() => import('./pages/docs/DocsAdvanced').then(m => ({ default: m.DocsSDK })));

function PageLoader() {
  return <div className="text-center p-10 text-text-muted">Loading...</div>;
}

function HomeRoute() {
  const { currentProject } = useProject();
  return currentProject ? <Overview /> : <ProjectList />;
}

export default function App() {
  const { authenticated, loading } = useAuth();
  const { pathname } = useLocation();

  // Public docs — no auth required, separate layout
  if (pathname.startsWith('/docs')) {
    return (
      <DocsLayout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/docs" element={<DocsOverview />} />
            <Route path="/docs/quickstart" element={<DocsQuickStart />} />
            <Route path="/docs/guide/custom" element={<DocsGuideCustom />} />
            <Route path="/docs/guide/shopify" element={<DocsGuideShopify />} />
            <Route path="/docs/guide/woocommerce" element={<DocsGuideWoo />} />
            <Route path="/docs/guide/php" element={<DocsGuidePHP />} />
            <Route path="/docs/guide/python" element={<DocsGuidePython />} />
            <Route path="/docs/api/checkout" element={<DocsApiCheckout />} />
            <Route path="/docs/api/orders" element={<DocsApiOrders />} />
            <Route path="/docs/api/customers" element={<DocsApiCustomers />} />
            <Route path="/docs/api/config" element={<DocsApiConfig />} />
            <Route path="/docs/api/webhooks" element={<DocsApiWebhooks />} />
            <Route path="/docs/widget" element={<DocsWidgetPage />} />
            <Route path="/docs/security" element={<DocsSecurity />} />
            <Route path="/docs/errors" element={<DocsErrors />} />
            <Route path="/docs/sdk" element={<DocsSDK />} />
            <Route path="/docs/*" element={<Navigate to="/docs" replace />} />
          </Routes>
        </Suspense>
      </DocsLayout>
    );
  }

  if (loading) {
    return <div className="text-center p-10 text-text-muted">Loading...</div>;
  }

  if (!authenticated) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customer/:id" element={<CustomerDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/points" element={<Points />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/partners" element={<Partners />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/new" element={<ProjectCreate />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/guides" element={<Guides />} />
          <Route path="/guides/shopify" element={<ShopifyGuide />} />
          <Route path="/guides/wordpress" element={<WordPressGuide />} />
          <Route path="/guides/custom" element={<CustomGuide />} />
          <Route path="/guides/api" element={<ApiReference />} />
          <Route path="/setup/shopify" element={<ShopifyOnboarding />} />
          <Route path="/api-keys" element={<ApiKeys />} />
          <Route path="/org" element={<OrgSettings />} />
          <Route path="/platform" element={<PlatformDashboard />} />
          <Route path="/platform/orgs" element={<PlatformOrgs />} />
          <Route path="/platform/orgs/:id" element={<PlatformOrgDetail />} />
          <Route path="/platform/users" element={<PlatformUsers />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
