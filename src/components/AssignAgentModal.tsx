import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Search, CheckCircle } from 'lucide-react';
import { UserProfile, Ticket } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const AssignAgentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
}> = ({ isOpen, onClose, ticket }) => {
  const { users, updateTicket } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  if (!isOpen) return null;

  // Filter users to only show admins or technicians
  const agents = users.filter((u) => u.role === 'admin' || u.role === 'technician');
  const filteredAgents = agents.filter((a) =>
    a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async (agent: UserProfile) => {
    setIsAssigning(true);
    try {
      await updateTicket(ticket.id, {
        status: ticket.status === 'new' ? 'in_progress' : ticket.status,
        assigned_to: agent.id,
        assigned_name: agent.full_name,
      });
      onClose();
    } catch (e) {
      console.error("Failed to assign agent", e);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 transition-opacity duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden max-h-[80vh]"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h2 className="text-base font-bold text-slate-900">Assign Agent</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredAgents.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">No agents found.</p>
          ) : (
            filteredAgents.map((agent) => {
              const isAssigned = ticket.assigned_to === agent.id;
              return (
                <motion.button
                  key={agent.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleAssign(agent)}
                  disabled={isAssigning || isAssigned}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isAssigned
                      ? 'border-emerald-200 bg-emerald-50 cursor-default'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                  }`}
                >
                  <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isAssigned ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {agent.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 line-clamp-1">{agent.full_name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{agent.email}</p>
                  </div>
                  {isAssigned && (
                    <CheckCircle className="size-5 text-emerald-600 shrink-0" />
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
