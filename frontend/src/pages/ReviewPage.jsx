import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api.js';
import { CheckCircle, RotateCcw, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/assessments/${id}`)
      .then(r => setAssessment(r.data.data))
      .catch(() => setError('Failed to load assessment.'))
      .finally(() => setLoading(false));
  }, [id]);

  const act = async (action) => {
    setError('');
    setActing(true);
    try {
      await api.post(`/assessments/${id}/${action}`, { comment });
      navigate('/assessments');
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${action.replace('-', ' ')} assessment.`);
      setActing(false);
    }
  };

  if (loading) return <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-64" /></div>;
  if (!assessment) return <div className="p-6 text-gray-500">Assessment not found.</div>;

  // Group responses by domain
  const byDomain = {};
  for (const r of assessment.responses || []) {
    const key = r.domain?.id;
    if (!byDomain[key]) byDomain[key] = { domain: r.domain, responses: [] };
    byDomain[key].responses.push(r);
  }

  const apiBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : '';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link to="/assessments" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft size={14} /> Back to Assessments
      </Link>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{assessment.association?.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{assessment.assessmentRound?.title}</p>
            {assessment.submittedBy && (
              <p className="text-xs text-gray-400 mt-1">
                Submitted by {assessment.submittedBy.firstName} {assessment.submittedBy.lastName}
              </p>
            )}
          </div>
          <StatusBadge status={assessment.status} />
        </div>
      </div>

      {/* Responses by domain */}
      {Object.values(byDomain).length === 0 ? (
        <div className="card p-8 text-center text-gray-400">No responses recorded for this assessment.</div>
      ) : Object.values(byDomain).map(({ domain, responses }) => (
        <div key={domain?.id} className="card overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm">{domain?.code} – {domain?.title}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {responses.map(r => (
              <div key={r.id} className="px-5 py-3">
                <p className="text-sm text-gray-500">{r.question?.questionText}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {r.responseValueText ?? (r.responseValueNumber != null ? r.responseValueNumber : (
                    <span className="text-gray-400 italic">No response</span>
                  ))}
                </p>
                {r.comment && <p className="text-xs text-gray-400 mt-1 italic">"{r.comment}"</p>}
                {r.evidence?.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {r.evidence.map(e => (
                      <a
                        key={e.id}
                        href={`${apiBase}/uploads/${e.file?.filePath}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-growth-600 hover:underline bg-growth-50 px-2 py-1 rounded"
                      >
                        📎 {e.file?.fileName}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Reviewer actions */}
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">Reviewer Decision</h3>
        <div>
          <label className="label">Comment (optional)</label>
          <textarea
            className="input"
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add review notes..."
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-growth-600 hover:bg-growth-700 text-white rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
            onClick={() => act('approve')}
            disabled={acting}
          >
            <CheckCircle size={16} /> Approve
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
            onClick={() => act('request-correction')}
            disabled={acting}
          >
            <RotateCcw size={16} /> Request Correction
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-medium text-sm transition-colors disabled:opacity-50"
            onClick={() => act('review')}
            disabled={acting}
          >
            <Clock size={16} /> Mark Under Review
          </button>
        </div>
      </div>
    </div>
  );
}
