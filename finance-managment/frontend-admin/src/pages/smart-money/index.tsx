import { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, Snackbar } from '@mui/material';
import { useSmartMoneySignals, useTrackedInvestors, useCoInvestments } from '../../features/smart-money/hooks/useSmartMoney';
import { CoInvestmentClusterCard } from '../../features/smart-money/components/CoInvestmentCluster';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import client from '../../shared/api/client';

export default function SmartMoneyPage() {
  const [symbol, setSymbol] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const { data: signalsData, isLoading: signalsLoading, refetch: refetchSignals } = useSmartMoneySignals(symbol || undefined);
  const { data: investors, isLoading: investorsLoading } = useTrackedInvestors();
  const { data: coInvestments, refetch: refetchCoInvestments } = useCoInvestments();

  const handleAnalyze = async () => {
    if (!symbol.trim()) return;
    setAnalyzing(true);
    try {
      // Call the SmartMoneyTrackerAgent to generate a signal
      await client.post('/agents/smart-money-tracker/generate-signal', { symbol: symbol.toUpperCase() });
      setSnackbar({ open: true, message: `Signal generated for ${symbol.toUpperCase()}`, severity: 'success' });
      refetchSignals();
      refetchCoInvestments();
    } catch (err: any) {
      setSnackbar({ open: true, message: err?.response?.data?.message || `Could not analyze ${symbol}`, severity: 'error' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAnalyze();
  };

  if (investorsLoading) return <LoadingState />;

  return (
    <Box>
      <Typography variant="h4" mb={3}>Smart Money Tracking</Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Monitorea los movimientos de los inversores institucionales más importantes del mundo.
        Detecta cuando múltiples fondos están comprando o vendiendo los mismos activos simultáneamente.
      </Typography>

      <Box display="flex" gap={2} mb={3}>
        <TextField
          label="Filter by Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          onKeyDown={handleKeyDown}
          size="small"
        />
        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={!symbol.trim() || analyzing}
        >
          {analyzing ? 'Analyzing...' : 'Analyze'}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />

      {/* Co-Investment Clusters */}
      {coInvestments?.clusters && coInvestments.clusters.length > 0 && (
        <>
          <Typography variant="h5" mb={2}>🔍 Co-Investment Clusters</Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>¿Qué significa?</strong> Cuando múltiples inversores institucionales mueven capital en la misma dirección,
            es una señal de que algo importante está ocurriendo con ese activo.
          </Alert>

          <Grid container spacing={2} mb={4}>
            {coInvestments.clusters.map((cluster: any) => (
              <Grid item xs={12} md={6} key={cluster.symbol}>
                <CoInvestmentClusterCard cluster={cluster} />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Active Signals */}
      <Typography variant="h5" mb={2}>
        Active Signals {symbol && <span>— Filtered by <strong>{symbol}</strong></span>}
      </Typography>
      {signalsLoading ? <LoadingState /> : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Symbol</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Conviction</TableCell>
                <TableCell>Investors</TableCell>
                <TableCell>Net Flow</TableCell>
                <TableCell>Detected</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {signalsData?.signals?.slice(0, 10).map((signal: any) => {
                const typeEmoji = signal.signalType === 'BULLISH' ? '🟢' : signal.signalType === 'BEARISH' ? '🔴' : '⚪';
                const typeLabel = signal.signalType === 'BULLISH' ? 'Alcista' : signal.signalType === 'BEARISH' ? 'Bajista' : 'Neutral';
                const flowColor = signal.netFlow >= 0 ? 'success.main' : 'error.main';
                const flowArrow = signal.netFlow >= 0 ? '▲' : '▼';
                return (
                <TableRow key={signal.id}>
                  <TableCell><strong>{signal.symbol}</strong></TableCell>
                  <TableCell>
                    <Chip
                      icon={<span>{typeEmoji}</span>}
                      label={typeLabel}
                      color={signal.signalType === 'BULLISH' ? 'success' : signal.signalType === 'BEARISH' ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{(signal.conviction * 100).toFixed(0)}%</TableCell>
                  <TableCell>{signal.investorCount}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color={flowColor}>
                      {flowArrow} ${(Math.abs(signal.netFlow) / 1000000).toFixed(1)}M
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(signal.detectedAt).toLocaleDateString()}</TableCell>
                </TableRow>
                );
              })}
              {(!signalsData?.signals || signalsData.signals.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {symbol
                      ? `No signals found for "${symbol}". Try another symbol like AAPL, MSFT, TSLA, BTC.`
                      : 'No signals yet. Signals appear when Smart Money Tracker detects institutional activity.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tracked Investors */}
      <Typography variant="h5" mb={2}>Tracked Investors ({investors?.length || 0})</Typography>
      <Grid container spacing={2} mb={4}>
        {investors?.map((inv: any) => (
          <Grid item xs={12} sm={6} md={4} key={inv.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{inv.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {inv.fundType?.replace('_', ' ')} | CIK: {inv.cik || 'N/A'}
                </Typography>
                {inv.knownStrategy && (
                  <Box mt={1}>
                    {inv.knownStrategy.map((s: string) => (
                      <Chip key={s} label={s} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </Box>
                )}
                {inv.historicalAccuracy && (
                  <Typography variant="caption" display="block" mt={1}>
                    Historical Accuracy: {(inv.historicalAccuracy * 100).toFixed(0)}%
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
