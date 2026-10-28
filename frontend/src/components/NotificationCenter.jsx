import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Package,
  Info,
  X,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function getNotificationVisual(type) {
  const norm = (type || '').toUpperCase();
  switch (norm) {
    case 'LOW_STOCK':
      return {
        icon: AlertTriangle,
        bg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800',
        badge: 'Low Stock'
      };
    case 'RETAILER_REVIEW':
      return {
        icon: ShieldCheck,
        bg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800',
        badge: 'License Review'
      };
    case 'LICENSE_EXPIRY':
      return {
        icon: Clock,
        bg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800',
        badge: 'Excise License'
      };
    case 'ORDER_UPDATE':
    case 'ORDER':
      return {
        icon: Package,
        bg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800',
        badge: 'Order'
      };
    default:
      return {
        icon: Info,
        bg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800',
        badge: 'Notice'
      };
  }
}

export default function NotificationCenter() {
  const { isAuthenticated, role, user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState('all'); // 'all' or 'unread'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await api.getUnreadNotificationCount();
      setUnreadCount(res?.unread_count || 0);
    } catch (err) {
      // silent fallback
    }
  }, [isAuthenticated, user?.id]);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.getNotifications({ unread_only: tab === 'unread', limit: 25 });
      setNotifications(res?.items || []);
      setUnreadCount(res?.unread_count ?? 0);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, tab]);

  // Refetch on mount, on user switch, and on interval / event triggers
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);

    const onRefresh = () => {
      fetchUnreadCount();
      if (isOpen) {
        loadNotifications();
      }
    };
    const onFocus = () => fetchUnreadCount();

    window.addEventListener('alco_notification_refresh', onRefresh);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('alco_notification_refresh', onRefresh);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchUnreadCount, isOpen, loadNotifications, user?.id]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const handleNotificationClick = async (item) => {
    if (!item.is_read) {
      await handleMarkAsRead(item.id);
    }
    setIsOpen(false);
    const norm = (item.notification_type || '').toUpperCase();
    if (norm === 'ORDER_UPDATE' || norm === 'ORDER') {
      if (role === 'retailer') {
        navigate('/retailer/orders');
      } else {
        navigate('/orders');
      }
    } else if (norm === 'LOW_STOCK') {
      navigate('/retailer/inventory');
    } else if (norm === 'LICENSE_EXPIRY' || norm === 'RETAILER_REVIEW') {
      navigate('/retailer');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notification center"
        aria-expanded={isOpen}
        title="Notifications"
        className="relative p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition flex items-center justify-center cursor-pointer group"
      >
        <Bell className="w-4 h-4 text-stone-700 dark:text-stone-300 group-hover:scale-105 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-600 to-rose-600 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[85vh] bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/70 dark:bg-stone-900/90">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-stone-900 dark:text-stone-100">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-amber-800 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1 transition"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-2.5 pb-2 flex gap-2 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                tab === 'all'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => setTab('unread')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                tab === 'unread'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-600" />
              )}
            </button>
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto flex-1 divide-y divide-stone-100 dark:divide-stone-800 max-h-[360px]">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-stone-200 dark:bg-stone-800 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-stone-200 dark:bg-stone-800 rounded w-3/4" />
                      <div className="h-2.5 bg-stone-200 dark:bg-stone-800 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto text-stone-400">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                  {tab === 'unread' ? 'All caught up!' : 'No notifications'}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {tab === 'unread'
                    ? 'You have read all updates and alerts.'
                    : 'System alerts and inventory notices will appear here.'}
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const visual = getNotificationVisual(item.notification_type);
                const Icon = visual.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      !item.is_read
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${visual.bg}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-500 shrink-0">
                            {visual.badge}
                          </span>
                          {!item.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500 shrink-0">
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 mt-0.5 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>

                      {!item.is_read && (
                        <div className="mt-2 flex items-center justify-end">
                          <button
                            onClick={(e) => handleMarkAsRead(item.id, e)}
                            className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark read</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
