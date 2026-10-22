import React from 'react';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Wrench, User, Lock } from 'lucide-react';
import { motion } from 'motion/react';

export const RoleSwitcher: React.FC = () => {
  const { viewRole, setViewRole, currentUser } = useApp();

  const userRole = currentUser?.role || 'user';

  const roles: {
    id: UserRole;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
    { id: 'technician', label: 'Technician', icon: Wrench },
    { id: 'user', label: 'Customer', icon: User },
  ];

  const isRoleLocked = (targetRole: UserRole): boolean => {
    if (!currentUser) return false;
    if (userRole === 'admin') return false; // Admin can view any workspace
    if (userRole === 'technician') {
      return targetRole === 'admin'; // Technician cannot access Admin
    }
    // Customer/User: cannot access Admin or Technician
    return targetRole === 'admin' || targetRole === 'technician';
  };

  const handleRoleClick = (targetRole: UserRole) => {
    setViewRole(targetRole);
  };

  return (
    <div
      id="role-switcher"
      className="flex items-center gap-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/90 p-1 text-xs border border-slate-200/80 shadow-xs"
    >
      {roles.map((r) => {
        const Icon = r.icon;
        const isActive = viewRole === r.id;
        const locked = isRoleLocked(r.id);

        return (
          <motion.button
            key={r.id}
            id={`role-btn-${r.id}`}
            whileHover={{ scale: locked ? 1 : 1.03 }}
            whileTap={{ scale: locked ? 1 : 0.97 }}
            onClick={() => handleRoleClick(r.id)}
            title={
              locked
                ? `🔒 Locked - Requires ${r.label} privileges`
                : `Switch to ${r.label} Dashboard`
            }
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all cursor-pointer border ${
              isActive
                ? 'bg-[#0f3b6c] text-white border-[#0f3b6c] font-bold shadow-xs'
                : locked
                ? 'bg-slate-100/80 text-slate-400 border-slate-200/60 hover:bg-slate-200/60 font-medium'
                : 'bg-white text-[#0f3b6c] border-transparent hover:border-slate-300 hover:bg-slate-50 font-medium'
            }`}
          >
            {locked ? (
              <Lock className="size-3 text-slate-400 shrink-0" />
            ) : (
              <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#0f3b6c]'}`} />
            )}
            <span className="capitalize">{r.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};


