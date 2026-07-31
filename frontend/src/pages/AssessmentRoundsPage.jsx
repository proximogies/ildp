import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { Plus, Calendar } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

export default function AssessmentRoundsPage() {
  const [rounds, setRounds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchRounds = () => api.get('/assessment-rounds').then(r => setRounds(r.data.data));
  useEffect(() => { fetchRounds(); }, []);

  const onSubmit = async (data) => {
    await api.post('/assessment-rounds', data);
    reset();
    setShowForm(false);
    fetchRounds();
  };

  const closeRound = async (id) => {
    await api.post(`/assessment-rounds/${id}/close`);
    fetchRounds();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Assessment Rounds</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Round</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Create Assessment Round</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Round Title *</label>
              <input className="input" {...register('title', { required: true })} placeholder="e.g. Q1 2025 Assessment" />
            </div>
            <div>
              <label className="label">Start Date *</label>
              <input type="date" className="input" {...register('startDate', { required: true })} />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="date" className="input" {...register('endDate', { required: true })} />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} {...register('description')} />
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>Create Round</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {rounds.map(r => (
          <div key={r.id} className="card p-5 flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                <Calendar size={18} className="text-primary-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{r.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {format(new Date(r.startDate), 'MMM d, yyyy')} – {format(new Date(r.endDate), 'MMM d, yyyy')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{r._count?.assessments ?? 0} assessments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={r.status} />
              {r.status === 'active' && (
                <button className="btn-secondary text-xs" onClick={() => closeRound(r.id)}>Close Round</button>
              )}
              <Link to={`/assessments?roundId=${r.id}`} className="text-sm text-primary-600 hover:underline">View Assessments</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
