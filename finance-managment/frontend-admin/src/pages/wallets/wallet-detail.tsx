import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, Button, Dialog, DialogTitle, DialogContent, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Alert, Autocomplete } from '@mui/material';
// SVG icons inline
const ArrowBackSvg = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
const EditSvg = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const DeleteSvg = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const AddSvg = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
import { useWallet } from '../../features/wallets/hooks/useWallets';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';
import client from '../../shared/api/client';

export default function WalletDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: wallet, isLoading, error, refetch } = useWallet(id!);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openHolding, setOpenHolding] = useState(false);
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioStrategy, setPortfolioStrategy] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<any>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const [holdingSymbol, setHoldingSymbol] = useState('');
  const [holdingAmount, setHoldingAmount] = useState(''); // Amount in dollars to invest
  const [holdingPrice, setHoldingPrice] = useState('');
  const [assetSuggestions, setAssetSuggestions] = useState<string[]>([]);
  const [holdingError, setHoldingError] = useState<string | null>(null);
  const [currentAssetPrice, setCurrentAssetPrice] = useState<number | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const portfolios = (wallet as any)?.portfolios || [];

  const handleCreatePortfolio = async () => {
    if (!portfolioName.trim()) return;
    try {
      await client.post(`/wallets/${id}/portfolios`, { name: portfolioName, strategy: portfolioStrategy || undefined });
      setPortfolioName(''); setPortfolioStrategy(''); setOpenCreate(false); refetch();
    } catch (err) { console.error(err); }
  };

  const handleEditPortfolio = async () => {
    if (!selectedPortfolio || !portfolioName.trim()) return;
    try {
      await client.patch(`/wallets/${id}/portfolios/${selectedPortfolio.id}`, { name: portfolioName, strategy: portfolioStrategy || undefined });
      setOpenEdit(false); setSelectedPortfolio(null); refetch();
    } catch (err) { console.error(err); }
  };

  const handleDeletePortfolio = async () => {
    if (!selectedPortfolio) return;
    try {
      await client.delete(`/wallets/${id}/portfolios/${selectedPortfolio.id}`);
      setOpenDelete(false); setSelectedPortfolio(null); refetch();
    } catch (err) { console.error(err); }
  };

  const handleSymbolSelect = async (symbol: string) => {
    setHoldingSymbol(symbol.toUpperCase());
    setHoldingAmount('');
    setHoldingPrice('');
    setCurrentAssetPrice(null);
    if (!symbol) return;
    try {
      const res = await client.get(`/assets/validate/${symbol}`);
      if (res.data.valid && res.data.currentPrice) {
        setCurrentAssetPrice(Number(res.data.currentPrice));
        setHoldingPrice(String(res.data.currentPrice));
      }
    } catch {}
  };

  const handleAddHolding = async () => {
    if (!selectedPortfolio || !selectedPortfolio.id) {
      setHoldingError('No portfolio selected. Please select a portfolio first.');
      return;
    }
    if (!holdingSymbol || !holdingAmount || !holdingPrice) {
      setHoldingError('Please fill in all fields');
      return;
    }
    setHoldingError(null);
    try {
      const assetRes = await client.get(`/assets/validate/${holdingSymbol}`);
      if (!assetRes.data.valid) {
        setHoldingError('Symbol "' + holdingSymbol + '" not found.');
        return;
      }
      const asset = assetRes.data;
      const assetId = asset.id || asset.assetId;
      const price = parseFloat(holdingPrice);
      const amount = parseFloat(holdingAmount);
      const quantity = amount / price;

      console.log('Buying:', { assetId, quantity, price, walletId: id, portfolioId: selectedPortfolio.id });

      const res = await client.post('/transactions', {
        type: 'buy', assetId, quantity,
        price, walletId: id, portfolioId: selectedPortfolio.id,
        userId: '392ef270-0acd-4b8a-9486-4a0100e946a0', reason: 'manual',
      });
      console.log('Buy result:', res.data);
      setHoldingSymbol(''); setHoldingAmount(''); setHoldingPrice('');
      setCurrentAssetPrice(null);
      setHoldingError(null); setOpenHolding(false); refetch();
    } catch (err: any) {
      const detail = err?.response?.data;
      const msg = detail?.message || err?.message || 'Failed to add holding';
      console.error('Add holding error:', err);
      setHoldingError(msg + (detail?.error ? ' (' + detail.error + ')' : ''));
    }
  };

  const handleRemoveHolding = async (holdingId: string) => {
    try { await client.delete(`/holdings/${holdingId}`); refetch(); }
    catch (err) { console.error(err); }
  };

  const handleAssetSearch = async (query: string) => {
    if (query.length < 1) return;
    try {
      const res = await client.get(`/assets/search?q=${encodeURIComponent(query)}`);
      setAssetSuggestions(res.data.map((a: any) => a.symbol));
    } catch { setAssetSuggestions([]); }
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, portfolio: any) => {
    e.stopPropagation(); setMenuAnchor(e.currentTarget); setSelectedPortfolio(portfolio);
  };
  const closeMenu = () => { setMenuAnchor(null); };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/wallets')}><ArrowBackSvg /></IconButton>
        <Typography variant="h4">{wallet?.name}</Typography>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">Total Value</Typography>
            <Typography variant="h5">${Number(wallet?.totalValue || 0).toLocaleString()}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">ROI</Typography>
            <Typography variant="h5" color={Number(wallet?.totalReturn || 0) >= 0 ? 'success.main' : 'error.main'}>{wallet?.totalReturn || 0}%</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card><CardContent>
            <Typography variant="subtitle2" color="text.secondary">Portfolios</Typography>
            <Typography variant="h5">{portfolios.length}</Typography>
          </CardContent></Card>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Portfolios</Typography>
        <Button variant="contained" size="small" onClick={() => setOpenCreate(true)}>+ New Portfolio</Button>
      </Box>

      {portfolios.length === 0 ? (
        <Card><CardContent><Typography color="text.secondary" textAlign="center" py={4}>No portfolios yet.</Typography></CardContent></Card>
      ) : portfolios.map((p: any) => (
        <Card key={p.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">{p.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Strategy: {p.strategy || 'N/A'} | Value: ${Number(p.totalValue).toLocaleString()}
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Button size="small" variant="outlined" startIcon={<AddSvg />} onClick={() => { setSelectedPortfolio(p); setHoldingError(null); setOpenHolding(true); }}>Add Holding</Button>
                <IconButton size="small" onClick={() => { setSelectedPortfolio(p); setPortfolioName(p.name); setPortfolioStrategy(p.strategy || ''); setOpenEdit(true); }}><EditSvg /></IconButton>
                <IconButton size="small" onClick={() => { setSelectedPortfolio(p); setOpenDelete(true); }}><DeleteSvg /></IconButton>
              </Box>
            </Box>

            {p.holdings && p.holdings.length > 0 ? (
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead><TableRow>
                    <TableCell>Symbol</TableCell><TableCell>Qty</TableCell><TableCell>Avg Price</TableCell>
                    <TableCell>Value</TableCell><TableCell>Return</TableCell><TableCell></TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {p.holdings.map((h: any) => (
                      <TableRow key={h.id}>
                        <TableCell><strong>{h.asset?.symbol || 'N/A'}</strong></TableCell>
                        <TableCell>{Number(h.quantity).toFixed(4)}</TableCell>
                        <TableCell>${Number(h.averageBuyPrice).toFixed(2)}</TableCell>
                        <TableCell>${Number(h.currentValue).toLocaleString()}</TableCell>
                        <TableCell>
                          <Typography color={Number(h.returnPercentage) >= 0 ? 'success.main' : 'error.main'}>
                            {Number(h.returnPercentage).toFixed(1)}%
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton size="small" color="error" onClick={() => handleRemoveHolding(h.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info" sx={{ mt: 2 }}>No holdings yet. Click "Add Holding" to add assets.</Alert>
            )}
          </CardContent>
        </Card>
      ))}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Portfolio</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Name" value={portfolioName} onChange={(e) => setPortfolioName(e.target.value)} margin="normal" />
          <TextField fullWidth label="Strategy" value={portfolioStrategy} onChange={(e) => setPortfolioStrategy(e.target.value)} margin="normal" placeholder="e.g. growth, value" />
          <Button fullWidth variant="contained" onClick={handleCreatePortfolio} sx={{ mt: 2 }}>Create</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Portfolio</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Name" value={portfolioName} onChange={(e) => setPortfolioName(e.target.value)} margin="normal" />
          <TextField fullWidth label="Strategy" value={portfolioStrategy} onChange={(e) => setPortfolioStrategy(e.target.value)} margin="normal" />
          <Button fullWidth variant="contained" onClick={handleEditPortfolio} sx={{ mt: 2 }}>Save</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Portfolio?</DialogTitle>
        <DialogContent>
          <Typography>Delete <strong>{selectedPortfolio?.name}</strong>? This removes all holdings.</Typography>
          <Box display="flex" gap={2} mt={2}>
            <Button fullWidth variant="outlined" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button fullWidth variant="contained" color="error" onClick={handleDeletePortfolio}>Delete</Button>
          </Box>
        </DialogContent>
      </Dialog>

      <Dialog open={openHolding} onClose={() => setOpenHolding(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Holding to {selectedPortfolio?.name}</DialogTitle>
        <DialogContent>
          {holdingError && <Alert severity="error" sx={{ mb: 2 }}>{holdingError}</Alert>}
          
          <Autocomplete freeSolo options={assetSuggestions}
            onInputChange={(_, v) => handleSymbolSelect(v)}
            renderInput={(params) => <TextField {...params} fullWidth label="Symbol" margin="normal" placeholder="e.g. AAPL, BTC" />}
          />

          {currentAssetPrice && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Current price: <strong>${currentAssetPrice.toFixed(2)}</strong>
            </Alert>
          )}

          <TextField fullWidth label="Amount to Invest ($)" value={holdingAmount} onChange={(e) => setHoldingAmount(e.target.value)} margin="normal" type="number" placeholder="e.g. 1000" />

          {holdingAmount && holdingPrice && (
            <Alert severity="success" sx={{ mt: 1 }}>
              You will buy <strong>{(parseFloat(holdingAmount) / parseFloat(holdingPrice)).toFixed(6)}</strong> units
              {holdingSymbol === 'BTC' && <span> ({(parseFloat(holdingAmount) / parseFloat(holdingPrice) * 100000000).toFixed(0)} sats)</span>}
              {holdingSymbol === 'ETH' && <span> ({(parseFloat(holdingAmount) / parseFloat(holdingPrice) * 1000000000000000000).toFixed(0)} wei)</span>}
            </Alert>
          )}

          <TextField fullWidth label="Price per Unit ($)" value={holdingPrice} onChange={(e) => setHoldingPrice(e.target.value)} margin="normal" type="number" />

          <Button fullWidth variant="contained" onClick={handleAddHolding} sx={{ mt: 2 }}>
            Buy ${parseFloat(holdingAmount || '0').toFixed(2)} of {holdingSymbol || '...'}
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
