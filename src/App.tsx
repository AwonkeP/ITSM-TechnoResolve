import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Lazy loaded components for code-splitting
const LandingPage = lazy(() => import('./components/LandingPage').then(module => ({ default: module.LandingPage })));
const CustomerPortal = lazy(() => import('./components/CustomerPortal').then(module => ({ default: module.CustomerPortal })));
const TechnicianWorkspace = lazy(() => import('./components/TechnicianWorkspace').then(module => ({ default: module.TechnicianWorkspace })));
const AdminControlCenter = lazy(() => import('./components/AdminControlCenter').then(module => ({ default: module.AdminControlCenter })));
const LoginPage = lazy(() => import('./components/LoginPage').then(module => ({ default: module.LoginPage })));
const AuthModal = lazy(() => import('./components/AuthModal').then(module => ({ default: module.AuthModal })));
const NewTicketModal = lazy(() => import('./components/NewTicketModal').then(module => ({ default: module.NewTicketModal })));
const PendingApprovalView = lazy(() => import('./components/PendingApprovalView').then(module => ({ default: module.PendingApprovalView })));
const NotificationCenterModal = lazy(() => import('./components/NotificationCenterModal').then(module => ({ default: module.NotificationCenterModal })));
const EmailOutboxModal = lazy(() => import('./components/EmailOutboxModal').then(module => ({ default: module.EmailOutboxModal })));

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
  </div>
);

const ToastContainer: React.FC = () => {
  const { toasts = [], dismissToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm sm:max-w-md w-full px-4 sm:px-0 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs shadow-xl backdrop-blur-md transition-all ${
                toast.type === 'success'
                  ? 'border-emerald-500/40 bg-[#061e14]/95 text-emerald-100'
                  : toast.type === 'error'
                  ? 'border-rose-500/40 bg-[#250911]/95 text-rose-100'
                  : 'border-cyan-500/40 bg-[#081b33]/95 text-cyan-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {toast.type === 'success' ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : toast.type === 'error' ? (
                  <AlertCircle className="size-4 text-rose-400 shrink-0" />
                ) : (
                  <Info className="size-4 text-cyan-400 shrink-0" />
                )}
                <p className="font-medium leading-snug">{toast.message}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="rounded p-1 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="size-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

const AccessDeniedView: React.FC<{ requiredRole: string; onReturn: () => void }> = ({
  requiredRole,
  onReturn,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#060f1e] text-slate-100">
      <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-[#09172e] p-8 text-center space-y-4 shadow-2xl">
        <div className="size-14 rounded-2xl bg-rose-950/80 border border-rose-500/30 text-rose-400 mx-auto grid place-items-center">
          <ShieldAlert className="size-7" />
        </div>
        <h2 className="text-lg font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Only <strong className="text-rose-300">{requiredRole}</strong> users have permission to
          access this portal view.
        </p>
        <button
          onClick={onReturn}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          <span>Return to Authorized Workspace</span>
        </button>
      </div>
    </div>
  );
};

const MainContent: React.FC = () => {
  const {
    activePage,
    setActivePage,
    viewRole,
    setViewRole,
    currentUser,
    isOutboxOpen,
    setIsOutboxOpen,
    isNotificationCenterOpen,
    setIsNotificationCenterOpen,
  } = useApp();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // 1. Landing and Login pages
  if (activePage === 'login') {
    return (
      <div className="min-h-screen bg-background font-sans theme-user">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <LoginPage onBackToLanding={() => setActivePage('landing')} />
        </motion.div>
        <ToastContainer />
        <EmailOutboxModal isOpen={isOutboxOpen} onClose={() => setIsOutboxOpen(false)} />
      </div>
    );
  }

  if (activePage === 'landing') {
    return (
      <div className="min-h-screen bg-background font-sans theme-user">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage
            onOpenAuth={() => setActivePage('login')}
            onOpenNewTicket={() => setIsNewTicketOpen(true)}
          />
        </motion.div>
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <NewTicketModal isOpen={isNewTicketOpen} onClose={() => setIsNewTicketOpen(false)} />
        <ToastContainer />
        <EmailOutboxModal isOpen={isOutboxOpen} onClose={() => setIsOutboxOpen(false)} />
        <NotificationCenterModal
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
        />
      </div>
    );
  }

  // 2. User Gate: Check Admin Approval
  if (currentUser && !currentUser.is_approved) {
    return (
      <div className="min-h-screen bg-background font-sans theme-user">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          <PendingApprovalView />
        </motion.div>
        <ToastContainer />
        <EmailOutboxModal isOpen={isOutboxOpen} onClose={() => setIsOutboxOpen(false)} />
        <NotificationCenterModal
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
        />
      </div>
    );
  }

  // 4. Role-Based Access Routing: Only Admin can access all pages
  const renderPortalView = () => {
    if (viewRole === 'admin') {
      if (currentUser?.role === 'admin') {
        return <AdminControlCenter />;
      }
      return (
        <AccessDeniedView
          requiredRole="System Administrator"
          onReturn={() => setViewRole(currentUser?.role || 'user')}
        />
      );
    }

    if (viewRole === 'technician') {
      if (currentUser?.role === 'technician' || currentUser?.role === 'admin') {
        return <TechnicianWorkspace />;
      }
      return (
        <AccessDeniedView
          requiredRole="Technician"
          onReturn={() => setViewRole('user')}
        />
      );
    }

    return <CustomerPortal />;
  };

  return (
    <div className={`min-h-screen bg-background font-sans theme-${viewRole}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={viewRole}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen"
        >
          {renderPortalView()}
        </motion.div>
      </AnimatePresence>

      {/* Global Modals */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <NewTicketModal isOpen={isNewTicketOpen} onClose={() => setIsNewTicketOpen(false)} />
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
      <EmailOutboxModal isOpen={isOutboxOpen} onClose={() => setIsOutboxOpen(false)} />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <Suspense fallback={<LoadingFallback />}>
        <MainContent />
      </Suspense>
    </AppProvider>
  );
}
