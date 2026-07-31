import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard, Building2, ClipboardList, FileText,
  BarChart3, CheckSquare, Bell, Users, LogOut, Sprout
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/associations', label: 'Associations', icon: Building2 },
  { to: '/assessment-rounds', label: 'Assessment Rounds', icon: ClipboardList },
  { to: '/assessments', label: 'Assessments', icon: FileText },
  { to: '/action-plans', label: 'Action Plans', icon: CheckSquare },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
];

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-earth-50 via-white to-growth-50/30 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-earth-100/50 flex flex-col shadow-soft">
        {/* Logo */}
        <div className="p-6 border-b border-earth-100/50">
          <div className="flex items-center gap-3 group">
            <div className="w-11 h-11 bg-gradient-to-br from-growth-600 to-growth-700 rounded-2xl flex items-center justify-center shadow-medium group-hover:shadow-glow transition-all duration-300 group-hover:scale-105">
              <Sprout className="text-white" size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-display font-bold text-gray-900 text-base leading-tight tracking-tight">ILDP</p>
              <p className="text-xs text-earth-600 font-medium mt-0.5">Inclusive Leadership</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item, idx) => {
            if (item.adminOnly && !hasRole('super_admin') && !hasRole('program_manager')) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group animate-slide-up',
                  isActive
                    ? 'bg-gradient-to-r from-growth-50 to-growth-100/50 text-growth-700 shadow-soft'
                    : 'text-gray-600 hover:bg-earth-50/50 hover:text-gray-900'
                )}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <item.icon size={19} className="transition-transform duration-200 group-hover:scale-110" strokeWidth={2.2} />
                <span className="tracking-tight">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-earth-100/50 bg-gradient-to-br from-earth-50/30 to-transparent">
          <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-white/60 backdrop-blur-sm border border-earth-100/50">
            <div className="w-10 h-10 bg-gradient-to-br from-growth-100 to-growth-200 rounded-xl flex items-center justify-center shadow-soft">
              <span className="text-growth-700 font-bold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-earth-600 truncate capitalize font-medium">{user?.roles?.[0]?.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 transition-all duration-200 w-full px-3 py-2 rounded-lg hover:bg-red-50 font-medium"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
