import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Tooltip,
  Badge,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Dashboard,
  MonetizationOn,
  Language,
  HelpOutline,
  Shield,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '@provablehq/aleo-wallet-adaptor-react';
import { usePrivLend } from '../context/PrivLendContext';

const expandedWidth = 260;
const collapsedWidth = 74;

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { address, network } = useWallet();
  const { currentBlock } = usePrivLend();

  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const openMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => setAnchorEl(null);

  const expectedNetwork = "testnet";
  const currentNetwork = network?.toLowerCase() || "unknown";
  const isCorrectNetwork = currentNetwork.includes(expectedNetwork);

  const safeBlock =
    typeof currentBlock === "number"
      ? currentBlock
      : Number((currentBlock as any)?.height ?? 0);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Borrow', icon: <MonetizationOn />, path: '/borrow' },
    { text: 'Markets', icon: <Language />, path: '/markets' },
    { text: 'Profile', icon: <AccountCircleIcon />, path: '/profile' },
    { text: 'How It Works', icon: <HelpOutline />, path: '/docs' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? collapsedWidth : expandedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: collapsed ? collapsedWidth : expandedWidth,
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          background: 'linear-gradient(180deg, #0f172a, #0b1220)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          color: 'white'
        },
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Shield sx={{ color: '#6366f1', fontSize: 28 }} />
          {!collapsed && (
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                background: 'linear-gradient(90deg,#818cf8,#6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              PrivLend
            </Typography>
          )}
        </Box>

        <IconButton
          size="small"
          onClick={() => setCollapsed(!collapsed)}
          sx={{ color: 'white' }}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 2 }} />

      {/* NAVIGATION */}
      <List sx={{ px: 1 }}>
        {menuItems.map(item => {
          const isActive = location.pathname === item.path;

          const button = (
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 3,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: 2,
                mb: 1,
                background: isActive
                  ? 'rgba(99,102,241,0.15)'
                  : 'transparent',
                '&:hover': {
                  background: 'rgba(255,255,255,0.05)',
                  transform: 'translateX(4px)'
                }
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive
                    ? '#818cf8'
                    : 'rgba(255,255,255,0.6)',
                  minWidth: 0,
                  mr: collapsed ? 0 : 2,
                  justifyContent: 'center'
                }}
              >
                {item.icon}
              </ListItemIcon>

              {!collapsed && (
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.text} disablePadding>
              {collapsed ? (
                <Tooltip title={item.text} placement="right">
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </ListItem>
          );
        })}
      </List>

      {/* BOTTOM SECTION */}
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)', mb: 2 }} />

        {/* NETWORK CARD */}
        <Box
          onClick={openMenu}
          sx={{
            p: 2,
            borderRadius: 3,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.05)',
            mb: 2,
            cursor: 'pointer'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isCorrectNetwork ? '#10b981' : '#ef4444',
                boxShadow: isCorrectNetwork
                  ? '0 0 8px #10b981'
                  : '0 0 8px #ef4444',
              }}
            />

            {!collapsed && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Network
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: isCorrectNetwork
                      ? '#10b981'
                      : '#ef4444'
                  }}
                >
                  Aleo | {network || "Unknown"}
                </Typography>
              </Box>
            )}
          </Box>

          {!collapsed && (
            <Box mt={1}>
              <Typography
                variant="caption"
                sx={{
                  color: '#8b5cf6',
                  fontWeight: 600
                }}
              >
                Block #{safeBlock.toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>

        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
          <MenuItem onClick={closeMenu}>Devnet</MenuItem>
          <MenuItem onClick={closeMenu}>Testnet</MenuItem>
          <MenuItem onClick={closeMenu}>Mainnet</MenuItem>
        </Menu>

        {/* WALLET CARD */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            background:
              'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(99,102,241,0.05))',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            justifyContent: collapsed ? 'center' : 'flex-start'
          }}
        >
          <Avatar sx={{ width: 36, height: 36 }}>
            {address ? address.slice(0, 2) : '?'}
          </Avatar>

          {!collapsed && address && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Connected
              </Typography>
              <Typography variant="body2">
                {address.slice(0, 6)}...
                {address.slice(-4)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};