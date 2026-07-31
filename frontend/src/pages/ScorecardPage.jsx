import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api.js';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const BAND_COLORS = { Weak: 'text-red-600 bg-red-50', Emerging: 'text-orange-600 bg-orange-50', Functional: 'text-yellow-600 bg-yellow-50', Strong: 'text-green-600 bg-green-50' };

export default function ScorecardPage() {
  const { id } = useParams();
  const [scorecard, setScorecard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/scores/scorecard/${id}`).then(r => setScorecard(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-64" /></div>;
  if (!scorecard) return <div className="p-6 text-gray-500">Scorecard not available.</div>;

  const radarData = scorecard.domainScores.map(d => ({
    domain: d.domain?.code,
    score: parseFloat((d.score || 0).toFixed(2)),
    fullMark: 4,
  }));

  const bandStyle = BAND_COLORS[scorecard.scoreBand?.name] || 'text-gray-600 bg-gray-50';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <Link to="/assessments" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={14} /> Back to Assessments
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{scorecard.association?.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{scorecard.round?.title}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-gray-900">{scorecard.overallScore?.toFixed(2) ?? '—'}</p>
            <p className="text-sm text-gray-500">out of 4.0</p>
            {scorecard.scoreBand && (
              <span className={`badge mt-2 ${bandStyle}`}>{scorecard.scoreBand.name}</span>
            )}
          </div>
        </div>
        {scorecard.scoreBand?.interpretationText && (
          <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{scorecard.scoreBand.interpretationText}</p>
        )}
      </div>

      {/* Radar + Domain table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Domain Performance</h2>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
              <Radar dataKey="score" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Domain Scores</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {scorecard.domainScores.map(d => {
              const pct = ((d.score / 4) * 100).toFixed(0);
              const bandColor = d.band ? BAND_COLORS[d.band.name] : 'text-gray-500 bg-gray-50';
              return (
                <div key={d.domain?.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700">{d.domain?.code} – {d.domain?.title}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{d.score?.toFixed(2)}</span>
                      {d.band && <span className={`badge text-xs ${bandColor}`}>{d.band.name}</span>}
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strengths & Gaps */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold text-green-700 flex items-center gap-2 mb-3"><TrendingUp size={16} /> Strengths</h3>
          {scorecard.strengths?.length ? (
            <ul className="space-y-1.5">
              {scorecard.strengths.map(s => <li key={s} className="text-sm text-gray-700 flex items-start gap-2"><span className="text-green-500 mt-0.5">✓</span>{s}</li>)}
            </ul>
          ) : <p className="text-sm text-gray-400">No strong domains yet.</p>}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-red-700 flex items-center gap-2 mb-3"><TrendingDown size={16} /> Priority Gaps</h3>
          {scorecard.gaps?.length ? (
            <ul className="space-y-1.5">
              {scorecard.gaps.map(g => <li key={g} className="text-sm text-gray-700 flex items-start gap-2"><span className="text-red-500 mt-0.5">!</span>{g}</li>)}
            </ul>
          ) : <p className="text-sm text-gray-400">No critical gaps identified.</p>}
        </div>
      </div>

      {scorecard.openActionPlans > 0 && (
        <div className="card p-4 flex items-center justify-between bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800">{scorecard.openActionPlans} open action plan(s) linked to this assessment.</p>
          <Link to="/action-plans" className="text-sm text-amber-700 font-medium hover:underline">View Plans →</Link>
        </div>
      )}
    </div>
  );
}
