import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { CheckSquare, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

const PRIORITY_COLORS = { low: 'text-gray-500', medium: 'text-blue-600', high: 'text-orange-600', critical: 'text-red-600' };
const STATUSES = ['not_started', 'in_progress', 'completed', 'overdue', 'blocked'];

export default function ActionPlansPage() {
  const [plans, setPlans] = useState([]);
  const [meta, setMeta] = useState({});
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState(null);
  const [updateNote, setUpdateNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchPlans = (status = '') => {
    api.get('/action-plans', { params: { status, limit: 100 } }).then(r => {
      setPlans(r.data.data);
      setMeta(r.data.meta);
    });
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleStatusFilter = (s) => {
    setFilterStatus(s);
    fetchPlans(s);
  };

  const submitUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await api.post(`/action-plans/${selected.id}/updates`, { updateNote, status: newStatus, progressPercent: newStatus === 'completed' ? 100 : undefined });
      setUpdateNote('');
      setSelected(null);
      fetchPlans(filterStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Action Plans</h1>
          <p className="text-gray-500 text-sm mt-1">{meta.total ?? 0} total</p>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => handleStatusFilter('')} className={clsx('btn text-xs', !filterStatus ? 'btn-primary' : 'btn-secondary')}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => handleStatusFilter(s)} className={clsx('btn text-xs capitalize', filterStatus === s ? 'btn-primary' : 'btn-secondary')}>
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Plans list */}
      <div className="space-y-3">
        {plans.map(p => (
          <div key={p.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(p)}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={clsx('text-xs font-semibold uppercase', PRIORITY_COLORS[p.priority])}>{p.priority}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500">{p.domain?.title}</span>
                </div>
                <p className="font-medium text-gray-900">{p.title}</p>
                {p.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  {p.assignedTo && (
                    <span className="flex items-center gap-1"><User size={12} />{p.assignedTo.firstName} {p.assignedTo.lastName}</span>
                  )}
                  {p.dueDate && (
                    <span className="flex items-center gap-1"><Calendar size={12} />Due {format(new Date(p.dueDate), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          </div>
        ))}
        {plans.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
            No action plans found
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Action Plan Detail</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className={clsx('text-xs font-semibold uppercase mb-1', PRIORITY_COLORS[selected.priority])}>{selected.priority} priority</p>
                <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Domain</p><p className="font-medium">{selected.domain?.title || '—'}</p></div>
                <div><p className="text-gray-400 text-xs">Status</p><StatusBadge status={selected.status} /></div>
                <div><p className="text-gray-400 text-xs">Assigned To</p><p className="font-medium">{selected.assignedTo ? `${selected.assignedTo.firstName} ${selected.assignedTo.lastName}` : '—'}</p></div>
                <div><p className="text-gray-400 text-xs">Due Date</p><p className="font-medium">{selected.dueDate ? format(new Date(selected.dueDate), 'MMM d, yyyy') : '—'}</p></div>
              </div>

              {/* Updates */}
              {selected.updates?.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Progress Updates</p>
                  <div className="space-y-2">
                    {selected.updates.map(u => (
                      <div key={u.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-700">{u.updateNote}</p>
                        <p className="text-xs text-gray-400 mt-1">{format(new Date(u.updatedAt), 'MMM d, yyyy')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add update */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">Add Progress Update</p>
                <textarea className="input" rows={3} value={updateNote} onChange={e => setUpdateNote(e.target.value)} placeholder="Describe progress..." />
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs" onClick={() => submitUpdate('in_progress')} disabled={updating}>Mark In Progress</button>
                  <button className="btn-primary text-xs" onClick={() => submitUpdate('completed')} disabled={updating}>Mark Complete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
