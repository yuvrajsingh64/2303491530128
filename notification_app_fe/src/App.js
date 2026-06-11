import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  ThemeProvider, createTheme, CssBaseline,
  AppBar, Toolbar, Typography, Container, Box,
  Tabs, Tab, Badge, Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import AllNotifications from './pages/AllNotifications';
import PriorityInbox from './pages/PriorityInbox';

// Dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7c3aed' },
    secondary: { main: '#10b981' },
    background: { default: '#0f1117', paper: '#1a1d27' },
    success: { main: '#22c55e', dark: '#15803d' },
    info: { main: '#3b82f6', dark: '#1d4ed8' },
    warning: { main: '#f59e0b', dark: '#b45309' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { backgroundImage: 'none' }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }
      }
    }
  }
});

function NavTabs() {
  const location = useLocation();
  const { notifications, viewedIds } = useNotifications();
  const unread = notifications.filter(n => !viewedIds.has(n.ID)).length;
  const value = location.pathname === '/priority' ? 1 : 0;

  return (
    <Tabs value={value} textColor="inherit" indicatorColor="secondary"
      sx={{ '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600 } }}>
      <Tab
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={unread} color="error" max={99}>
              <NotificationsIcon fontSize="small" />
            </Badge>
            <span>All Notifications</span>
          </Box>
        }
        component={Link} to="/"
      />
      <Tab
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEventsIcon fontSize="small" sx={{ color: '#f59e0b' }} />
            <span>Priority Inbox</span>
          </Box>
        }
        component={Link} to="/priority"
      />
    </Tabs>
  );
}

function AppContent() {
  return (
    <Router>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 3 }}>
            <NotificationsIcon sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
              NotifyHub
            </Typography>
            <Chip label="Campus" size="small" color="primary" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
          </Box>
          <NavTabs />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Routes>
          <Route path="/" element={<AllNotifications />} />
          <Route path="/priority" element={<PriorityInbox />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ThemeProvider>
  );
}
