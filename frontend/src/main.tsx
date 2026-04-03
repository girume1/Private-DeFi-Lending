import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {
  ThemeProvider,
  createTheme,
  alpha
} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary:    { main: '#F59E0B' },
    secondary:  { main: '#8B5CF6' },   
    error:      { main: '#ef4444' },
    warning:    { main: '#F59E0B' },
    info:       { main: '#06b6d4' },
    success:    { main: '#10b981' },
    background: {
      default: '#0F172A',
      paper:   '#111827',
    },
  },

  typography: {
    fontFamily: '"Exo 2", "Inter", "Roboto", sans-serif',
    h1: { fontFamily: '"Orbitron", sans-serif', fontSize: '3.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Orbitron", sans-serif', fontSize: '2.5rem', fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontFamily: '"Orbitron", sans-serif', fontSize: '1.75rem', fontWeight: 600 },
    h4: { fontFamily: '"Orbitron", sans-serif', fontSize: '1.35rem', fontWeight: 600 },
    h5: { fontFamily: '"Orbitron", sans-serif', fontSize: '1.1rem',  fontWeight: 600 },
    h6: { fontFamily: '"Orbitron", sans-serif', fontSize: '0.95rem', fontWeight: 600 },
    button: { fontWeight: 600, fontFamily: '"Exo 2", sans-serif' },
  },

  shape: { borderRadius: 14 },

  shadows: [
    'none',
    '0 4px 20px rgba(0,0,0,0.3)',
    '0 8px 30px rgba(0,0,0,0.4)',
    ...Array(22).fill('0 8px 30px rgba(0,0,0,0.4)'),
  ] as any,

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: '#0F172A' },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha('#ffffff', 0.06)}`,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: `1px solid ${alpha('#ffffff', 0.06)}`,
          backdropFilter: 'blur(10px)',
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #F59E0B, #FBBF24)',
          color: '#0F172A',
          fontWeight: 700,
          boxShadow: '0 6px 20px rgba(245,158,11,0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FBBF24, #FCD34D)',
            boxShadow: '0 8px 30px rgba(245,158,11,0.5)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          color: '#fff',
          boxShadow: '0 6px 20px rgba(139,92,246,0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
            boxShadow: '0 8px 30px rgba(139,92,246,0.5)',
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } },
    },

    MuiTableContainer: {
      styleOverrides: { root: { borderRadius: 16 } },
    },
  },
});

ReactDOM.createRoot(
  document.getElementById('root')!
).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '0.875rem',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
