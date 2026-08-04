import { useEffect, useState } from 'react';
import api from '../lib/api.js';
import { Plus, Users, Search, MoreVertical, Mail, Pencil, Trash2, RefreshCw, X, ChevronDown } from 'lucide-react';
import StatusBadge from '../components/StatusBadge.jsx';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';

const ROLES = [
  { code: 'super_admin', label: 'Super Admin' },
  { code: 'program_manager', label: 'Program Manager' },
  { code: 'facilitator', label: 'Facilitator' },
  { code: 'association_leader', label: 'Association Leader' },
  { code: 'reviewer', label: 'Reviewer' },
];

const STATUS_OPTIONS = ['active', 'inactive', 'suspended', 'invited'];

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function UserMenu({ user, onEdit, onResendInvite, onToggleStatus, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">
            <button
              onClick={() => { onEdit(user); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Pencil size={14} /> Edit
            </button>
            {user.status === 'invited' && (
              <button
                onClick={() => { onResendInvite(user); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw size={14} /> Resend Invite
              </button>
            )}
            {user.status === 'active' && (
              <button
                onClick={() => { onToggleStatus(user, 'inactive'); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-amber-600 hover:bg-amber-50"
              >
                <Mail size={14} /> Deactivate
              </button>
            )}
            {user.status === 'inactive' && (
              <button
                onClick={() => { onToggleStatus(user, 'active'); setOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-growth-600 hover:bg-growth-50"
              >
                <Mail size={14} /> Reactivate
              </button>
            )}
            <hr className="my-1 border-gray-100" />
            <button
              onClick={() => { onDelete(user); setOpen(false); }}
              className="flex items-center gap-2 w-full px-4 py-2 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const inviteForm = useForm();
  const editForm = useForm();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50 });
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterRole) params.set('role', filterRole);
      const r = await api.get(`/users?${params}`);
      setUsers(r.data.data);
      setTotal(r.data.meta.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search, filterStatus, filterRole]);

  // Invite
  const onInvite = async (data) => {
    setActionLoading(true);
    try {
      await api.post('/users', data);
      showToast(`Invite sent to ${data.email}`);
      inviteForm.reset();
      setShowInviteModal(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to invite user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Edit
  const openEdit = (user) => {
    setEditingUser(user);
    editForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      roleCode: user.userRoles?.[0]?.role?.code || '',
      status: user.status,
    });
  };

  const onEdit = async (data) => {
    setActionLoading(true);
    try {
      await api.put(`/users/${editingUser.id}`, data);
      showToast('User updated');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Resend invite
  const onResendInvite = async (user) => {
    try {
      await api.post(`/users/${user.id}/resend-invite`);
      showToast(`Invite resent to ${user.email}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend invite', 'error');
    }
  };

  // Toggle status
  const onToggleStatus = async (user, status) => {
    try {
      await api.put(`/users/${user.id}`, { status });
      showToast(`User ${status === 'active' ? 'reactivated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  // Delete
  const onDelete = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/users/${deletingUser.id}`);
      showToast('User removed');
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove user', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-down
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-growth-600 text-white'}`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} total users</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowInviteModal(true)}>
          <Plus size={16} /> Invite User
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-40" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="input w-48" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Email', 'Role', 'Status', 'Last Login', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                No users found
              </td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-growth-100 text-growth-700 flex items-center justify-center font-semibold text-xs shrink-0">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <span className="font-medium text-gray-900">{u.firstName} {u.lastName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium bg-earth-100 text-earth-700 px-2 py-0.5 rounded-full">
                    {u.userRoles?.[0]?.role?.name || '—'}
                  </span>
                </td>
                <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM d, yyyy') : 'Never'}
                </td>
                <td className="px-4 py-3 text-right">
                  <UserMenu
                    user={u}
                    onEdit={openEdit}
                    onResendInvite={onResendInvite}
                    onToggleStatus={onToggleStatus}
                    onDelete={setDeletingUser}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <Modal title="Invite New User" onClose={() => { setShowInviteModal(false); inviteForm.reset(); }}>
          <form onSubmit={inviteForm.handleSubmit(onInvite)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input className="input" placeholder="Jane" {...inviteForm.register('firstName', { required: true })} />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input className="input" placeholder="Doe" {...inviteForm.register('lastName', { required: true })} />
              </div>
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input type="email" className="input" placeholder="jane@example.com" {...inviteForm.register('email', { required: true })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" placeholder="+234 800 000 0000" {...inviteForm.register('phone')} />
            </div>
            <div>
              <label className="label">Role *</label>
              <select className="input" {...inviteForm.register('roleCode', { required: true })}>
                <option value="">Select a role...</option>
                {ROLES.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-500">An invitation email will be sent to the user with a link to set their password.</p>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" className="btn-secondary" onClick={() => { setShowInviteModal(false); inviteForm.reset(); }}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <Modal title="Edit User" onClose={() => setEditingUser(null)}>
          <form onSubmit={editForm.handleSubmit(onEdit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name</label>
                <input className="input" {...editForm.register('firstName', { required: true })} />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input" {...editForm.register('lastName', { required: true })} />
              </div>
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" {...editForm.register('phone')} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" {...editForm.register('roleCode')}>
                {ROLES.map(r => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" {...editForm.register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" className="btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={actionLoading}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {deletingUser && (
        <Modal title="Remove User" onClose={() => setDeletingUser(null)}>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to remove <strong>{deletingUser.firstName} {deletingUser.lastName}</strong>?
              This will deactivate their account. This action can be undone by reactivating the user.
            </p>
            <div className="flex gap-3 justify-end">
              <button className="btn-secondary" onClick={() => setDeletingUser(null)}>Cancel</button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-colors"
                onClick={onDelete}
                disabled={actionLoading}
              >
                {actionLoading ? 'Removing...' : 'Remove User'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
