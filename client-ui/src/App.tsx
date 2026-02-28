import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './components/LoginPage';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Referrals = lazy(() => import('./pages/Referrals'));
const Redeem = lazy(() => import('./pages/Redeem'));
const Earn = lazy(() => import('./pages/Earn'));

export default function App() {
  const { authenticated } = useAuth();

  if (authenticated === null) {
    return <div className="text-center p-10 text-[#888]">Loading...</div>;
  }

  if (authenticated === false) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Suspense fallback={<div className="text-center p-10 text-[#888]">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/redeem" element={<Redeem />} />
          <Route path="/earn" element={<Earn />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
