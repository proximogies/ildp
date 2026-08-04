import { useForm, useWatch } from 'react-hook-form';
import api from '../lib/api.js';
import { X, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function AssociationModal({ onClose, onSaved, initial }) {
  const [error, setError] = useState('');
  const { register, handleSubmit, control, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      name: initial?.name || '',
      state: initial?.state || '',
      lga: initial?.lga || '',
      community: initial?.community || '',
      valueChain: initial?.valueChain || '',
      yearEstablished: initial?.yearEstablished || '',
      registrationStatus: initial?.registrationStatus || '',
      totalMembers: initial?.totalMembers ?? '',
      womenMembers: initial?.womenMembers ?? '',
      youthMembers: initial?.youthMembers ?? '',
      pwdMembers: initial?.pwdMembers ?? '',
    },
  });

  // Live-derive men count
  const totalMembers = useWatch({ control, name: 'totalMembers' });
  const womenMembers = useWatch({ control, name: 'womenMembers' });
  const menCount = (() => {
    const t = parseInt(totalMembers) || 0;
    const w = parseInt(womenMembers) || 0;
    return t - w >= 0 ? t - w : '—';
  })();

  const onSubmit = async (data) => {
    setError('');
    // Sanitize: convert empty strings to null, numbers to integers
    const payload = {
      name: data.name,
      state: data.state,
      lga: data.lga || null,
      community: data.community || null,
      valueChain: data.valueChain || null,
      yearEstablished: data.yearEstablished ? parseInt(data.yearEstablished) : null,
      registrationStatus: data.registrationStatus || null,
      totalMembers: data.totalMembers !== '' ? parseInt(data.totalMembers) : null,
      womenMembers: data.womenMembers !== '' ? parseInt(data.womenMembers) : null,
      youthMembers: data.youthMembers !== '' ? parseInt(data.youthMembers) : null,
      pwdMembers: data.pwdMembers !== '' ? parseInt(data.pwdMembers) : null,
    };

    try {
      if (initial?.id) {
        await api.put(`/associations/${initial.id}`, payload);
      } else {
        await api.post('/associations', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to save association. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{initial?.id ? 'Edit Association' : 'New Association'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Association Name *</label>
              <input className="input" placeholder="e.g. Akinyele Cassava Farmers Cooperative" {...register('name', { required: true })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">Association name is required</p>}
            </div>
            <div>
              <label className="label">State *</label>
              <input className="input" placeholder="e.g. Oyo" {...register('state', { required: true })} />
              {errors.state && <p className="text-red-500 text-xs mt-1">State is required</p>}
            </div>
            <div>
              <label className="label">LGA / District</label>
              <input className="input" placeholder="e.g. Akinyele" {...register('lga')} />
            </div>
            <div>
              <label className="label">Community</label>
              <input className="input" placeholder="e.g. Moniya" {...register('community')} />
            </div>
            <div>
              <label className="label">Value Chain / Commodity</label>
              <input className="input" placeholder="e.g. Cassava, Maize" {...register('valueChain')} />
            </div>
            <div>
              <label className="label">Year Established</label>
              <input type="number" min="1900" max={new Date().getFullYear()} className="input" placeholder="e.g. 1995" {...register('yearEstablished')} />
            </div>
            <div>
              <label className="label">Registration Status</label>
              <select className="input" {...register('registrationStatus')}>
                <option value="">Select...</option>
                <option value="Registered">Registered</option>
                <option value="Unregistered">Unregistered</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Membership Composition */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">Membership Composition</p>
            <div className="grid grid-cols-5 gap-3">
              <div>
                <label className="label">Total</label>
                <input type="number" min="0" className="input" placeholder="0" {...register('totalMembers', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="label">Women</label>
                <input type="number" min="0" className="input" placeholder="0" {...register('womenMembers', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="label">Men</label>
                <div className="input bg-gray-50 text-gray-500 cursor-not-allowed flex items-center">
                  {menCount}
                </div>
                <p className="text-xs text-gray-400 mt-1">Auto-calculated</p>
              </div>
              <div>
                <label className="label">Youth</label>
                <input type="number" min="0" className="input" placeholder="0" {...register('youthMembers', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="label">PWD</label>
                <input type="number" min="0" className="input" placeholder="0" {...register('pwdMembers', { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (initial?.id ? 'Update Association' : 'Save Association')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
