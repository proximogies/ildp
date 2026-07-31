import { useForm } from 'react-hook-form';
import api from '../lib/api.js';
import { X } from 'lucide-react';

export default function AssociationModal({ onClose, onSaved, initial }) {
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({ defaultValues: initial });

  const onSubmit = async (data) => {
    if (initial?.id) {
      await api.put(`/associations/${initial.id}`, data);
    } else {
      await api.post('/associations', data);
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{initial ? 'Edit Association' : 'New Association'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Association Name *</label>
              <input className="input" {...register('name', { required: true })} />
              {errors.name && <p className="text-red-500 text-xs mt-1">Required</p>}
            </div>
            <div>
              <label className="label">State *</label>
              <input className="input" {...register('state', { required: true })} />
            </div>
            <div>
              <label className="label">LGA / District</label>
              <input className="input" {...register('lga')} />
            </div>
            <div>
              <label className="label">Community</label>
              <input className="input" {...register('community')} />
            </div>
            <div>
              <label className="label">Value Chain / Commodity</label>
              <input className="input" {...register('valueChain')} />
            </div>
            <div>
              <label className="label">Year Established</label>
              <input type="number" className="input" {...register('yearEstablished')} />
            </div>
            <div>
              <label className="label">Registration Status</label>
              <select className="input" {...register('registrationStatus')}>
                <option value="">Select...</option>
                <option value="registered">Registered</option>
                <option value="unregistered">Unregistered</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Membership Composition</p>
            <div className="grid grid-cols-4 gap-3">
              {[['totalMembers', 'Total Members'], ['womenMembers', 'Women'], ['youthMembers', 'Youth'], ['pwdMembers', 'PWD']].map(([field, label]) => (
                <div key={field}>
                  <label className="label">{label}</label>
                  <input type="number" min="0" className="input" {...register(field, { valueAsNumber: true })} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Association'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
