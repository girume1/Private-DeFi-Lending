import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  alpha
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import './index.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    secondary: { main: '#10b981' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    background: {
      default: '#0f172a',
      paper: '#1e293b'
    }
  },

  typography: {
    fontFamily:
      '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '3.5rem', fontWeight: 700 },
    h2: { fontSize: '2.5rem', fontWeight: 600 },
    button: { fontWeight: 600 }
  },

  shape: {
    borderRadius: 14
  },

  shadows: [
    'none',
    '0 4px 20px rgba(0,0,0,0.2)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.3)'
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0f172a'
        }
      }
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha('#ffffff', 0.05)}`
        }
      }
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha('#ffffff', 0.05)}`,
          backdropFilter: 'blur(10px)'
        }
      }
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          transition: 'all 0.2s ease'
        },

        containedPrimary: {
          background:
            'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 6px 20px rgba(99,102,241,0.3)',

          '&:hover': {
            background:
              'linear-gradient(135deg, #818cf8, #a78bfa)',
            boxShadow: '0 8px 30px rgba(99,102,241,0.4)'
          }
        },

        containedSecondary: {
          background:
            'linear-gradient(135deg, #10b981, #059669)',

          '&:hover': {
            background:
              'linear-gradient(135deg, #34d399, #10b981)'
          }
        }
      }
    },

    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500
        }
      }
    },

    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16
        }
      }
    }
  }
});

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
