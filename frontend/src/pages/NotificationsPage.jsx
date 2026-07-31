import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { Bell, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetchNotifications = () => {
    api.get('/notifications').then(r => {
      setNotifications(r.data.data);
      setUnread(r.data.unreadCount);
    });
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    fetchNotifications();
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    fetchNotifications();
  };

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread > 0 && <p className="text-sm text-gray-500 mt-1">{unread} unread</p>}
        </div>
        {unread > 0 && (
          <button className="btn-secondary text-sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bell size={32} className="mx-auto mb-2 opacity-30" />
            No notifications
          </div>
        ) : notifications.map(n => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={clsx(
              'card p-4 cursor-pointer transition-colors',
              !n.isRead ? 'border-primary-200 bg-primary-50/30' : 'hover:bg-gray-50'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className={clsx('text-sm font-medium', !n.isRead ? 'text-gray-900' : 'text-gray-700')}>{n.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.isRead && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
                <span className="text-xs text-gray-400">{format(new Date(n.createdAt), 'MMM d')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
