import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00C853',
      light: '#69F0AE',
      dark: '#009624',
    },
    secondary: {
      main: '#2979FF',
      light: '#82B1FF',
      dark: '#0044B0',
    },
    background: {
      default: '#0A1929',
      paper: '#132F4C',
    },
    error: {
      main: '#FF1744',
    },
    warning: {
      main: '#FF9100',
    },
    success: {
      main: '#00E676',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});
