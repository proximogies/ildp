import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../lib/api.js';
import { Plus, FileText } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import { useForm } from 'react-hook-form';

export default function AssessmentsPage() {
  const [searchParams] = useSearchParams();
  const [assessments, setAssessments] = useState([]);
  const [meta, setMeta] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [associations, setAssociations] = useState([]);
  const [rounds, setRounds] = useState([]);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchAssessments = () => {
    const params = { limit: 50 };
    if (searchParams.get('associationId')) params.associationId = searchParams.get('associationId');
    if (searchParams.get('roundId')) params.roundId = searchParams.get('roundId');
    api.get('/assessments', { params }).then(r => { setAssessments(r.data.data); setMeta(r.data.meta); });
  };

  useEffect(() => {
    fetchAssessments();
    api.get('/associations', { params: { limit: 100 } }).then(r => setAssociations(r.data.data));
    api.get('/assessment-rounds').then(r => setRounds(r.data.data));
  }, []);

  const onSubmit = async (data) => {
    await api.post('/assessments', data);
    reset();
    setShowForm(false);
    fetchAssessments();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-500 text-sm mt-1">{meta.total ?? 0} total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> New Assessment</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Create Assessment</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Association *</label>
              <select className="input" {...register('associationId', { required: true })}>
                <option value="">Select association...</option>
                {associations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assessment Round *</label>
              <select className="input" {...register('assessmentRoundId', { required: true })}>
                <option value="">Select round...</option>
                {rounds.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Assessment Type</label>
              <select className="input" {...register('assessmentType')}>
                <option value="self_assessment">Self Assessment</option>
                <option value="facilitator_led">Facilitator Led</option>
                <option value="validated">Validated</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>Create</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Association', 'Round', 'Type', 'Status', 'Score', 'Band', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assessments.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                No assessments found
              </td></tr>
            ) : assessments.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.association?.name}</td>
                <td className="px-4 py-3 text-gray-500">{a.assessmentRound?.title}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{a.assessmentType?.replace('_', ' ')}</td>
                <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-3 font-semibold">{a.overallScore?.toFixed(2) ?? '—'}</td>
                <td className="px-4 py-3">{a.scoreBand?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {['draft', 'in_progress', 'correction_requested'].includes(a.status) && (
                      <Link to={`/assessments/${a.id}/form`} className="text-primary-600 hover:underline text-xs">Fill Form</Link>
                    )}
                    {['submitted', 'under_review'].includes(a.status) && (
                      <Link to={`/assessments/${a.id}/review`} className="text-amber-600 hover:underline text-xs">Review</Link>
                    )}
                    {a.status === 'approved' && (
                      <Link to={`/assessments/${a.id}/scorecard`} className="text-green-600 hover:underline text-xs">Scorecard</Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
