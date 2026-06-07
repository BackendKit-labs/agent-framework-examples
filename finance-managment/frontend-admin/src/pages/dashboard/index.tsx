import { Box, Grid, Card, CardContent, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useWallets } from '../../features/wallets/hooks/useWallets';
import { useWebSocket } from '../../shared/api/ws-client';
import { MetricCard } from '../../shared/components/MetricCard';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import { useState } from 'react';

export default function DashboardPage() {
  const { data: wallets, isLoading, error } = useWallets();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});

  useWebSocket({
    price_update: (data: { symbol: string; price: number; change: number }) => {
      setPrices(prev => ({ ...prev, [data.symbol]: { price: data.price, change: data.change } }));
    },
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const totalValue = wallets?.reduce((sum, w) => sum + Number(w.totalValue), 0) || 0;
  const totalWallets = wallets?.length || 0;
  // Backend returns portfolios as a full array via TypeORM relation, not a count field
  const totalPortfolios = wallets?.reduce((s, w) => s + (w.portfolios?.length ?? w.portfolioCount ?? 0), 0) || 0;

  return (
    <Box>
      <Typography variant="h4" mb={3}>Dashboard</Typography>

      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Total Value" value={`$${totalValue.toLocaleString()}`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Wallets" value={totalWallets.toString()} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Portfolios" value={totalPortfolios.toString()} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard title="Live Assets" value={Object.keys(prices).length.toString()} />
        </Grid>
      </Grid>

      <Typography variant="h5" mb={2}>Live Prices</Typography>
      <Grid container spacing={2} mb={4}>
        {Object.entries(prices).slice(0, 8).map(([symbol, data]) => (
          <Grid item xs={6} sm={4} md={3} key={symbol}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">{symbol}</Typography>
                <Typography variant="h6">${data.price.toFixed(2)}</Typography>
                <Typography variant="body2" color={data.change >= 0 ? 'success.main' : 'error.main'}>
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Quick Actions</Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }} onClick={() => navigate('/wallets')}>
            <CardContent>
              <Typography variant="h6">Manage Wallets</Typography>
              <Typography variant="body2" color="text.secondary">
                {totalWallets} wallets · {totalPortfolios} portfolios
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }} onClick={() => navigate('/fusion')}>
            <CardContent>
              <Typography variant="h6">Signal Fusion</Typography>
              <Typography variant="body2" color="text.secondary">
                AI-powered investment signals
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }} onClick={() => navigate('/smart-money')}>
            <CardContent>
              <Typography variant="h6">Smart Money</Typography>
              <Typography variant="body2" color="text.secondary">
                Track institutional investors
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }} onClick={() => navigate('/backtesting')}>
            <CardContent>
              <Typography variant="h6">Backtesting</Typography>
              <Typography variant="body2" color="text.secondary">
                Validate strategies historically
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
