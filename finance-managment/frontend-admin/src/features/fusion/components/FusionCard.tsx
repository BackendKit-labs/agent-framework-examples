import { Card, CardContent, Typography, Box, Chip, LinearProgress } from '@mui/material';
import type { FusedSignal } from '../../../shared/api/types';

const ACTION_COLORS: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  STRONG_BUY: 'success',
  CAUTIOUS_BUY: 'info',
  HOLD: 'default',
  CAUTIOUS_SELL: 'warning',
  STRONG_SELL: 'error',
  CONFLICT_HOLD: 'warning',
};

interface FusionCardProps {
  signal: FusedSignal;
}

export function FusionCard({ signal }: FusionCardProps) {
  const color = ACTION_COLORS[signal.action] || 'default';
  const scorePercent = ((signal.score + 1) / 2) * 100; // Map -1..1 to 0..100

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{signal.symbol}</Typography>
          <Chip label={signal.action} color={color} size="small" />
        </Box>

        <LinearProgress
          variant="determinate"
          value={scorePercent}
          color={signal.score >= 0 ? 'success' : 'error'}
          sx={{ height: 8, borderRadius: 4, mb: 1 }}
        />

        <Typography variant="body2" color="text.secondary">
          Score: {(signal.score * 100).toFixed(1)}% | Confidence: {(signal.confidence * 100).toFixed(0)}%
        </Typography>

        {signal.contributions?.map((c, i) => (
          <Typography key={i} variant="caption" display="block" color="text.secondary">
            {c.source}: {(c.score * 100).toFixed(0)}% (weight: {(c.weight * 100).toFixed(0)}%)
          </Typography>
        ))}

        {signal.conflict && (
          <Chip
            label={`⚠ Conflict: ${signal.conflict.bullishSources.length} bullish vs ${signal.conflict.bearishSources.length} bearish`}
            color="warning"
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </CardContent>
    </Card>
  );
}
