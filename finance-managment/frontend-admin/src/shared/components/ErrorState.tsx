import { Box, Alert, Button, Typography } from '@mui/material';

interface ErrorStateProps {
  error: Error | null;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
      <Alert severity="error" sx={{ mb: 2 }}>
        {error?.message || 'An error occurred'}
      </Alert>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry}>Retry</Button>
      )}
    </Box>
  );
}
