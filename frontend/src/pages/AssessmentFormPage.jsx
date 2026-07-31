import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../lib/api.js';
import { ChevronLeft, ChevronRight, Save, Send, Upload } from 'lucide-react';
import clsx from 'clsx';

export default function AssessmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [domains, setDomains] = useState([]);
  const [responses, setResponses] = useState({});
  const [activeDomainIdx, setActiveDomainIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/assessments/${id}`),
      api.get('/domains'),
    ]).then(([a, d]) => {
      setAssessment(a.data.data);
      setDomains(d.data.data);
      // Pre-populate responses
      const map = {};
      for (const r of a.data.data.responses || []) {
        map[r.questionId] = r;
      }
      setResponses(map);
    });
  }, [id]);

  const activeDomain = domains[activeDomainIdx];

  const handleResponse = useCallback(async (question, indicator, value) => {
    const payload = {
      assessmentId: id,
      domainId: indicator.domainId,
      indicatorId: indicator.id,
      questionId: question.id,
      ...(question.inputType === 'number' || question.inputType === 'rating_scale'
        ? { responseValueNumber: parseFloat(value) }
        : { responseValueText: String(value) }),
    };

    setResponses(prev => ({ ...prev, [question.id]: { ...prev[question.id], ...payload } }));

    setSaving(true);
    try {
      await api.post('/responses', payload);
    } finally {
      setSaving(false);
    }
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/assessments/${id}/submit`);
      navigate('/assessments');
    } finally {
      setSubmitting(false);
    }
  };

  const completionByDomain = domains.map(domain => {
    const questions = domain.indicators?.flatMap(i => i.questions) || [];
    const answered = questions.filter(q => responses[q.id]).length;
    return { total: questions.length, answered };
  });

  const totalQuestions = completionByDomain.reduce((s, d) => s + d.total, 0);
  const totalAnswered = completionByDomain.reduce((s, d) => s + d.answered, 0);
  const overallPct = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  if (!assessment || !domains.length) {
    return <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-64" /></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Domain sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Overall Progress</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${overallPct}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-700">{overallPct}%</span>
          </div>
        </div>
        <nav className="p-2 space-y-1 flex-1">
          {domains.map((d, i) => {
            const { total, answered } = completionByDomain[i];
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            return (
              <button
                key={d.id}
                onClick={() => setActiveDomainIdx(i)}
                className={clsx(
                  'w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors',
                  activeDomainIdx === i ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{d.code}</span>
                  <span className={clsx('text-xs', pct === 100 ? 'text-green-600' : 'text-gray-400')}>{pct}%</span>
                </div>
                <p className="leading-tight opacity-80 line-clamp-2">{d.title}</p>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main form area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-3xl mx-auto space-y-6">
          {/* Domain header */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{activeDomain?.code}</p>
            <h2 className="text-xl font-bold text-gray-900">{activeDomain?.title}</h2>
            {activeDomain?.description && <p className="text-gray-500 text-sm mt-1">{activeDomain.description}</p>}
          </div>

          {/* Indicators & Questions */}
          {activeDomain?.indicators?.map(indicator => (
            <div key={indicator.id} className="card p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">{indicator.title}</h3>
                {indicator.description && <p className="text-sm text-gray-500 mt-0.5">{indicator.description}</p>}
                <span className="text-xs text-gray-400">Weight: {indicator.weight}</span>
              </div>

              {indicator.questions?.map(q => (
                <QuestionField
                  key={q.id}
                  question={q}
                  indicator={indicator}
                  value={responses[q.id]?.responseValueText ?? responses[q.id]?.responseValueNumber ?? ''}
                  onChange={(val) => handleResponse(q, indicator, val)}
                />
              ))}
            </div>
          ))}

          {/* Navigation */}
          <div className="flex items-center justify-between pb-6">
            <button
              className="btn-secondary"
              disabled={activeDomainIdx === 0}
              onClick={() => setActiveDomainIdx(i => i - 1)}
            >
              <ChevronLeft size={16} /> Previous
            </button>

            <div className="flex items-center gap-3">
              {saving && <span className="text-xs text-gray-400">Saving...</span>}
              {activeDomainIdx < domains.length - 1 ? (
                <button className="btn-primary" onClick={() => setActiveDomainIdx(i => i + 1)}>
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                  <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionField({ question, indicator, value, onChange }) {
  const options = question.responseOptionsJson || [];

  return (
    <div className="space-y-1.5">
      <label className="text-sm text-gray-700">
        {question.questionText}
        {question.isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.helpText && <p className="text-xs text-gray-400">{question.helpText}</p>}

      {(question.inputType === 'yes_no' || question.inputType === 'radio') && (
        <div className="flex gap-3 flex-wrap">
          {(question.inputType === 'yes_no' ? ['Yes', 'Partly', 'No'] : options).map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="radio"
                name={question.id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="text-primary-600"
              />
              {opt}
            </label>
          ))}
        </div>
      )}

      {question.inputType === 'select' && (
        <select className="input max-w-xs" value={value} onChange={e => onChange(e.target.value)}>
          <option value="">Select...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}

      {question.inputType === 'number' && (
        <input type="number" className="input max-w-xs" value={value} onChange={e => onChange(e.target.value)} />
      )}

      {question.inputType === 'rating_scale' && (
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={clsx(
                'w-10 h-10 rounded-lg border text-sm font-medium transition-colors',
                value === n ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 text-gray-600 hover:border-primary-400'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {(question.inputType === 'text' || question.inputType === 'textarea') && (
        question.inputType === 'textarea'
          ? <textarea className="input" rows={3} value={value} onChange={e => onChange(e.target.value)} />
          : <input className="input max-w-sm" value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}
