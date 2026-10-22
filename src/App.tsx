import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

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
  <div className="min-h-screen flex items-center justify-center bg-[#f4f4f2]">
    <Loader2 className="w-7 h-7 text-[#8c6d53] animate-spin" />
  </div>
);

const ToastContainer: React.FC = () => {
  const { toasts = [], dismissToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm sm:max-w-md w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => {
        return (
          <div
            key={toast.id}
            className={`calm-fade-slide pointer-events-auto flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs shadow-lg transition-all ${
              toast.type === 'success'
                ? 'border-[#c6e6d0] bg-[#e6f4ea] text-[#2f6b45]'
                : toast.type === 'error'
                ? 'border-[#d6c2b0] bg-[#f5efe8] text-[#6e533c]'
                : 'border-[#e2dfd9] bg-white text-[#262523]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="size-4 text-[#2f6b45] shrink-0" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="size-4 text-[#8c6d53] shrink-0" />
              ) : (
                <Info className="size-4 text-[#8c6d53] shrink-0" />
              )}
              <p className="font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="rounded p-1 text-[#8c8881] hover:text-[#262523] transition-colors cursor-pointer shrink-0"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

const AccessDeniedView: React.FC<{ requiredRole: string; onReturn: () => void }> = ({
  requiredRole,
  onReturn,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f4f2] text-[#262523]">
      <div className="calm-fade-slide max-w-md w-full rounded-2xl border border-[#e2dfd9] bg-white p-8 text-center space-y-4 shadow-sm">
        <div className="size-12 rounded-2xl bg-[#f5efe8] border border-[#d6c2b0] text-[#8c6d53] mx-auto grid place-items-center">
          <ShieldAlert className="size-6" />
        </div>
        <h2 className="text-lg font-bold text-[#262523]">Access Restricted</h2>
        <p className="text-xs text-[#5c5954] leading-relaxed">
          Only <strong className="text-[#6e533c]">{requiredRole}</strong> users have permission to
          access this portal view.
        </p>
        <button
          onClick={onReturn}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#8c6d53] hover:bg-[#765a43] text-white font-semibold text-xs transition-all cursor-pointer calm-btn"
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
      <div className="min-h-screen bg-[#f4f4f2] font-sans theme-user">
        <div className="calm-fade-slide">
          <LoginPage onBackToLanding={() => setActivePage('landing')} />
        </div>
        <ToastContainer />
        <EmailOutboxModal isOpen={isOutboxOpen} onClose={() => setIsOutboxOpen(false)} />
      </div>
    );
  }

  if (activePage === 'landing') {
    return (
      <div className="min-h-screen bg-[#f4f4f2] font-sans theme-user">
        <div className="calm-fade-slide">
          <LandingPage
            onOpenAuth={() => setActivePage('login')}
            onOpenNewTicket={() => setIsNewTicketOpen(true)}
          />
        </div>
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
      <div className="min-h-screen bg-[#f4f4f2] font-sans theme-user">
        <div className="calm-fade-slide">
          <PendingApprovalView />
        </div>
        <ToastContainer />
        <EmailOutboxModal isOpen={isOutboxOpen} onClose={() => setIsOutboxOpen(false)} />
        <NotificationCenterModal
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
        />
      </div>
    );
  }

  // 3. Strict Role-Based Access Routing:
  // - Customers ('user') only ever see and access CustomerPortal
  // - Technicians ('technician') only ever see and access TechnicianWorkspace
  // - Admins ('admin') have full access to AdminControlCenter, TechnicianWorkspace, and CustomerPortal
  const renderPortalView = () => {
    if (!currentUser || currentUser.role === 'user') {
      return <CustomerPortal />;
    }

    if (currentUser.role === 'technician') {
      return <TechnicianWorkspace />;
    }

    if (currentUser.role === 'admin') {
      if (viewRole === 'admin') {
        return <AdminControlCenter />;
      }
      if (viewRole === 'technician') {
        return <TechnicianWorkspace />;
      }
      return <CustomerPortal />;
    }

    return <CustomerPortal />;
  };

  return (
    <div className={`min-h-screen bg-[#f4f4f2] font-sans theme-${viewRole}`}>
      <div key={viewRole} className="min-h-screen calm-fade-slide">
        {renderPortalView()}
      </div>

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
