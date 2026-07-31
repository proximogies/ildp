import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../lib/api.js';
import { Building2, ClipboardList, Clock, CheckCircle, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import StatusBadge from '../components/StatusBadge.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/summary'),
      api.get('/dashboard/analytics'),
    ]).then(([s, a]) => {
      setSummary(s.data.data);
      setAnalytics(a.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const stats = [
    { label: 'Total Associations', value: summary?.totalAssociations, icon: Building2, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50' },
    { label: 'Active Rounds', value: summary?.activeRounds, icon: ClipboardList, color: 'from-growth-500 to-growth-600', bgColor: 'bg-growth-50' },
    { label: 'Pending Review', value: summary?.pendingReview, icon: Clock, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50' },
    { label: 'Completed', value: summary?.completedAssessments, icon: CheckCircle, color: 'from-green-500 to-green-600', bgColor: 'bg-green-50' },
    { label: 'Overdue Actions', value: summary?.overdueActions, icon: AlertTriangle, color: 'from-red-500 to-red-600', bgColor: 'bg-red-50' },
  ];

  const radarData = analytics?.domainAnalytics?.map(d => ({
    domain: d.domain?.code || '',
    score: parseFloat((d.avgScore || 0).toFixed(2)),
    fullMark: 4,
  })) || [];

  const barData = analytics?.domainAnalytics?.map(d => ({
    name: d.domain?.code || '',
    score: parseFloat((d.avgScore || 0).toFixed(2)),
  })) || [];

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-growth-600" size={28} strokeWidth={2.5} />
          <h1 className="section-title">Dashboard</h1>
        </div>
        <p className="text-earth-600 font-medium">Welcome back, <span className="text-gray-900 font-semibold">{user?.firstName}</span>.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
        {stats.map((s, idx) => (
          <div key={s.label} className="stat-card animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-medium`}>
              <s.icon size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <p className="text-3xl font-display font-bold text-gray-900 mb-1">{s.value ?? '—'}</p>
            <p className="text-sm text-earth-600 font-semibold tracking-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {radarData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-7 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-growth-600 to-growth-700 rounded-full" />
              <h2 className="font-display font-bold text-gray-900 text-lg">Domain Performance</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#d4c4a8" strokeWidth={1.5} />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 12, fontWeight: 600, fill: '#5f4d36' }} />
                <Radar name="Avg Score" dataKey="score" stroke="#47a447" fill="#47a447" fillOpacity={0.3} strokeWidth={2.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-7 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-gradient-to-b from-growth-600 to-growth-700 rounded-full" />
              <h2 className="font-display font-bold text-gray-900 text-lg">Average Score by Domain</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8dfd0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600, fill: '#5f4d36' }} />
                <YAxis domain={[0, 4]} tick={{ fontSize: 11, fontWeight: 600, fill: '#5f4d36' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '2px solid #d4c4a8', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="score" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#47a447" />
                    <stop offset="100%" stopColor="#6bc06b" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent Assessments */}
      {summary?.recentAssessments?.length > 0 && (
        <div className="card animate-slide-up" style={{ animationDelay: '350ms' }}>
          <div className="p-6 border-b border-earth-100/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-growth-600 to-growth-700 rounded-full" />
              <h2 className="font-display font-bold text-gray-900 text-lg">Recent Assessments</h2>
            </div>
            <Link to="/assessments" className="text-sm text-growth-600 hover:text-growth-700 font-semibold hover:underline transition-colors flex items-center gap-1">
              View all <TrendingUp size={14} />
            </Link>
          </div>
          <div className="divide-y divide-earth-100/50">
            {summary.recentAssessments.map((a, idx) => (
              <div key={a.id} className="p-5 flex items-center justify-between hover:bg-earth-50/30 transition-colors group" style={{ animationDelay: `${400 + idx * 50}ms` }}>
                <div>
                  <p className="font-semibold text-gray-900 text-sm group-hover:text-growth-700 transition-colors">{a.association?.name}</p>
                  <p className="text-xs text-earth-600 mt-1 font-medium">{a.assessmentRound?.title}</p>
                </div>
                <div className="flex items-center gap-4">
                  {a.overallScore != null && (
                    <div className="text-right">
                      <span className="text-lg font-display font-bold text-gray-900">{a.overallScore.toFixed(2)}</span>
                      <p className="text-xs text-earth-500 font-medium">Score</p>
                    </div>
                  )}
                  <StatusBadge status={a.status} />
                  <Link to={`/assessments/${a.id}/scorecard`} className="text-xs text-growth-600 hover:text-growth-700 font-semibold hover:underline transition-colors">
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PageLoader() {
  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div className="space-y-3 animate-pulse">
        <div className="h-8 bg-gradient-to-r from-earth-200 to-earth-100 rounded-xl w-48" />
        <div className="h-4 bg-gradient-to-r from-earth-200 to-earth-100 rounded-lg w-64" />
      </div>
      <div className="grid grid-cols-5 gap-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-gradient-to-br from-earth-100 to-earth-50 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    </div>
  );
}
