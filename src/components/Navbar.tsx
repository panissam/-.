import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Home, Calendar, LayoutDashboard, User, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'หน้าแรก', path: '/', icon: Home },
    { name: 'รายการจองของฉัน', path: '/bookings', icon: Calendar },
    ...(isAdmin ? [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Staff', path: '/staff', icon: Users }
    ] : []),
  ];

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#1e293b] bg-[#0f172a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3b82f6] font-bold text-white shadow-lg shadow-blue-500/20">
            BU
          </div>
          <div>
            <div className="hidden text-base font-bold tracking-tight text-[#f8fafc] sm:block leading-tight">
              BU TRAINING
            </div>
            <div className="hidden text-[10px] text-[#64748b] font-bold uppercase tracking-wider sm:block leading-tight">
              Registration Portal
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <div className="hidden items-center space-x-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'group flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'text-[#3b82f6] border-b-2 border-[#3b82f6] rounded-none pb-5 mt-1'
                    : 'text-[#94a3b8] hover:text-[#f8fafc]'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 rounded-full bg-[#1e293b] py-1.5 pl-1.5 pr-4 border border-[#334155]">
            {profile?.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="h-8 w-8 rounded-full border border-[#334155]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#3b82f6] text-white font-bold text-[10px]">
                {profile?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden flex-col items-start lg:flex">
              <span className="text-sm font-medium text-[#f8fafc]">{profile?.displayName}</span>
              <div className="flex items-center space-x-2">
                {isAdmin && (
                  <span className="text-[9px] text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-1.5 py-0.5 rounded font-bold uppercase">
                    Admin
                  </span>
                )}
                {profile?.staffInfo?.division && (
                  <span className="text-[9px] text-[#94a3b8] font-bold uppercase tracking-tighter">
                    {profile.staffInfo.division}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="group p-2 text-[#64748b] hover:text-[#f87171] hover:bg-[#f87171]/10 rounded-lg transition-all"
            title="ออกจากระบบ"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
