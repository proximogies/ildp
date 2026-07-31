import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Plus, Search, Building2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import AssociationModal from '../components/AssociationModal.jsx';

export default function AssociationsPage() {
  const { hasPermission } = useAuth();
  const [associations, setAssociations] = useState([]);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAssociations = async (q = '') => {
    setLoading(true);
    const { data } = await api.get('/associations', { params: { search: q, limit: 50 } });
    setAssociations(data.data);
    setMeta(data.meta);
    setLoading(false);
  };

  useEffect(() => { fetchAssociations(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchAssociations(e.target.value);
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Associations</h1>
          <p className="text-gray-500 text-sm mt-1">{meta.total ?? 0} total associations</p>
        </div>
        {hasPermission('create_association') && (
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Association
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search associations..."
          value={search}
          onChange={handleSearch}
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Association', 'Location', 'Value Chain', 'Members', 'Women', 'Youth', 'Last Assessment', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : associations.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                No associations found
              </td></tr>
            ) : associations.map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{a.name}</td>
                <td className="px-4 py-3 text-gray-500">{a.state}{a.lga ? `, ${a.lga}` : ''}</td>
                <td className="px-4 py-3 text-gray-500">{a.valueChain || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{a.totalMembers ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{a.womenMembers ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{a.youthMembers ?? '—'}</td>
                <td className="px-4 py-3">
                  {a.assessments?.[0] ? (
                    <StatusBadge status={a.assessments[0].status} />
                  ) : <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <Link to={`/associations/${a.id}`} className="text-primary-600 hover:underline text-xs font-medium">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AssociationModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAssociations(); }}
        />
      )}
    </div>
  );
}
