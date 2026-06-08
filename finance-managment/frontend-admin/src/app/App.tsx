import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import { Layout } from '../shared/components/Layout';
import DashboardPage from '../pages/dashboard';
import LoginPage from '../pages/login';
import WalletsPage from '../pages/wallets';
import WalletDetailPage from '../pages/wallets/wallet-detail';
import FusionPage from '../pages/fusion';
import SmartMoneyPage from '../pages/smart-money';
import BacktestingPage from '../pages/backtesting';
import RiskProfilePage from '../pages/risk-profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('accessToken');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/wallets" element={<WalletsPage />} />
                    <Route path="/wallets/:id" element={<WalletDetailPage />} />
                    <Route path="/fusion" element={<FusionPage />} />
                    <Route path="/smart-money" element={<SmartMoneyPage />} />
                    <Route path="/backtesting" element={<BacktestingPage />} />
                    <Route path="/risk" element={<RiskProfilePage />} />
                    <Route path="/performance" element={<div>Performance — Coming soon</div>} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
