import { Box, CircularProgress, Typography } from '@mui/material';

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
      <CircularProgress />
      <Typography mt={2} color="text.secondary">{message}</Typography>
    </Box>
  );
}
