import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { Plus, Calendar, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

export default function AssessmentRoundsPage() {
  const [rounds, setRounds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm();

  const fetchRounds = () => api.get('/assessment-rounds').then(r => setRounds(r.data.data));
  useEffect(() => { fetchRounds(); }, []);

  const onSubmit = async (data) => {
    setFormError('');
    try {
      await api.post('/assessment-rounds', data);
      reset();
      setShowForm(false);
      fetchRounds();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to create round. Please try again.');
    }
  };

  const activateRound = async (id) => {
    setActionError('');
    try {
      await api.post(`/assessment-rounds/${id}/activate`);
      fetchRounds();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to activate round.');
    }
  };

  const closeRound = async (id) => {
    setActionError('');
    try {
      await api.post(`/assessment-rounds/${id}/close`);
      fetchRounds();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to close round.');
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assessment Rounds</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setShowForm(true); setFormError(''); }}>
          <Plus size={16} /> New Round
        </button>
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" /> {actionError}
        </div>
      )}

      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Create Assessment Round</h2>

          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 mb-4">
              <AlertCircle size={15} className="shrink-0 mt-0.5" /> {formError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Round Title *</label>
              <input className="input" placeholder="e.g. Q1 2026 Assessment" {...register('title', { required: true })} />
              {errors.title && <p className="text-red-500 text-xs mt-1">Title is required</p>}
            </div>
            <div>
              <label className="label">Start Date *</label>
              <input type="date" className="input" {...register('startDate', { required: true })} />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">Start date is required</p>}
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="date" className="input" {...register('endDate', { required: true })} />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">End date is required</p>}
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} {...register('description')} placeholder="Optional description..." />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); reset(); setFormError(''); }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Round'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {rounds.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            No assessment rounds yet
          </div>
        )}
        {rounds.map(r => (
          <div key={r.id} className="card p-5 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-growth-50 rounded-lg flex items-center justify-center shrink-0">
                <Calendar size={18} className="text-growth-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{r.title}</p>
                {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                <p className="text-sm text-gray-500 mt-0.5">
                  {format(new Date(r.startDate), 'MMM d, yyyy')} – {format(new Date(r.endDate), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{r._count?.assessments ?? 0} assessments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={r.status} />
              {r.status === 'draft' && (
                <button className="btn-primary text-xs" onClick={() => activateRound(r.id)}>Activate</button>
              )}
              {r.status === 'active' && (
                <button className="btn-secondary text-xs" onClick={() => closeRound(r.id)}>Close Round</button>
              )}
              <Link to={`/assessments?roundId=${r.id}`} className="text-sm text-growth-600 hover:underline font-medium">
                View Assessments
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
