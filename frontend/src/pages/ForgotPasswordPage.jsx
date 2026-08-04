import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Sprout, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../lib/api.js';

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async ({ email }) => {
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-100 via-growth-50 to-earth-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-growth-600 to-growth-700 rounded-3xl shadow-strong mb-6">
            <Sprout className="text-white" size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Forgot Password</h1>
          <p className="text-earth-600 font-medium">Inclusive Leadership Digital Platform</p>
        </div>

        <div className="card p-8 shadow-strong">
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3 mb-6">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-growth-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-growth-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
              <p className="text-gray-500">If an account exists for that email, we've sent a password reset link.</p>
              <Link to="/login" className="inline-block text-growth-600 hover:underline font-medium text-sm mt-2">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <p className="text-gray-500 text-sm">Enter your email and we'll send you a link to reset your password.</p>
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  {...register('email', { required: true })}
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3 font-semibold" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-gray-500">
                <Link to="/login" className="text-growth-600 hover:underline font-medium">Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
