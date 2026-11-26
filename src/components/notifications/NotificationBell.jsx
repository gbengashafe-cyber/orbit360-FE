import { notificationService } from '@/api/notification.service';
import { useNotificationCenter } from '@/context/NotificationCenterContext';
import { notificationDestination } from '@/notifications/destination';
import { useGlobalContext } from '@/state/context';
import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';

const dateText = (value) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }).format(new Date(value));

export default function NotificationBell() {
  const { unread, refreshUnread } = useNotificationCenter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [state, setState] = useState('idle');
  const root = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useGlobalContext();

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setState('loading');
    notificationService.getFeed({ rows: '6', sort: 'desc', status: 'all' })
      .then((response) => { if (active) { setItems(response?.data ?? []); setState('ready'); } })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, []);

  const openItem = async (item) => {
    if (!item.isRead) {
      try { await notificationService.markRead(item.id); await refreshUnread(); } catch { /* keep navigation available */ }
    }
    setOpen(false);
    navigate(notificationDestination(item, currentUser?.permissions));
  };

  const markAll = async () => {
    await notificationService.markAllRead();
    await refreshUnread();
    setItems((rows) => rows.map((item) => ({ ...item, isRead: true })));
  };

  return <div className="relative" ref={root}>
    <button type="button" onClick={() => setOpen((value) => !value)} aria-label={`Notifications, ${unread.total} unread`} aria-expanded={open} className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
      <Bell className="h-5 w-5" />
      {unread.total > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs font-bold leading-5 text-white">{unread.total > 99 ? '99+' : unread.total}</span>}
    </button>
    {open && <div className="absolute right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-white shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3"><div><h2 className="font-semibold">Notifications</h2><p className="text-xs text-slate-500">{unread.total} unread</p></div><button className="text-xs text-blue-700 disabled:text-slate-400" onClick={markAll} disabled={!unread.total}><CheckCheck className="mr-1 inline h-4 w-4" />Mark all read</button></div>
      <div className="max-h-[65vh] overflow-y-auto">
        {state === 'loading' && <p className="p-6 text-center text-sm text-slate-500">Loading notifications…</p>}
        {state === 'error' && <p className="p-6 text-center text-sm text-red-700">Could not load notifications. Close and retry.</p>}
        {state === 'ready' && !items.length && <p className="p-8 text-center text-sm text-slate-500">You’re all caught up.</p>}
        {state === 'ready' && items.map((item) => <button key={item.id} onClick={() => openItem(item)} className={`block w-full border-b px-4 py-3 text-left hover:bg-slate-50 ${!item.isRead ? 'bg-blue-50/70' : ''}`}><div className="flex items-start gap-2"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.isRead ? 'bg-transparent' : 'bg-blue-600'}`} /><div className="min-w-0"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 line-clamp-2 text-sm text-slate-700">{item.message}</p><p className="mt-2 text-xs text-slate-500">{item.category.replaceAll('_', ' ')} · {dateText(item.createdAt)}</p></div></div></button>)}
      </div>
      <Link to="/notifications" onClick={() => setOpen(false)} className="block px-4 py-3 text-center text-sm font-medium text-blue-700 hover:bg-blue-50">View all</Link>
    </div>}
  </div>;
}
