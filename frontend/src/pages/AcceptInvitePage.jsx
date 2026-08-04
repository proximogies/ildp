import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Sprout, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../lib/api.js';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [userInfo, setUserInfo] = useState(null);
  const [tokenError, setTokenError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (!token) {
      setTokenError('No invite token found. Please use the link from your email.');
      return;
    }
    api.get(`/auth/invite-info?token=${token}`)
      .then(r => setUserInfo(r.data.data))
      .catch(err => setTokenError(err.response?.data?.message || 'Invalid or expired invite link'));
  }, [token]);

  const onSubmit = async ({ password }) => {
    try {
      await api.post('/auth/accept-invite', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setTokenError(err.response?.data?.message || 'Failed to activate account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-100 via-growth-50 to-earth-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-growth-600 to-growth-700 rounded-3xl shadow-strong mb-6">
            <Sprout className="text-white" size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Accept Invitation</h1>
          <p className="text-earth-600 font-medium">Inclusive Leadership Digital Platform</p>
        </div>

        <div className="card p-8 shadow-strong">
          {tokenError && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3 mb-6">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{tokenError}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-growth-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-growth-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Account Activated!</h2>
              <p className="text-gray-500">Your account is ready. Redirecting you to login...</p>
            </div>
          ) : userInfo ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="bg-growth-50 rounded-xl px-4 py-3 text-sm text-growth-800">
                Welcome, <strong>{userInfo.firstName} {userInfo.lastName}</strong>! Set a password for <strong>{userInfo.email}</strong>.
              </div>

              <div>
                <label className="label">New Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Min. 8 characters"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    })}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="label">Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Repeat your password"
                    {...register('confirm', {
                      required: 'Please confirm your password',
                      validate: v => v === watch('password') || 'Passwords do not match',
                    })}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirm && <p className="text-red-500 text-xs mt-1">{errors.confirm.message}</p>}
              </div>

              <button type="submit" className="btn-primary w-full py-3 font-semibold" disabled={isSubmitting}>
                {isSubmitting ? 'Activating...' : 'Activate Account'}
              </button>
            </form>
          ) : !tokenError ? (
            <div className="text-center text-gray-400 py-8">Verifying invite link...</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
