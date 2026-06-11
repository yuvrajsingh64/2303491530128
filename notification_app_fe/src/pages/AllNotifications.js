import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Chip, Card, CardContent, Divider,
  CircularProgress, Alert, Pagination, FormControl,
  InputLabel, Select, MenuItem, Tooltip, IconButton,
  Badge, Stack
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CelebrationIcon from '@mui/icons-material/Celebration';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import { useNotifications } from '../context/NotificationContext';

const TYPE_CONFIG = {
  Placement: { color: 'success', icon: <WorkIcon fontSize="small" />, bg: '#1b5e20', chip: '#2e7d32' },
  Result:    { color: 'info',    icon: <SchoolIcon fontSize="small" />, bg: '#0d47a1', chip: '#1565c0' },
  Event:     { color: 'warning', icon: <CelebrationIcon fontSize="small" />, bg: '#e65100', chip: '#ef6c00' },
};

const ITEMS_PER_PAGE = 10;

export default function AllNotifications() {
  const { notifications, loading, error, viewedIds, markViewed, markAllViewed, fetchNotifications } = useNotifications();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchNotifications({ page: 1, limit: 100, notification_type: filter });
    setPage(1);
  }, [filter, fetchNotifications]);

  const filtered = filter ? notifications.filter(n => n.Type === filter) : notifications;
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const unreadCount = filtered.filter(n => !viewedIds.has(n.ID)).length;

  function formatTime(ts) {
    try { return new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return ts; }
  }

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsNoneIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          </Badge>
          <Box>
            <Typography variant="h5" fontWeight={700}>All Notifications</Typography>
            <Typography variant="body2" color="text.secondary">
              {filtered.length} total · {unreadCount} unread
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select value={filter} label="Filter by Type" onChange={e => setFilter(e.target.value)}>
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Placement">💼 Placement</MenuItem>
              <MenuItem value="Result">📊 Result</MenuItem>
              <MenuItem value="Event">🎉 Event</MenuItem>
            </Select>
          </FormControl>
          {unreadCount > 0 && (
            <Tooltip title="Mark all as read">
              <IconButton color="primary" onClick={() => markAllViewed(filtered.map(n => n.ID))}>
                <DoneAllIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      {/* Error Banner */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          API unavailable — showing sample data. ({error})
        </Alert>
      )}

      {/* Loading */}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}

      {/* Notification Cards */}
      {!loading && (
        <Stack spacing={1.5}>
          {paginated.map(notif => {
            const cfg = TYPE_CONFIG[notif.Type] || TYPE_CONFIG.Event;
            const isNew = !viewedIds.has(notif.ID);
            return (
              <Card
                key={notif.ID}
                elevation={isNew ? 3 : 1}
                onClick={() => markViewed(notif.ID)}
                sx={{
                  cursor: 'pointer',
                  borderLeft: `4px solid`,
                  borderLeftColor: `${cfg.color}.main`,
                  bgcolor: isNew ? 'action.hover' : 'background.paper',
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'translateX(4px)', boxShadow: 4 },
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                <CardContent sx={{ py: '12px !important', px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    {/* Type Icon */}
                    <Box sx={{
                      bgcolor: `${cfg.color}.dark`, color: 'white',
                      borderRadius: 1.5, p: 0.8, display: 'flex', alignItems: 'center',
                      flexShrink: 0, mt: 0.2
                    }}>
                      {cfg.icon}
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                        <Chip label={notif.Type} color={cfg.color} size="small" sx={{ fontSize: '0.7rem', height: 20 }} />
                        {isNew && <FiberNewIcon color="error" sx={{ fontSize: 18 }} />}
                      </Box>
                      <Typography variant="body1" fontWeight={isNew ? 600 : 400} noWrap>
                        {notif.Message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(notif.Timestamp)}
                      </Typography>
                    </Box>

                    {/* Unread dot */}
                    {isNew && (
                      <Box sx={{
                        width: 10, height: 10, borderRadius: '50%',
                        bgcolor: 'error.main', flexShrink: 0, mt: 0.8,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.4 },
                        }
                      }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}

          {paginated.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <NotificationsNoneIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">No notifications found</Typography>
            </Box>
          )}
        </Stack>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} color="primary" />
        </Box>
      )}
    </Box>
  );
}
