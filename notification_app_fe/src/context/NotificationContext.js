import React, { createContext, useContext, useState, useCallback } from 'react';

const API_BASE = 'http://4.224.186.213/evaluation-service/notifications';

const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };

function calcPriorityScore(notification) {
  const weight = TYPE_WEIGHT[notification.Type] || 1;
  const timestamp = new Date(notification.Timestamp).getTime();
  const hoursElapsed = (Date.now() - timestamp) / (1000 * 60 * 60);
  const recencyScore = 1 / (1 + hoursElapsed);
  return weight * recencyScore;
}

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewedIds, setViewedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('viewedIds') || '[]')); }
    catch { return new Set(); }
  });

  const markViewed = useCallback((id) => {
    setViewedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem('viewedIds', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const markAllViewed = useCallback((ids) => {
    setViewedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      localStorage.setItem('viewedIds', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const fetchNotifications = useCallback(async ({ page = 1, limit = 20, notification_type = '' } = {}) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit });
      if (notification_type) params.set('notification_type', notification_type);
      const token = process.env.REACT_APP_API_TOKEN || '';
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(`${API_BASE}?${params}`, { headers });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const list = data.notifications || [];
      setNotifications(list);
      return list;
    } catch (err) {
      setError(err.message);
      // fallback sample data
      const sample = [
        { ID: 'a1b2c3d4-0000-4abc-8000-111111111111', Type: 'Placement', Message: 'Google hiring — SWE Intern',        Timestamp: '2026-06-11 10:00:00' },
        { ID: 'b283218f-easa-4b7c-03a0-1f2f240d64b0', Type: 'Placement', Message: 'CSX Corporation hiring',            Timestamp: '2026-04-22 17:51:18' },
        { ID: '8a7412bd-6065-4de0-8501-a37f11cc848b', Type: 'Placement', Message: 'Advanced Micro Devices hiring',     Timestamp: '2026-04-22 17:49:42' },
        { ID: 'd146095a-0086-4334-0e60-3000a14576bc', Type: 'Result',    Message: 'Mid-Sem results published',         Timestamp: '2026-06-11 10:00:00' },
        { ID: 'a1b2c3d4-0000-4abc-8000-333333333333', Type: 'Result',    Message: 'Final Exam Results Published',      Timestamp: '2026-06-09 14:00:00' },
        { ID: 'ea836726-c25e-4f21-a72f-544a6af8a37e', Type: 'Result',    Message: 'Project review grades out',         Timestamp: '2026-04-22 17:50:42' },
        { ID: '883cba27-8fc6-47f7-bbe0-be228f6bed2c', Type: 'Result',    Message: 'External exam results',             Timestamp: '2026-04-22 17:50:30' },
        { ID: 'e5c4ff20-31bf-4d48-8fe2-72fda89e5918', Type: 'Result',    Message: 'Project review — section B',        Timestamp: '2026-04-22 17:50:18' },
        { ID: '81589ada-0ad3-4f77-0554-f52fb558209d', Type: 'Event',     Message: 'Farewell ceremony — Main Hall',     Timestamp: '2026-06-10 09:00:00' },
        { ID: '1cfc65ee-ad37-4894-8046-4707627176a5', Type: 'Event',     Message: 'TechFest 2026 registration open',   Timestamp: '2026-04-22 17:50:06' },
        { ID: 'a1b2c3d4-0000-4abc-8000-222222222222', Type: 'Event',     Message: 'Annual Tech Symposium',             Timestamp: '2026-06-10 09:00:00' },
        { ID: 'cf288536-45ac-4b4a-b548-62029d4c52ce', Type: 'Result',    Message: 'Project review — section A',        Timestamp: '2026-04-22 17:49:54' },
        { ID: '0005513a-142b-4bbc-8678-eefecf5e1ede', Type: 'Result',    Message: 'Mid-sem resit results',             Timestamp: '2026-04-22 17:50:54' },
      ];
      setNotifications(sample);
      return sample;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTopN = useCallback((list, n = 10) => {
    return [...list]
      .map(n => ({ ...n, score: calcPriorityScore(n) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, loading, error, viewedIds, markViewed, markAllViewed, fetchNotifications, getTopN }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
