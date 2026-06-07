import { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip, Button, Alert, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, IconButton, Collapse } from '@mui/material';
// SVG icons inline
const ExpandMoreSvg = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/></svg>;
const ExpandLessSvg = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/></svg>;
import { usePortfolioFusion, useFusionProfiles, useUpdateWeights } from '../../features/fusion/hooks/useFusion';
import { LoadingState } from '../../shared/components/LoadingState';
import { ErrorState } from '../../shared/components/ErrorState';

const ACTION_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  STRONG_BUY: 'success',
  CAUTIOUS_BUY: 'info',
  HOLD: 'default',
  CAUTIOUS_SELL: 'warning',
  STRONG_SELL: 'error',
  CONFLICT_HOLD: 'warning',
};

const ACTION_EMOJIS: Record<string, string> = {
  STRONG_BUY: '🟢',
  CAUTIOUS_BUY: '🔵',
  HOLD: '⚪',
  CAUTIOUS_SELL: '🟠',
  STRONG_SELL: '🔴',
  CONFLICT_HOLD: '🟡',
};

const ACTION_EXPLANATIONS: Record<string, string> = {
  STRONG_BUY: 'Strong buy signal — multiple sources agree this is a good opportunity',
  CAUTIOUS_BUY: 'Cautious buy — positive signals but not overwhelming',
  HOLD: 'Hold — no strong signals in either direction',
  CAUTIOUS_SELL: 'Cautious sell — some negative signals detected',
  STRONG_SELL: 'Strong sell — multiple sources agree this is a risk',
  CONFLICT_HOLD: 'Conflict detected — sources disagree, wait for alignment',
};

const SOURCE_LABELS: Record<string, string> = {
  news: '📰 News Sentiment',
  smart_money_13f: '🏦 Institutional (13F)',
  smart_money_form4: '🔍 Insider Trades',
  smart_money_whale: '🐋 Whale Transactions',
  technical: '📊 Technical Analysis',
};

function SignalDetailCard({ signal }: { signal: any }) {
  const [expanded, setExpanded] = useState(false);
  const color = ACTION_COLORS[signal.action] || 'default';
  const scorePercent = ((signal.score + 1) / 2) * 100;

  return (
    <Card sx={{ borderLeft: 4, borderColor: `${color}.main`, mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">
              {ACTION_EMOJIS[signal.action] || '⚪'} {signal.symbol}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Score: {(signal.score * 100).toFixed(1)}% · Confidence: {(signal.confidence * 100).toFixed(0)}%
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip label={signal.action} color={color} size="small" />
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ExpandLessSvg /> : <ExpandMoreSvg />}
            </IconButton>
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={scorePercent}
          color={signal.score >= 0 ? 'success' : 'error'}
          sx={{ height: 8, borderRadius: 4, my: 1.5 }}
        />

        <Box display="flex" justifyContent="space-between">
          <Typography variant="caption" color="error.main">Bearish -1</Typography>
          <Typography variant="caption" color="success.main">Bullish +1</Typography>
        </Box>

        <Collapse in={expanded}>
          <Box mt={2}>
            <Typography variant="subtitle2" mb={1}>Source Contributions</Typography>
            {signal.contributions?.map((c: any, i: number) => (
              <Box key={i} display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                <Typography variant="body2">{SOURCE_LABELS[c.source] || c.source}</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={c.score >= 0 ? 'success.main' : 'error.main'}
                  >
                    {(c.score * 100).toFixed(0)}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    (weight: {(c.weight * 100).toFixed(0)}%)
                  </Typography>
                </Box>
              </Box>
            ))}

            {signal.conflict && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2" fontWeight="bold">⚠️ Conflict Detected</Typography>
                <Typography variant="caption">
                  {signal.conflict.bullishSources.length} bullish vs {signal.conflict.bearishSources.length} bearish sources
                </Typography>
                <Typography variant="caption" display="block">
                  Resolution: {signal.conflict.resolution}
                </Typography>
              </Alert>
            )}

            <Box mt={1} p={1} bgcolor="action.hover" borderRadius={1}>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {signal.rationale}
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}

export default function FusionPage() {
  const [portfolioId] = useState('68c3aad4-e9c3-4884-911a-76f244665f8c');
  const { data, isLoading, error } = usePortfolioFusion(portfolioId);
  const { data: profiles } = useFusionProfiles();
  const updateWeights = useUpdateWeights();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const summary = data?.summary;
  const signals = data?.signals || [];

  // Sort signals by score (most extreme first)
  const sortedSignals = [...signals].sort((a, b) => Math.abs(b.score) - Math.abs(a.score));

  return (
    <Box>
      <Typography variant="h4" mb={1}>Signal Fusion</Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Fusiona señales de múltiples fuentes (noticias, smart money, análisis técnico) en una recomendación única por activo.
        Los pesos son configurables según tu perfil de inversión.
      </Typography>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="success.main">{summary.strongBuy}</Typography>
                <Typography variant="caption" color="text.secondary">Strong Buy</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="info.main">{summary.cautiousBuy}</Typography>
                <Typography variant="caption" color="text.secondary">Cautious Buy</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4">{summary.hold}</Typography>
                <Typography variant="caption" color="text.secondary">Hold</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="warning.main">{summary.cautiousSell}</Typography>
                <Typography variant="caption" color="text.secondary">Cautious Sell</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="error.main">{summary.strongSell}</Typography>
                <Typography variant="caption" color="text.secondary">Strong Sell</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography variant="h4" color="warning.main">{summary.conflictHold}</Typography>
                <Typography variant="caption" color="text.secondary">Conflict</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* How it works */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>🔍 Cómo leer esto:</strong> Cada activo muestra un score de -1 (bearish) a +1 (bullish).
          Haz clic en la flecha para ver el detalle de cada fuente y si hay conflictos entre ellas.
        </Typography>
      </Alert>

      {/* Investor Profiles */}
      {profiles && (
        <Box mb={3}>
          <Typography variant="subtitle2" mb={1}>Investment Profiles</Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {profiles.profiles.map((p: any) => (
              <Tooltip key={p.id} title={`News: ${(p.weights.news * 100).toFixed(0)}% · 13F: ${(p.weights.smart_money_13f * 100).toFixed(0)}% · Whale: ${(p.weights.smart_money_whale * 100).toFixed(0)}%`}>
                <Chip
                  label={p.name}
                  onClick={() => updateWeights.mutate(p.weights)}
                  variant="outlined"
                  sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
                />
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      {/* Signals */}
      <Typography variant="h5" mb={2}>
        Asset Signals ({sortedSignals.length})
      </Typography>

      {sortedSignals.map((signal: any) => (
        <SignalDetailCard key={signal.symbol} signal={signal} />
      ))}
    </Box>
  );
}
