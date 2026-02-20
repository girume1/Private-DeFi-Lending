import React from 'react';
import { 
  Box, Drawer, List, ListItem, ListItemButton, 
  ListItemIcon, ListItemText, Typography, Divider 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  MonetizationOn as BorrowIcon, 
  Language as MarketsIcon, 
  History as HistoryIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 260;

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Borrow', icon: <BorrowIcon />, path: '/borrow' },
    { text: 'Markets', icon: <MarketsIcon />, path: '/markets' },
    { text: 'History', icon: <HistoryIcon />, path: '/history' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: '#0f172a',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          color: 'white'
        },
      }}
    >
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShieldIcon sx={{ color: '#6366f1', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
          PrivLend
        </Typography>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 2 }} />

      <List sx={{ px: 2 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  transition: 'all 0.2s',
                  '&.Mui-selected': {
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    '&:hover': { background: 'rgba(99, 102, 241, 0.25)' }
                  },
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.03)',
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? '#818cf8' : 'rgba(255,255,255,0.5)', 
                  minWidth: 40 
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ fontWeight: isActive ? 600 : 400 }} 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      
      <Box sx={{ mt: 'auto', p: 3 }}>
        <Box sx={{ 
          p: 2, 
          borderRadius: 3, 
          background: 'rgba(99, 102, 241, 0.05)', 
          border: '1px solid rgba(99, 102, 241, 0.1)' 
        }}>
          <Typography variant="caption" color="text.secondary">Network</Typography>
          <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>Aleo Testnet</Typography>
        </Box>
      </Box>
    </Drawer>
  );
};