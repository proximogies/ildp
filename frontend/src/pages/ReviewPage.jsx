import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { CheckCircle, XCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import { Link } from 'react-router-dom';

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    api.get(`/assessments/${id}`).then(r => setAssessment(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  const act = async (action) => {
    setActing(true);
    try {
      await api.post(`/assessments/${id}/${action}`, { comment });
      navigate('/assessments');
    } finally {
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link to="/assessments" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{assessment.association?.name}</h1>
            <p className="text-gray-500 text-sm">{assessment.assessmentRound?.title}</p>
          </div>
          <StatusBadge status={assessment.status} />
        </div>
      </div>

      {/* Responses by domain */}
      {Object.values(byDomain).map(({ domain, responses }) => (
        <div key={domain?.id} className="card overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 text-sm">{domain?.code} – {domain?.title}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {responses.map(r => (
              <div key={r.id} className="px-5 py-3">
                <p className="text-sm text-gray-600">{r.question?.questionText}</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {r.responseValueText ?? r.responseValueNumber ?? <span className="text-gray-400 italic">No response</span>}
                </p>
                {r.comment && <p className="text-xs text-gray-400 mt-1">Note: {r.comment}</p>}
                {r.evidence?.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {r.evidence.map(e => (
                      <a key={e.id} href={`/uploads/${e.file?.id}`} target="_blank" rel="noreferrer"
                        className="text-xs text-primary-600 hover:underline bg-primary-50 px-2 py-1 rounded">
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
          <textarea className="input" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Add review notes..." />
        </div>
        <div className="flex gap-3">
          <button className="btn-primary" onClick={() => act('approve')} disabled={acting}>
            <CheckCircle size={16} /> Approve
          </button>
          <button className="btn-secondary" onClick={() => act('request-correction')} disabled={acting}>
            <RotateCcw size={16} /> Request Correction
          </button>
          <button className="btn-danger" onClick={() => act('review')} disabled={acting}>
            Mark Under Review
          </button>
        </div>
      </div>
    </div>
  );
}
