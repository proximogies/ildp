import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { ArrowLeft, Users, MapPin, Leaf, Calendar } from 'lucide-react';

const TABS = ['Overview', 'Leadership', 'Assessments', 'Action Plans'];

export default function AssociationProfilePage() {
  const { id } = useParams();
  const [association, setAssociation] = useState(null);
  const [tab, setTab] = useState('Overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/associations/${id}`).then(r => setAssociation(r.data.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 animate-pulse"><div className="h-8 bg-gray-200 rounded w-64" /></div>;
  if (!association) return <div className="p-6 text-gray-500">Association not found.</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Back + Header */}
      <div>
        <Link to="/associations" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={14} /> Back to Associations
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{association.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin size={14} />{association.state}{association.lga ? `, ${association.lga}` : ''}</span>
              {association.valueChain && <span className="flex items-center gap-1"><Leaf size={14} />{association.valueChain}</span>}
              {association.yearEstablished && <span className="flex items-center gap-1"><Calendar size={14} />Est. {association.yearEstablished}</span>}
            </div>
          </div>
          <Link to={`/assessments?associationId=${id}`} className="btn-primary">Start Assessment</Link>
        </div>
      </div>

      {/* Membership stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          ['Total Members', association.totalMembers],
          ['Women Members', association.womenMembers],
          ['Youth Members', association.youthMembers],
          ['PWD Members', association.pwdMembers],
        ].map(([label, val]) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{val ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Details</h3>
            {[
              ['Community', association.community],
              ['Address', association.address],
              ['Registration', association.registrationStatus],
            ].map(([k, v]) => v ? (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-900 capitalize">{v}</span>
              </div>
            ) : null)}
          </div>
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Primary Contact</h3>
            {association.contacts?.filter(c => c.isPrimary).map(c => (
              <div key={c.id} className="text-sm space-y-1">
                <p className="font-medium text-gray-900">{c.name}</p>
                <p className="text-gray-500">{c.roleTitle}</p>
                <p className="text-gray-500">{c.email}</p>
                <p className="text-gray-500">{c.phone}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Leadership' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Position', 'Name', 'Gender', 'Age Group', 'Youth', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {association.leadershipProfiles?.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.positionTitle}</td>
                  <td className="px-4 py-3 text-gray-600">{p.occupantName || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{p.gender || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.ageGroup || '—'}</td>
                  <td className="px-4 py-3">{p.isYouth ? '✓' : '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.activeStatus ? 'active' : 'inactive'} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Assessments' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Round', 'Type', 'Status', 'Score', 'Band', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {association.assessments?.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">{a.assessmentRound?.title}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{a.assessmentType?.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 font-semibold">{a.overallScore?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-3">{a.scoreBand?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Link to={`/assessments/${a.id}/scorecard`} className="text-primary-600 hover:underline text-xs">Scorecard</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Action Plans' && (
        <div className="space-y-3">
          {association.actionPlans?.map(p => (
            <div key={p.id} className="card p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-sm">{p.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))}
          {!association.actionPlans?.length && <p className="text-gray-400 text-sm">No open action plans.</p>}
        </div>
      )}
    </div>
  );
}
