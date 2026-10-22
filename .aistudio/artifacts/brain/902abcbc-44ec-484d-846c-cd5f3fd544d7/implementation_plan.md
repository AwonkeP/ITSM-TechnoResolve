# Strict Role-Based Portal Isolation Implementation Plan

## 1. Objective & Scope
Enforce strict role-based access control across **TechnoResolve Desk** so that **only Admins have access to all portals**, while **Technicians and Customers are locked exclusively to their own portals** and never see portal switching controls or other portal interfaces.

### Role Access Matrix
| Role | Accessible Portals | Portal Switcher (`RoleSwitcher`) | Ticket Data Scope |
| :--- | :--- | :--- | :--- |
| **Admin (`'admin'`)** | **Admin Control Center**, **Technician Workspace**, and **Customer Portal** | **Visible** — can switch between Admin, Technician, and Customer views at any time | Full access to all tickets, users, outbox, and audit logs across all views |
| **Technician (`'technician'`)** | **Technician Workspace only** | **Hidden (`null`)** — no portal switcher displayed | Access to all support queue tickets inside Technician Workspace to triage, claim, and resolve requests |
| **Customer (`'user'`)** | **Customer Portal only** | **Hidden (`null`)** — no portal switcher displayed | Access strictly limited to their own submitted tickets (`userId` / `requesterEmail`) |

---

## 2. Key Architectural Changes

### A. Portal Switcher Visibility (`src/components/RoleSwitcher.tsx`)
- Restrict `RoleSwitcher` rendering strictly to users with `currentUser?.role === 'admin'`.
- If `currentUser?.role !== 'admin'` (i.e., `'technician'`, `'user'`, or unauthenticated), return `null` immediately so neither Technicians nor Customers ever see buttons or labels for other portals.
- When an Admin is viewing the Customer Portal or Technician Workspace, the Admin-only `RoleSwitcher` remains available in the top header so the Admin can seamlessly switch back to the Admin Control Center or inspect any portal.

### B. State & Context Enforcement (`src/context/AppContext.tsx`)
- **`viewRole` Initialization & Synchronization**:
  - When `currentUser.role === 'user'`, lock `viewRole` strictly to `'user'`.
  - When `currentUser.role === 'technician'`, lock `viewRole` strictly to `'technician'`.
  - When `currentUser.role === 'admin'`, default `viewRole` to `'admin'` on sign-in while permitting transitions to `'technician'` or `'user'`.
- **`setViewRole` Guard**:
  - Update the guarded `setViewRole` handler so that:
    - If `currentUser.role !== 'admin'`, any attempt to change `viewRole` away from `currentUser.role` is blocked and forces `viewRole` back to `currentUser.role`.
    - Only `currentUser.role === 'admin'` can set `viewRole` to `'admin'`, `'technician'`, or `'user'`.

### C. Top-Level Portal Routing (`src/App.tsx`)
- Update `renderPortalView()` in `App.tsx` to enforce strict component isolation:
  - **Customer (`currentUser.role === 'user'`)**: Always render `<CustomerPortal />`.
  - **Technician (`currentUser.role === 'technician'`)**: Always render `<TechnicianWorkspace />`.
  - **Admin (`currentUser.role === 'admin'`)**: Render `<AdminControlCenter />`, `<TechnicianWorkspace />`, or `<CustomerPortal />` based on `viewRole`.
- Ensure the "Restricted Area" fallback is never accidentally triggered for Technicians or Customers by routing them directly to their designated portal.

### D. Header & Portal Clean-Up (`src/components/CustomerPortal.tsx` & `src/components/TechnicianWorkspace.tsx`)
- **Customer Portal (`src/components/CustomerPortal.tsx`)**:
  - Update the header condition from `(currentUser?.role === 'admin' || currentUser?.role === 'technician')` to `currentUser?.role === 'admin'` so only Admins inspecting the Customer Portal see the `RoleSwitcher`.
  - Maintain strict ticket filtering so non-admin users only see their own tickets.
- **Technician Workspace (`src/components/TechnicianWorkspace.tsx`)**:
  - Conditionally render `<RoleSwitcher />` in the workspace header only when `currentUser?.role === 'admin'`.
  - Keep full support queue access inside the Technician Workspace so Technicians can view, filter, claim, and resolve all support tickets without needing access to other portals.

---

## 3. Verification Checklist
- Verify that signing in as a **Customer** displays only the **Customer Portal**, with zero references to Admin or Technician portals and only the customer's own tickets visible.
- Verify that signing in as a **Technician** displays only the **Technician Workspace** with full support queue access, and zero portal-switching buttons or links to Customer or Admin portals.
- Verify that signing in as an **Admin** displays the **Admin Control Center** by default and includes the **RoleSwitcher** allowing the Admin to switch freely between Admin, Technician, and Customer portals.
- Run TypeScript compilation and linting checks (`compile_applet` and `lint_applet`) to confirm a clean build.
