import { notificationService } from '@/api/notification.service';
import { useNotificationCenter } from '@/context/NotificationCenterContext';
import { CheckCheck, ChevronDown, Settings2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

const CATEGORY_LABELS = { LEAVE: 'Leave', LOAN: 'Loans', TRAINING: 'Training', RELIEVER: 'Reliever', COMPLAINT: 'Complaints', GENERAL: 'General', EXIT: 'Exit Management' };
const displayDate = (value) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Lagos' }).format(new Date(value));

export default function NotificationCenter() {
  const { unread, refreshUnread } = useNotificationCenter();
  const [preferences, setPreferences] = useState([]);
  const [category, setCategory] = useState('');
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const fetchPage = useCallback(async ({ next = false } = {}) => {
    next ? setLoadingMore(true) : setLoading(true);
    setError('');
    try {
      const response = await notificationService.getFeed({ rows: '20', sort: 'desc', status, category: category || undefined, cursor: next ? cursor || undefined : undefined });
      const page = response?.data ?? [];
      setItems((existing) => next ? [...existing, ...page] : page);
      setCursor(response?.pagination?.nextCursor ?? null);
      setHasMore(Boolean(response?.pagination?.hasMore));
    } catch {
      setError('Notifications could not be loaded. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [category, cursor, status]);

  useEffect(() => {
    notificationService.getPreferences().then((response) => setPreferences(response?.data ?? [])).catch(() => {});
  }, []);
  useEffect(() => { setCursor(null); fetchPage(); }, [category, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const availableCategories = useMemo(() => preferences.map(({ category: item }) => item), [preferences]);
  const markRead = async (item) => {
    if (item.isRead) return;
    try {
      await notificationService.markRead(item.id);
      setItems((rows) => rows.map((row) => row.id === item.id ? { ...row, isRead: true } : row));
      await refreshUnread();
    } catch { setError('Could not update the read state. Please retry.'); }
  };
  const markAll = async () => {
    try {
      await notificationService.markAllRead(category || undefined);
      setItems((rows) => rows.map((row) => ({ ...row, isRead: true })));
      await refreshUnread();
    } catch { setError('Could not mark notifications as read. Please retry.'); }
  };
  return <section className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-900">Notifications</h1><p className="mt-1 text-sm text-slate-600">{unread.total} unread notifications</p></div><div className="flex gap-2"><Link to="/notifications/preferences" className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"><Settings2 className="h-4 w-4" /> Preferences</Link><button onClick={markAll} disabled={!unread.total} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50"><CheckCheck className="h-4 w-4" />Mark all read</button></div></header>
    <div className="flex flex-wrap gap-3"><label className="flex items-center gap-2 rounded-lg border bg-white px-3"><span className="text-sm text-slate-600">Category</span><select value={category} onChange={(e) => setCategory(e.target.value)} className="bg-transparent py-2 text-sm outline-none"><option value="">All categories</option>{availableCategories.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value] ?? value}</option>)}</select><ChevronDown className="h-4 w-4 text-slate-500" /></label><label className="flex items-center gap-2 rounded-lg border bg-white px-3"><span className="text-sm text-slate-600">Show</span><select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-transparent py-2 text-sm outline-none"><option value="all">All</option><option value="unread">Unread</option><option value="read">Read</option></select></label></div>
    {error && <div role="alert" className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}<button className="underline" onClick={() => fetchPage()}>Retry</button></div>}
    <div className="overflow-hidden rounded-xl border bg-white">
      {loading ? <p className="p-10 text-center text-sm text-slate-500">Loading notifications…</p> : !items.length ? <div className="p-12 text-center"><h2 className="font-semibold text-slate-800">You’re all caught up</h2><p className="mt-1 text-sm text-slate-500">New notifications will appear here.</p></div> : items.map((item) => <article key={item.id} className={`border-b p-4 last:border-b-0 sm:p-5 ${item.isRead ? '' : 'bg-blue-50/60'}`}><div className="flex items-start gap-3"><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.isRead ? 'bg-slate-300' : 'bg-blue-600'}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{item.title}</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{CATEGORY_LABELS[item.category] ?? item.category}</span></div><p className="mt-1 text-sm leading-6 text-slate-700">{item.message}</p><time className="mt-2 block text-xs text-slate-500">{displayDate(item.createdAt)}</time></div>{!item.isRead && <button onClick={() => markRead(item)} className="shrink-0 text-xs font-medium text-blue-700 hover:underline">Mark read</button>}</div></article>)}
    </div>
    {hasMore && <div className="text-center"><button disabled={loadingMore} onClick={() => fetchPage({ next: true })} className="rounded-lg border bg-white px-5 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50">{loadingMore ? 'Loading…' : 'Load more'}</button></div>}
    <p className="text-xs text-slate-500">Real-time alerts are delivered while this application is open and polling. They are separate from Notification Center history.</p>
  </section>;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState({});
  const load = () => { setLoading(true); setError(''); notificationService.getPreferences().then((response) => setPreferences(response?.data ?? [])).catch(() => setError('Preferences could not be loaded.')).finally(() => setLoading(false)); };
  useEffect(load, []);
  const update = async (item, field, checked) => {
    const key = `${item.category}:${field}`;
    setSaving((values) => ({ ...values, [key]: true })); setError('');
    try { const response = await notificationService.updatePreference(item.category, { [field]: checked }); if (response?.data) setPreferences((rows) => rows.map((row) => row.category === item.category ? response.data : row)); }
    catch { setError('The preference was not saved. Your previous setting is still active. Please retry.'); }
    finally { setSaving((values) => ({ ...values, [key]: false })); }
  };
  return <section className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8"><header><Link to="/notifications" className="text-sm text-blue-700 hover:underline">← Notifications</Link><h1 className="mt-3 text-2xl font-bold">Notification Preferences</h1><p className="mt-1 text-sm text-slate-600">Manage in-app history and real-time alerts independently for each available category.</p></header>{error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error} <button className="underline" onClick={load}>Retry</button></div>}{loading ? <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Loading preferences…</p> : !preferences.length ? <p className="rounded-xl border bg-white p-8 text-center text-slate-600">No notification categories are available for this account.</p> : <div className="overflow-x-auto rounded-xl border bg-white"><table className="w-full min-w-[38rem] text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Category</th><th className="p-4">In-app history</th><th className="p-4">Real-time alerts</th></tr></thead><tbody>{preferences.map((item) => <tr key={item.category} className="border-t"><th className="p-4 font-medium">{CATEGORY_LABELS[item.category] ?? item.category}</th>{['inAppEnabled', 'realtimeEnabled'].map((field) => { const key = `${item.category}:${field}`; return <td className="p-4" key={field}><label className="inline-flex items-center gap-2"><input type="checkbox" checked={item[field]} disabled={Boolean(saving[key])} onChange={(e) => update(item, field, e.target.checked)} className="h-4 w-4 accent-blue-700" /><span className="text-sm">{saving[key] ? 'Saving…' : item[field] ? 'On' : 'Off'}</span><span className="sr-only">{field === 'inAppEnabled' ? 'In-app history' : 'Real-time alerts'} for {CATEGORY_LABELS[item.category] ?? item.category}</span></label></td>; })}</tr>)}</tbody></table></div>}<p className="text-xs text-slate-500">Real-time alerts require the application to remain open and polling; background push alerts are not available.</p></section>;
}
