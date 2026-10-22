import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { X, Search, CheckCircle } from 'lucide-react';
import { UserProfile, Ticket } from '../types';

export const AssignAgentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
}> = ({ isOpen, onClose, ticket }) => {
  const { users, updateTicket } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  if (!isOpen) return null;

  const agents = users.filter((u) => u.role === 'admin' || u.role === 'technician');
  const filteredAgents = agents.filter(
    (a) =>
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
      console.error('Failed to assign agent', e);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 transition-opacity duration-200">
      <div className="calm-fade-slide bg-white border border-[#e2dfd9] rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden max-h-[80vh]">
        <div className="px-6 py-4 border-b border-[#e2dfd9] flex items-center justify-between bg-[#f4f4f2]">
          <h2 className="text-base font-bold text-[#262523]">Assign Agent</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#8c8881] hover:text-[#262523] hover:bg-[#ebe9e4] rounded-full transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 border-b border-[#e2dfd9] bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#8c8881]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f4f4f2] focus:bg-white border border-[#e2dfd9] focus:border-[#8c6d53] rounded-xl text-sm text-[#262523] outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
          {filteredAgents.length === 0 ? (
            <p className="text-center text-sm text-[#8c8881] py-8">No agents found.</p>
          ) : (
            filteredAgents.map((agent) => {
              const isAssigned = ticket.assigned_to === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => handleAssign(agent)}
                  disabled={isAssigning || isAssigned}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    isAssigned
                      ? 'border-[#c6e6d0] bg-[#e6f4ea] cursor-default'
                      : 'border-[#e2dfd9] bg-white hover:border-[#d6c2b0] hover:bg-[#f5efe8] cursor-pointer'
                  }`}
                >
                  <div
                    className={`size-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      isAssigned
                        ? 'bg-[#c6e6d0] text-[#2f6b45]'
                        : 'bg-[#f4f4f2] text-[#6e533c] border border-[#e2dfd9]'
                    }`}
                  >
                    {agent.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#262523] line-clamp-1">{agent.full_name}</p>
                    <p className="text-xs text-[#5c5954] line-clamp-1">{agent.email}</p>
                  </div>
                  {isAssigned && <CheckCircle className="size-5 text-[#2f6b45] shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
