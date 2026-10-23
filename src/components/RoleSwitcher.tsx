import React from 'react';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Wrench, User } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { viewRole, setViewRole, currentUser } = useApp();

  const userRole = currentUser?.role || 'user';

  // Strict role isolation: ONLY Admins see or can use the portal switcher.
  // Technicians and Customers see only their own portal and never see portal switcher buttons.
  if (!currentUser || userRole !== 'admin') {
    return null;
  }

  const allRoles: {
    id: UserRole;
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
    { id: 'technician', label: 'Technician', icon: Wrench },
    { id: 'user', label: 'Customer', icon: User },
  ];

  const visibleRoles = allRoles;

  return (
    <div
      id="role-switcher"
      className="flex items-center gap-1 rounded-full bg-[#ebe9e4] p-1 text-xs border border-[#d6d1c7]"
    >
      {visibleRoles.map((r) => {
        const Icon = r.icon;
        const isActive = viewRole === r.id;

        return (
          <button
            key={r.id}
            id={`role-btn-${r.id}`}
            onClick={() => setViewRole(r.id)}
            title={`Switch to ${r.label} Portal`}
            className={`calm-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs cursor-pointer border whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-[#8c6d53] text-white border-[#8c6d53] font-semibold shadow-2xs'
                : 'bg-[#f4f4f2] text-stone-700 border-[#d6d1c7] hover:bg-[#ebe3da] hover:text-[#6e533c] hover:border-[#c7b6a6] font-medium'
            }`}
          >
            <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#8c6d53]'}`} />
            <span className="capitalize">{r.label}</span>
          </button>
        );
      })}
    </div>
  );
};
