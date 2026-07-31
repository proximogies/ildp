import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useForm } from 'react-hook-form';
import { Sprout, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    setError('');
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-earth-100 via-growth-50 to-earth-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-growth-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-earth-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-down">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-growth-600 to-growth-700 rounded-3xl shadow-strong mb-6 hover:shadow-glow transition-all duration-300 hover:scale-105">
            <Sprout className="text-white" size={36} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2 tracking-tight">Welcome to ILDP</h1>
          <p className="text-earth-600 font-medium">Inclusive Leadership Digital Platform</p>
        </div>

        {/* Form */}
        <div className="card p-8 shadow-strong animate-slide-up" style={{ animationDelay: '100ms' }}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-3 animate-slide-down">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                {...register('email', { required: true })}
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('password', { required: true })}
              />
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm text-growth-600 hover:text-growth-700 font-semibold hover:underline transition-colors">
                Forgot password?
              </a>
            </div>

            <button 
              type="submit" 
              className="btn-primary w-full py-3 text-base font-semibold group" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-earth-500 mt-8 font-medium">
          © {new Date().getFullYear()} ILDP. Empowering inclusive agricultural leadership.
        </p>
      </div>
    </div>
  );
}
