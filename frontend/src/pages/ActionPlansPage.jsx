import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { CheckSquare, Calendar, User, Plus, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
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
  const [updateError, setUpdateError] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState('');
  const [associations, setAssociations] = useState([]);
  const [domains, setDomains] = useState([]);
  const [users, setUsers] = useState([]);
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm();

  const fetchPlans = (status = '') => {
    api.get('/action-plans', { params: { status, limit: 100 } }).then(r => {
      setPlans(r.data.data);
      setMeta(r.data.meta);
    });
  };

  useEffect(() => {
    fetchPlans();
    api.get('/associations', { params: { limit: 100 } }).then(r => setAssociations(r.data.data));
    api.get('/domains').then(r => setDomains(r.data.data));
    api.get('/users', { params: { limit: 100 } }).then(r => setUsers(r.data.data)).catch(() => {});
  }, []);

  const handleStatusFilter = (s) => {
    setFilterStatus(s);
    fetchPlans(s);
  };

  const onCreatePlan = async (data) => {
    setCreateError('');
    try {
      const payload = {
        ...data,
        dueDate: data.dueDate || null,
        domainId: data.domainId || null,
        assignedToId: data.assignedToId || null,
      };
      await api.post('/action-plans', payload);
      reset();
      setShowCreateModal(false);
      fetchPlans(filterStatus);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create action plan.');
    }
  };

  const submitUpdate = async (newStatus) => {
    if (!updateNote.trim()) {
      setUpdateError('Please enter an update note.');
      return;
    }
    setUpdateError('');
    setUpdating(true);
    try {
      await api.post(`/action-plans/${selected.id}/updates`, {
        updateNote,
        status: newStatus,
        progressPercent: newStatus === 'completed' ? 100 : undefined,
      });
      setUpdateNote('');
      setSelected(null);
      fetchPlans(filterStatus);
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to save update.');
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
        <button className="btn-primary flex items-center gap-2" onClick={() => { setShowCreateModal(true); setCreateError(''); }}>
          <Plus size={16} /> New Plan
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => handleStatusFilter('')} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', !filterStatus ? 'bg-growth-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => handleStatusFilter(s)} className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors', filterStatus === s ? 'bg-growth-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
            {s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Plans list */}
      <div className="space-y-3">
        {plans.map(p => (
          <div key={p.id} className="card p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelected(p); setUpdateNote(''); setUpdateError(''); }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={clsx('text-xs font-semibold uppercase', PRIORITY_COLORS[p.priority])}>{p.priority}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500">{p.domain?.title || 'No domain'}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-500">{p.association?.name}</span>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">New Action Plan</h2>
              <button onClick={() => { setShowCreateModal(false); reset(); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 mb-4">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" /> {createError}
                </div>
              )}
              <form onSubmit={handleSubmit(onCreatePlan)} className="space-y-4">
                <div>
                  <label className="label">Title *</label>
                  <input className="input" placeholder="e.g. Increase women in leadership roles" {...register('title', { required: true })} />
                  {errors.title && <p className="text-red-500 text-xs mt-1">Required</p>}
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="input" rows={2} placeholder="Describe the action plan..." {...register('description')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Association *</label>
                    <select className="input" {...register('associationId', { required: true })}>
                      <option value="">Select...</option>
                      {associations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    {errors.associationId && <p className="text-red-500 text-xs mt-1">Required</p>}
                  </div>
                  <div>
                    <label className="label">Domain</label>
                    <select className="input" {...register('domainId')}>
                      <option value="">None</option>
                      {domains.map(d => <option key={d.id} value={d.id}>{d.code} – {d.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Priority</label>
                    <select className="input" {...register('priority')}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Due Date</label>
                    <input type="date" className="input" {...register('dueDate')} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Assign To</label>
                    <select className="input" {...register('assignedToId')}>
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" className="btn-secondary" onClick={() => { setShowCreateModal(false); reset(); }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Action Plan Detail</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className={clsx('text-xs font-semibold uppercase mb-1', PRIORITY_COLORS[selected.priority])}>{selected.priority} priority</p>
                <h3 className="text-lg font-bold text-gray-900">{selected.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs mb-1">Association</p><p className="font-medium">{selected.association?.name || '—'}</p></div>
                <div><p className="text-gray-400 text-xs mb-1">Domain</p><p className="font-medium">{selected.domain?.title || '—'}</p></div>
                <div><p className="text-gray-400 text-xs mb-1">Status</p><StatusBadge status={selected.status} /></div>
                <div><p className="text-gray-400 text-xs mb-1">Assigned To</p><p className="font-medium">{selected.assignedTo ? `${selected.assignedTo.firstName} ${selected.assignedTo.lastName}` : '—'}</p></div>
                <div><p className="text-gray-400 text-xs mb-1">Due Date</p><p className="font-medium">{selected.dueDate ? format(new Date(selected.dueDate), 'MMM d, yyyy') : '—'}</p></div>
              </div>

              {selected.updates?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Progress Updates</p>
                  <div className="space-y-2">
                    {selected.updates.map(u => (
                      <div key={u.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <p className="text-gray-700">{u.updateNote}</p>
                        <p className="text-xs text-gray-400 mt-1">{format(new Date(u.updatedAt), 'MMM d, yyyy HH:mm')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-100 pt-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Add Progress Update</p>
                {updateError && (
                  <div className="text-red-600 text-xs flex items-center gap-1">
                    <AlertCircle size={12} /> {updateError}
                  </div>
                )}
                <textarea
                  className="input"
                  rows={3}
                  value={updateNote}
                  onChange={e => setUpdateNote(e.target.value)}
                  placeholder="Describe progress made..."
                />
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
                    onClick={() => submitUpdate('in_progress')}
                    disabled={updating}
                  >
                    Mark In Progress
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg bg-growth-600 text-white text-xs font-medium hover:bg-growth-700 transition-colors"
                    onClick={() => submitUpdate('completed')}
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Mark Complete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
