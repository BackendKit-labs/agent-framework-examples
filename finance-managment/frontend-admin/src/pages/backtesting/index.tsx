import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, TextField, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Alert, Autocomplete } from '@mui/material';
import { useRunBacktest, useStrategies } from '../../features/backtesting/hooks/useBacktesting';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import client from '../../shared/api/client';

export default function BacktestingPage() {
  const [symbol, setSymbol] = useState('');
  const [capital, setCapital] = useState('100000');
  const [strategy, setStrategy] = useState('fusion-default');
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const runBacktest = useRunBacktest();
  const { data: strategiesData } = useStrategies();
  const strategies = strategiesData?.strategies || [];

  // Search assets via API (Yahoo Finance)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const handleSearch = (query: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (query.length < 1) { setAssets([]); return; }
    
    const timeout = setTimeout(async () => {
      try {
        const res = await client.get(`/assets/search?q=${encodeURIComponent(query)}`);
        setAssets(res.data.map((a: any) => a.symbol));
      } catch {
        // Silently fail
      }
    }, 300);
    setSearchTimeout(timeout);
  };

  const handleRun = async () => {
    const sym = symbol.toUpperCase().trim();
    
    if (!sym) {
      setError('Please enter a symbol (e.g. AAPL, MSFT, BTC)');
      return;
    }

    // Validate symbol against API
    setValidating(true);
    try {
      const res = await client.get(`/assets/validate/${sym}`);
      if (!res.data.valid) {
        const suggestions = assets.slice(0, 8).join(', ');
        setError(`"${sym}" not found. Available symbols: ${suggestions}...`);
        setValidating(false);
        return;
      }
    } catch {
      // If API fails, allow the request anyway
    }
    setValidating(false);

    const cap = parseInt(capital);
    if (isNaN(cap) || cap <= 0) {
      setError('Please enter a valid initial capital amount');
      return;
    }

    setError(null);
    runBacktest.mutate({
      strategy,
      symbol: sym,
      initialCapital: cap,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRun();
  };

  const result = runBacktest.data;

  return (
    <Box>
      <Typography variant="h4" mb={1}>Backtesting</Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Simula cómo se habría comportado una estrategia en el pasado.
        Ingresa un símbolo válido y un capital inicial para comenzar.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Configuration</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Autocomplete
                freeSolo
                options={assets}
                value={symbol}
                onInputChange={(_, v) => { setSymbol(v.toUpperCase()); setError(null); handleSearch(v); }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Symbol"
                    size="small"
                    placeholder="e.g. AAPL"
                    error={!!error}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRun(); }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Initial Capital ($)"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                size="small"
                type="number"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Strategy"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                select
                size="small"
                SelectProps={{ native: true }}
              >
                {strategies.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleRun}
                disabled={runBacktest.isPending}
              >
                {runBacktest.isPending ? 'Running...' : 'Run Backtest'}
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

      {runBacktest.isError && <ErrorState error={runBacktest.error} />}

      {!symbol && !result && (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center" py={4}>
              Enter a symbol (e.g. AAPL, MSFT, BTC) and click "Run Backtest" to start
            </Typography>
          </CardContent>
        </Card>
      )}

      {result && (
        <>
          <Typography variant="h5" mb={2}>Results for {symbol.toUpperCase()}</Typography>
          <Alert severity={result._dataSource?.includes('Yahoo') ? 'success' : 'warning'} sx={{ mb: 2 }}>
            <strong>{result._dataSource?.includes('Yahoo') ? '✅ Real Data' : '⚠️ Simulated Data'}:</strong> {result._dataSource || result._note}
          </Alert>

          {(result as any).currentPrice > 0 && (result as any)._dataSource?.includes('Yahoo') && (
            <Card sx={{ mb: 3, bgcolor: 'primary.dark' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {symbol.toUpperCase()} — Current Price
                </Typography>
                <Typography variant="h3">${(result as any).currentPrice.toFixed(2)}</Typography>
                <Box display="flex" justifyContent="center" gap={3} mt={1}>
                  <Typography variant="caption" color="success.main">
                    52w High: ${result.highPrice?.toFixed(2) || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="error.main">
                    52w Low: ${result.lowPrice?.toFixed(2) || 'N/A'}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  {result.priceCount} trading days · Yahoo Finance · {new Date().toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          )}

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Total Return</Typography>
                  <Typography variant="h5" color={result.totalReturn >= 0 ? 'success.main' : 'error.main'}>
                    {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Final Capital</Typography>
                  <Typography variant="h5">${result.finalCapital.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Sharpe Ratio</Typography>
                  <Typography variant="h5" color={result.metrics.sharpeRatio >= 1 ? 'success.main' : result.metrics.sharpeRatio >= 0.5 ? 'warning.main' : 'error.main'}>
                    {result.metrics.sharpeRatio}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Max Drawdown</Typography>
                  <Typography variant="h5" color={Math.abs(result.metrics.maxDrawdown) < 15 ? 'success.main' : Math.abs(result.metrics.maxDrawdown) < 25 ? 'warning.main' : 'error.main'}>
                    {result.metrics.maxDrawdown}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Win Rate</Typography>
                  <Typography variant="h5" color={result.metrics.winRate >= 60 ? 'success.main' : result.metrics.winRate >= 40 ? 'warning.main' : 'error.main'}>
                    {result.metrics.winRate}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Total Trades</Typography>
                  <Typography variant="h5">{result.metrics.totalTrades}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Profit Factor</Typography>
                  <Typography variant="h5" color={(result.metrics as any).profitFactor >= 1.5 ? 'success.main' : (result.metrics as any).profitFactor >= 1 ? 'warning.main' : 'error.main'}>
                    {(result.metrics as any).profitFactor}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Avg Holding</Typography>
                  <Typography variant="h5">{result.metrics.averageHoldingPeriod}d</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {result.trades && result.trades.length > 0 && (
            <>
              <Typography variant="h6" mb={2}>Trades ({result.trades.length})</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Symbol</TableCell>
                      <TableCell>Side</TableCell>
                      <TableCell>Entry</TableCell>
                      <TableCell>Exit</TableCell>
                      <TableCell>Return</TableCell>
                      <TableCell>Source</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.trades.slice(0, 20).map((trade: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>{new Date(trade.entryDate).toLocaleDateString()}</TableCell>
                        <TableCell>{trade.symbol}</TableCell>
                        <TableCell>
                          <Chip label={trade.side} color={trade.side === 'long' ? 'success' : 'error'} size="small" />
                        </TableCell>
                        <TableCell>${trade.entryPrice}</TableCell>
                        <TableCell>{trade.exitPrice ? `${trade.exitPrice}` : '-'}</TableCell>
                        <TableCell>
                          <Typography color={trade.returnPercentage >= 0 ? 'success.main' : 'error.main'}>
                            {(trade.returnPercentage * 100).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>{trade.signalSource}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </>
      )}
    </Box>
  );
}
