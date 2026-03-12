import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useProject } from './context/ProjectContext';
import Layout from './components/Layout';

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
const PlatformDashboard = lazy(() => import('./pages/platform/Dashboard'));
const PlatformOrgs = lazy(() => import('./pages/platform/Organizations'));
const PlatformOrgDetail = lazy(() => import('./pages/platform/OrgDetail'));
const PlatformUsers = lazy(() => import('./pages/platform/Users'));

function PageLoader() {
  return <div className="text-center p-10 text-text-muted">Loading...</div>;
}

function HomeRoute() {
  const { currentProject } = useProject();
  return currentProject ? <Overview /> : <ProjectList />;
}

export default function App() {
  const { authenticated, loading } = useAuth();

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
