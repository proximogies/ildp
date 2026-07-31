import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { Plus, Users } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

const ROLES = ['super_admin', 'program_manager', 'facilitator', 'association_leader', 'reviewer'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchUsers = () => api.get('/users').then(r => setUsers(r.data.data));
  useEffect(() => { fetchUsers(); }, []);

  const onSubmit = async (data) => {
    await api.post('/users', data);
    reset();
    setShowForm(false);
    fetchUsers();
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Invite User</button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Invite New User</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name *</label>
              <input className="input" {...register('firstName', { required: true })} />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input className="input" {...register('lastName', { required: true })} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" {...register('email', { required: true })} />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" {...register('roleCode', { required: true })}>
                <option value="">Select role...</option>
                {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>Send Invite</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Last Login'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                No users found
              </td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3 text-gray-500 capitalize">{u.userRoles?.[0]?.role?.name || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-gray-400">{u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM d, yyyy') : 'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
