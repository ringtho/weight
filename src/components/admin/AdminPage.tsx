import React, { useEffect, useMemo, useState } from 'react';
import {
  Users, Shield, ShieldOff, Trash2, RefreshCw,
  Database, Crown, User, Mail, Calendar, Clock, ChevronLeft,
  Search, ArrowUpDown, ArrowUp, ArrowDown, HardDrive, Activity,
  UserX, ChevronDown, ChevronUp,
} from 'lucide-react';
import { adminGetUsers, adminDeleteUser, adminSetRole, adminGetUserStats } from '../../lib/authApi';
import type { AdminUser, AuthUser, UserStats } from '../../lib/authApi';

type Props = {
  currentUser: AuthUser;
  onBack: () => void;
};

type SortCol = 'name' | 'created_at' | 'last_login' | 'last_saved' | 'data_bytes' | 'role';
type SortDir = 'asc' | 'desc';

function formatDate(ts: number | null) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(ts: number | null) {
  if (!ts) return 'Never';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function accountAge(ts: number) {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

function StatCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div className="eyebrow mb-0.5">{label}</div>
        <div className="text-xl font-bold font-mono text-white">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function StatPill({ label, value, color = '#a78bfa' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
    </div>
  );
}

function ExpandedUserDetail({ u, stats }: { u: AdminUser; stats: UserStats | null | undefined }) {
  const wUnit = stats?.unit === 'imperial' ? 'lbs' : 'kg';
  const loading = stats === undefined; // not yet fetched

  return (
    <div className="space-y-4">
      {/* Account info strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">User ID</div>
          <div className="text-slate-300 font-mono">#{u.id}</div>
        </div>
        <div>
          <div className="text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">Account Age</div>
          <div className="text-slate-300">{accountAge(u.created_at)} — since {formatDate(u.created_at)}</div>
        </div>
        <div>
          <div className="text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">Last Login</div>
          <div className="text-slate-300">{u.last_login ? `${formatRelative(u.last_login)} · ${formatDate(u.last_login)}` : 'Never'}</div>
        </div>
        <div>
          <div className="text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">Storage</div>
          <div className="text-slate-300">{u.has_data ? formatBytes(u.data_bytes) : 'No data saved'}</div>
        </div>
      </div>

      {/* Progress section */}
      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
          <RefreshCw size={12} className="animate-spin" /> Loading progress data…
        </div>
      )}

      {!loading && !stats && (
        <div className="text-xs text-slate-600 py-2">No tracking data saved yet.</div>
      )}

      {!loading && stats && (
        <>
          {/* Weight progress */}
          {stats.startWeight && stats.currentWeight && (
            <div className="rounded-xl p-4" style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Weight Progress</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                  {stats.progressPct}% of goal
                </span>
              </div>

              {/* Weight bar: start → current → target */}
              <div className="relative mb-2">
                <div className="h-2 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${stats.progressPct}%`,
                      background: 'linear-gradient(90deg, #7c3aed, #10b981)',
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <span>Start: <span className="text-slate-300 font-mono">{stats.startWeight}{wUnit}</span></span>
                <span>Now: <span className="font-mono font-bold text-violet-300">{stats.currentWeight}{wUnit}</span></span>
                {stats.targetWeight && <span>Goal: <span className="text-emerald-400 font-mono">{stats.targetWeight}{wUnit}</span></span>}
              </div>
            </div>
          )}

          {/* Key stats grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatPill
              label="Lost"
              value={stats.weightLost !== null && stats.weightLost !== 0 ? `${stats.weightLost > 0 ? '-' : '+'}${Math.abs(stats.weightLost)}${wUnit}` : '—'}
              color={stats.weightLost !== null && stats.weightLost > 0 ? '#10b981' : '#f43f5e'}
            />
            <StatPill label="Workouts" value={stats.totalWorkouts} color="#3b82f6" />
            <StatPill label="Weeks Active" value={`${stats.weeksActive}/12`} color="#8b5cf6" />
            <StatPill label="Week" value={`W${stats.currentWeek}`} color="#a78bfa" />
            <StatPill label="Avg Cal" value={stats.avgCalories ? `${stats.avgCalories}` : '—'} color="#f59e0b" />
            <StatPill label="Photos" value={stats.photoCount} color="#ec4899" />
          </div>

          {/* Mini weight trend */}
          {stats.weekWeights.length > 1 && (
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Weight Trend</div>
              <div className="flex items-end gap-1 h-10">
                {(() => {
                  const weights = stats.weekWeights;
                  const min = Math.min(...weights.map(w => w.weight));
                  const max = Math.max(...weights.map(w => w.weight));
                  const range = max - min || 1;
                  return weights.map(({ week, weight }) => {
                    const pct = 1 - (weight - min) / range;
                    const h = Math.round(8 + pct * 28);
                    const isLast = week === weights[weights.length - 1].week;
                    return (
                      <div key={week} className="flex flex-col items-center gap-0.5 flex-1" title={`W${week}: ${weight}${wUnit}`}>
                        <div
                          className="w-full rounded-sm"
                          style={{
                            height: `${h}px`,
                            background: isLast ? '#10b981' : 'rgba(124,58,237,0.5)',
                            minWidth: '4px',
                          }}
                        />
                        <span className="text-slate-700 font-mono" style={{ fontSize: '9px' }}>W{week}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SortIcon({ col, active, dir }: { col: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={11} className="text-slate-600 ml-1" />;
  return dir === 'asc'
    ? <ArrowUp size={11} className="text-violet-400 ml-1" />
    : <ArrowDown size={11} className="text-violet-400 ml-1" />;
}

export default function AdminPage({ currentUser, onBack }: Props) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortCol>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statsCache, setStatsCache] = useState<Record<string, UserStats | null>>({});

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await adminGetUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await adminDeleteUser(id);
      setUsers(u => u.filter(x => x.id !== id));
      setConfirmDelete(null);
      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    setActionLoading(user.id);
    try {
      await adminSetRole(user.id, newRole);
      setUsers(u => u.map(x => x.id === user.id ? { ...x, role: newRole } : x));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Role update failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!(id in statsCache)) {
      const stats = await adminGetUserStats(id);
      setStatsCache(prev => ({ ...prev, [id]: stats }));
    }
  };

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  // Stats
  const totalUsers   = users.length;
  const adminCount   = users.filter(u => u.role === 'admin').length;
  const activeCount  = users.filter(u => u.has_data).length;
  const recentCount  = users.filter(u => u.last_login && Date.now() - u.last_login < 7 * 86400000).length;
  const neverLogged  = users.filter(u => !u.last_login).length;
  const totalDataKB  = Math.round(users.reduce((s, u) => s + (u.data_bytes || 0), 0) / 1024);

  // Filter + sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = q
      ? users.filter(u =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q)
        )
      : [...users];

    list.sort((a, b) => {
      let av: number | string = 0;
      let bv: number | string = 0;
      if (sortCol === 'name')       { av = (a.name || a.username).toLowerCase(); bv = (b.name || b.username).toLowerCase(); }
      if (sortCol === 'created_at') { av = a.created_at; bv = b.created_at; }
      if (sortCol === 'last_login') { av = a.last_login ?? 0; bv = b.last_login ?? 0; }
      if (sortCol === 'last_saved') { av = a.last_saved ?? 0; bv = b.last_saved ?? 0; }
      if (sortCol === 'data_bytes') { av = a.data_bytes; bv = b.data_bytes; }
      if (sortCol === 'role')       { av = a.role; bv = b.role; }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, search, sortCol, sortDir]);

  const SortTh = ({ col, label }: { col: SortCol; label: string }) => (
    <th
      className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-300 transition-colors"
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon col={col} active={sortCol === col} dir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="btn-ghost p-2">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="eyebrow mb-1">Admin</div>
          <h1 className="page-title">User Management</h1>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary text-xs flex items-center gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard icon={<Users size={18} />}    label="Total Users"      value={totalUsers}  color="#7c3aed" />
        <StatCard icon={<Crown size={18} />}    label="Admins"           value={adminCount}  color="#f59e0b" />
        <StatCard icon={<Activity size={18} />} label="Active (7 days)"  value={recentCount} sub={`${totalUsers ? Math.round(recentCount / totalUsers * 100) : 0}% of users`} color="#3b82f6" />
        <StatCard icon={<Database size={18} />} label="Have Data"        value={activeCount} sub={`${totalUsers ? Math.round(activeCount / totalUsers * 100) : 0}% of users`} color="#10b981" />
        <StatCard icon={<UserX size={18} />}    label="Never Logged In"  value={neverLogged} color="#f43f5e" />
        <StatCard icon={<HardDrive size={18} />} label="Total Data Size" value={totalDataKB > 1024 ? `${(totalDataKB / 1024).toFixed(1)} MB` : `${totalDataKB} KB`} color="#8b5cf6" />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185' }}>
          {error}
        </div>
      )}

      {/* Users table */}
      <div className="card overflow-hidden">
        {/* Table header with search */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="section-heading text-base flex-shrink-0">All Users</span>
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-sm text-slate-300 placeholder-slate-600 outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
          <span className="text-xs text-slate-500 flex-shrink-0">
            {filtered.length !== totalUsers ? `${filtered.length} of ${totalUsers}` : `${totalUsers} account${totalUsers !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            {search ? 'No users match your search.' : 'No users found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <SortTh col="name"       label="User" />
                  <SortTh col="role"       label="Role" />
                  <SortTh col="created_at" label="Joined" />
                  <SortTh col="last_login" label="Last Login" />
                  <SortTh col="last_saved" label="Last Saved" />
                  <SortTh col="data_bytes" label="Data Size" />
                  <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => {
                  const isCurrentUser = u.id === currentUser.id;
                  const isDeleting = confirmDelete === u.id;
                  const busy = actionLoading === u.id;
                  const isExpanded = expandedId === u.id;
                  const isRecentlyActive = u.last_login ? Date.now() - u.last_login < 86400000 : false;

                  return (
                    <React.Fragment key={u.id}>
                      <tr
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isCurrentUser ? 'rgba(124,58,237,0.04)' : 'transparent',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleExpand(u.id)}
                      >
                        {/* User */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{
                                background: u.role === 'admin' ? 'rgba(245,158,11,0.2)' : 'rgba(124,58,237,0.2)',
                                color: u.role === 'admin' ? '#f59e0b' : '#a78bfa',
                                border: `1px solid ${u.role === 'admin' ? 'rgba(245,158,11,0.3)' : 'rgba(124,58,237,0.3)'}`,
                              }}
                            >
                              {u.name ? u.name[0].toUpperCase() : u.email ? u.email[0].toUpperCase() : u.username[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-medium flex items-center gap-1.5">
                                {u.name || u.email || u.username}
                                {isCurrentUser && <span className="text-xs text-violet-400">(you)</span>}
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1">
                                <Mail size={10} />
                                {u.email || u.username}
                              </div>
                            </div>
                            <span className="ml-1 text-slate-600">
                              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{
                              background: u.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                              color: u.role === 'admin' ? '#f59e0b' : '#64748b',
                              border: `1px solid ${u.role === 'admin' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            }}
                          >
                            {u.role === 'admin' ? <Crown size={10} /> : <User size={10} />}
                            {u.role}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="text-slate-400 flex items-center gap-1.5">
                            <Calendar size={12} className="text-slate-600" />
                            {formatDate(u.created_at)}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">{accountAge(u.created_at)} old</div>
                        </td>

                        {/* Last login */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className={isRecentlyActive ? 'text-emerald-400' : 'text-slate-500'}>
                            {formatRelative(u.last_login)}
                          </div>
                          {u.last_login && (
                            <div className="text-xs text-slate-600 mt-0.5">{formatDate(u.last_login)}</div>
                          )}
                        </td>

                        {/* Last saved */}
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className={u.last_saved && Date.now() - u.last_saved < 86400000 ? 'text-emerald-400' : 'text-slate-500'}>
                            {formatRelative(u.last_saved)}
                          </div>
                          {u.last_saved && (
                            <div className="text-xs text-slate-600 mt-0.5">{formatDate(u.last_saved)}</div>
                          )}
                        </td>

                        {/* Data size */}
                        <td className="px-5 py-3.5">
                          {u.has_data ? (
                            <div>
                              <div className="text-emerald-400 text-xs flex items-center gap-1">
                                <Database size={11} /> {formatBytes(u.data_bytes)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-600">No data</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                          {isDeleting ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-rose-400">Delete?</span>
                              <button
                                onClick={() => handleDelete(u.id)}
                                disabled={busy}
                                className="text-xs px-2 py-1 rounded-lg font-medium"
                                style={{ background: 'rgba(244,63,94,0.2)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' }}
                              >
                                {busy ? '…' : 'Yes'}
                              </button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-500 hover:text-slate-300">No</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {!isCurrentUser && (
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  disabled={busy}
                                  title={u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                                  style={{ background: 'rgba(255,255,255,0.05)', color: u.role === 'admin' ? '#f59e0b' : '#475569' }}
                                >
                                  {u.role === 'admin' ? <ShieldOff size={13} /> : <Shield size={13} />}
                                </button>
                              )}
                              {!isCurrentUser && (
                                <button
                                  onClick={() => setConfirmDelete(u.id)}
                                  disabled={busy}
                                  title="Delete user"
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-rose-400 transition-colors"
                                  style={{ background: 'rgba(255,255,255,0.05)' }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                              {isCurrentUser && <span className="text-xs text-slate-700">—</span>}
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr style={{ background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <td colSpan={7} className="px-6 py-5">
                            <ExpandedUserDetail u={u} stats={statsCache[u.id]} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-700 mt-4 text-center">
        Deleting a user permanently removes their account and all tracking data. Click any row to expand details.
      </p>
    </div>
  );
}
