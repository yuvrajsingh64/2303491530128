import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Slider,
  FormControl, InputLabel, Select, MenuItem, Stack,
  Alert, CircularProgress, Tooltip, LinearProgress,
  Divider, Badge
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import CelebrationIcon from '@mui/icons-material/Celebration';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import { useNotifications } from '../context/NotificationContext';

const TYPE_CONFIG = {
  Placement: { color: 'success', icon: <WorkIcon fontSize="small" />, weight: 3, label: 'Weight: 3' },
  Result:    { color: 'info',    icon: <SchoolIcon fontSize="small" />, weight: 2, label: 'Weight: 2' },
  Event:     { color: 'warning', icon: <CelebrationIcon fontSize="small" />, weight: 1, label: 'Weight: 1' },
};

export default function PriorityInbox() {
  const { notifications, loading, error, viewedIds, markViewed, fetchNotifications, getTopN } = useNotifications();
  const [topN, setTopN] = useState(10);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchNotifications({ limit: 100 });
  }, [fetchNotifications]);

  const source = filter ? notifications.filter(n => n.Type === filter) : notifications;
  const priorityList = getTopN(source, topN);
  const maxScore = priorityList[0]?.score || 1;

  function formatTime(ts) {
    try { return new Date(ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return ts; }
  }

  function getRelativeTime(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const hours = diff / 3600000;
    if (hours < 1) return `${Math.round(hours * 60)}m ago`;
    if (hours < 24) return `${Math.round(hours)}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  }

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <EmojiEventsIcon sx={{ fontSize: 36, color: 'warning.main' }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Priority Inbox</Typography>
          <Typography variant="body2" color="text.secondary">
            Top {topN} notifications ranked by type weight × recency
          </Typography>
        </Box>
      </Box>

      {/* Weight Legend */}
      <Card variant="outlined" sx={{ mb: 3, bgcolor: 'background.default' }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            PRIORITY WEIGHT SYSTEM
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
              <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Chip icon={cfg.icon} label={`${type} — ${cfg.label}`} color={cfg.color} size="small" variant="outlined" />
              </Box>
            ))}
            <Chip icon={<TrendingUpIcon fontSize="small" />} label="× Recency Score" size="small" variant="outlined" />
          </Stack>
        </CardContent>
      </Card>

      {/* Controls */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter by Type</InputLabel>
          <Select value={filter} label="Filter by Type" onChange={e => setFilter(e.target.value)}>
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="Placement">💼 Placement</MenuItem>
            <MenuItem value="Result">📊 Result</MenuItem>
            <MenuItem value="Event">🎉 Event</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1, maxWidth: 320 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Show Top N: <strong>{topN}</strong>
          </Typography>
          <Slider
            value={topN}
            min={5} max={20} step={5}
            marks={[{ value: 5, label: '5' }, { value: 10, label: '10' }, { value: 15, label: '15' }, { value: 20, label: '20' }]}
            onChange={(_, v) => setTopN(v)}
            color="primary"
            size="small"
          />
        </Box>
      </Stack>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>API unavailable — showing sample data.</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}

      {/* Priority Cards */}
      {!loading && (
        <Stack spacing={2}>
          {priorityList.map((notif, idx) => {
            const cfg = TYPE_CONFIG[notif.Type] || TYPE_CONFIG.Event;
            const isNew = !viewedIds.has(notif.ID);
            const scorePercent = Math.min(100, (notif.score / maxScore) * 100);
            const medal = idx < 3 ? medalColors[idx] : null;

            return (
              <Card
                key={notif.ID}
                elevation={isNew ? 4 : 1}
                onClick={() => markViewed(notif.ID)}
                sx={{
                  cursor: 'pointer',
                  border: medal ? `2px solid ${medal}` : '1px solid',
                  borderColor: medal || 'divider',
                  transition: 'all 0.2s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
                  bgcolor: isNew ? 'action.hover' : 'background.paper',
                }}
              >
                <CardContent sx={{ py: '14px !important', px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    {/* Rank */}
                    <Box sx={{
                      minWidth: 40, height: 40, borderRadius: '50%',
                      bgcolor: medal || 'action.selected',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Typography fontWeight={800} fontSize={medal ? '1rem' : '0.85rem'} color={medal ? '#000' : 'text.secondary'}>
                        #{idx + 1}
                      </Typography>
                    </Box>

                    {/* Content */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                        <Chip icon={cfg.icon} label={notif.Type} color={cfg.color} size="small" sx={{ height: 22, fontSize: '0.72rem' }} />
                        {isNew && <FiberNewIcon color="error" sx={{ fontSize: 18 }} />}
                        <Typography variant="caption" color="text.disabled">{getRelativeTime(notif.Timestamp)}</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={isNew ? 700 : 500} sx={{ mb: 1 }}>
                        {notif.Message}
                      </Typography>

                      {/* Score bar */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title={`Priority Score: ${notif.score.toFixed(4)}`}>
                          <Box sx={{ flex: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={scorePercent}
                              color={cfg.color}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, minWidth: 60 }}>
                          {notif.score.toFixed(4)}
                        </Typography>
                      </Box>

                      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                        {formatTime(notif.Timestamp)}
                      </Typography>
                    </Box>

                    {isNew && (
                      <Box sx={{
                        width: 10, height: 10, borderRadius: '50%',
                        bgcolor: 'error.main', flexShrink: 0, mt: 1,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.3 } }
                      }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            );
          })}

          {priorityList.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">No notifications to rank</Typography>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}
