import { Box, Card, CardContent, Typography, Chip, Grid, LinearProgress } from '@mui/material';

interface ClusterProps {
  cluster: {
    symbol: string;
    direction: 'accumulating' | 'distributing';
    investorCount: number;
    totalCapital: number;
    topInvestors: string[];
    averageConviction: number;
    signalStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'VERY_STRONG';
  };
}

const STRENGTH_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
  VERY_STRONG: 'success',
  STRONG: 'info',
  MODERATE: 'warning',
  WEAK: 'error',
};

const STRENGTH_LABELS: Record<string, string> = {
  VERY_STRONG: '🟢 Very Strong — Multiple top investors moving together',
  STRONG: '🔵 Strong — Significant capital rotation detected',
  MODERATE: '🟡 Moderate — Some investors aligned',
  WEAK: '🔴 Weak — Minimal co-investment signal',
};

export function CoInvestmentClusterCard({ cluster }: ClusterProps) {
  const isAccumulating = cluster.direction === 'accumulating';
  const color = isAccumulating ? 'success.main' : 'error.main';
  const directionLabel = isAccumulating ? '📈 Accumulating (Buying)' : '📉 Distributing (Selling)';
  const strengthColor = STRENGTH_COLORS[cluster.signalStrength];

  return (
    <Card sx={{ borderLeft: 4, borderColor: color }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6">{cluster.symbol}</Typography>
          <Chip label={directionLabel} color={isAccumulating ? 'success' : 'error'} size="small" />
        </Box>

        <Typography variant="body2" color={color} fontWeight="bold" mb={2}>
          {cluster.investorCount} investors · ${(cluster.totalCapital / 1000000000).toFixed(1)}B combined
        </Typography>

        <Box mb={1}>
          <Typography variant="caption" color="text.secondary">Average Conviction</Typography>
          <LinearProgress
            variant="determinate"
            value={cluster.averageConviction * 100}
            color={strengthColor}
            sx={{ height: 6, borderRadius: 3 }}
          />
          <Typography variant="caption" color="text.secondary">
            {(cluster.averageConviction * 100).toFixed(0)}% confidence
          </Typography>
        </Box>

        <Box mb={1}>
          <Typography variant="caption" color="text.secondary">Signal Strength</Typography>
          <Typography variant="body2">
            {STRENGTH_LABELS[cluster.signalStrength]}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary">Top Investors</Typography>
        <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
          {cluster.topInvestors.map((investor) => (
            <Chip key={investor} label={investor} size="small" variant="outlined" />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
