# Admin Security Audit Log & Configurable SLA Targets

This update introduces an immutable **Admin Security Audit Log** for tracking role assignments, account approvals, status changes, and policy updates, paired with **Admin-Configurable Custom SLA Targets** that power live SLA countdowns and compliance metrics across the Admin and Technician portals.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during clarification and govern this implementation:

- **Confirmed Feature Scope**: Implement the **Admin Security Audit Log** for role and user changes alongside **Custom SLA Targets configurable by the Admin**.
- **Custom SLA Policy Control**: Administrators can define custom resolution target hours for **Urgent**, **High**, **Medium**, and **Low** priority tickets (defaulting to Urgent: 2h, High: 4h, Medium: 8h, Low: 24h), with changes immediately reflected in Technician and Admin SLA timers and logged in the Security Audit Log.
- **Strict Portal Isolation & Calm Palette Preserved**: Only Administrators (`philibaneawonke@gmail.com` and explicitly promoted admins) can view the Security Audit Log or modify SLA targets. All interfaces preserve the calm Grey (`#f4f4f2`), White (`#ffffff`), Light Brown (`#8c6d53`), and Light Green (`#2f6b45`) palette.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Security Audit Log**: Automatically records a structured, timestamped audit trail whenever an administrator changes a user's role, approves or rejects a registration, suspends or restores an account, deletes a user, or updates SLA target thresholds, as well as when users update their profile details.
  2. **Configurable SLA Targets & Live SLA Tracking**: Provides an interactive SLA configuration panel in the Admin Control Center where administrators set target resolution hours per priority tier. Tickets across the Technician Workspace and Admin Control Center dynamically calculate remaining time and SLA compliance against these targets.
- **Target Audience / Persona**:
  - **System Administrators**: Need full visibility into who changed permissions or account statuses and the ability to tune SLA thresholds as support capacity evolves.
  - **Support Technicians**: Need clear, distraction-free SLA countdown indicators on active tickets to prioritize work before deadlines breach.
- **Key Value**: Strengthens access governance with complete accountability for role/user mutations while turning static SLA labels into real, configurable operational targets.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Inspecting & Exporting Security Audit Logs (Admin)**:
     - The Admin opens the **Security Audit** view in the Admin Control Center sidebar.
     - A summary strip displays total logged events, role modifications, approval decisions, and policy updates using animated tabular counters.
     - The Admin filters events by category (`All Events`, `Role Changes`, `Approvals & Access`, `Suspensions & Deletions`, `SLA Policy`) or searches by actor email, target user, or description, and can export the filtered audit trail to CSV with one click.
  2. **Configuring Custom SLA Target Thresholds (Admin)**:
     - In **System Settings** (or via the quick link in the Security Audit / Overview header), the Admin adjusts the target hours for **Urgent**, **High**, **Medium**, and **Low** priorities and clicks **Save SLA Targets** (or **Reset Defaults**).
     - Saving immediately recalculates SLA states across all open and resolved tickets, displays a calm confirmation toast, and appends a `SLA_POLICY_UPDATED` entry to the Security Audit Log.
  3. **Monitoring Live SLA Timers (Technician & Admin)**:
     - In the Technician Workspace queue and ticket inspector header, each ticket displays its live SLA status calculated from `created_at` (and `resolved_at` for completed tickets) against the active Admin SLA target for that ticket's priority.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Calm enterprise operations console with single-elevation surfaces (`1px solid #e2dfd9`), generous whitespace, and zero visual clutter.
  - *Color Palette & Mood*:
    - **60% Dominant Neutral Canvas**: Warm stone grey (`#f4f4f2`) and crisp white (`#ffffff`).
    - **30% Structural Surfaces**: Soft stone borders (`#e2dfd9`, `#ebe9e4`) and deep charcoal/stone typography (`#262523`, `#5c5954`).
    - **10% Accent Budget**: Light Brown (`#8c6d53` / `#f5efe8`) for primary actions, active filters, and approaching-SLA warnings; Light Green (`#2f6b45` / `#e6f4ea`) strictly for resolved states, nominal SLA compliance, and approved statuses.
  - *Typography & Hierarchy*: Clean sans-serif hierarchy paired with monospace tabular numerals (`font-mono tabular-nums`) for all timestamps, SLA countdowns, and audit IDs.
- **Interactive Feedback & Motion**:
  - Subtle fade-and-slide view transitions (`160ms–220ms`) when switching tabs or filtering audit entries, paired with tactile button press feedback (`triggerElementPop`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Automatic Context-Level Audit Capture**
  - *Chosen Approach*: Hook audit event creation directly into the state mutation handlers (`updateUserRole`, `approveUser`, `rejectUser`, `updateUserStatus`, `deleteUser`, `updateCurrentUserProfile`, and `updateSLAConfig`) inside the central application context.
  - *Why*: Guarantees that every role, status, or SLA change—regardless of which table or modal triggered it—produces a consistent audit record with actor identity, target identity, previous/new values, and ISO timestamp.
  - *Alternatives Considered*: Component-level logging inside individual buttons, which risks missing actions triggered from secondary views.
- **Decision 2: Dynamic SLA Evaluation Engine**
  - *Chosen Approach*: Store the Admin's custom SLA targets (`urgentHours`, `highHours`, `mediumHours`, `lowHours`) in reactive context state persisted to storage/Firestore, and evaluate ticket elapsed time dynamically (`On Track`, `At Risk` when $\ge 75\%$ of target elapsed, `Breached` when $> 100\%$ elapsed, or `Met SLA` / `Resolved Late` for closed tickets).
  - *Why*: Allows administrators to adjust SLA thresholds at any time and immediately see updated compliance percentages and countdowns without rewriting historical ticket timestamps.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       Central Application Context                       │
│  ┌───────────────────────────────┐   ┌───────────────────────────────┐  │
│  │   Security Audit Log Store    │   │   Custom SLA Policy Engine    │  │
│  │  • recordAuditEvent()         │   │  • slaConfig (Urgent..Low h)  │  │
│  │  • Role / Approval / Status   │   │  • updateSLAConfig()          │  │
│  │  • Profile & SLA Policy logs  │   │  • evaluateTicketSLA(ticket)  │  │
│  └───────────────┬───────────────┘   └───────────────┬───────────────┘  │
└──────────────────┼───────────────────────────────────┼──────────────────┘
                   │                                   │
         ┌─────────┴─────────┐               ┌─────────┴─────────┐
         ▼                   ▼               ▼                   ▼
┌─────────────────────────────────────┐ ┌─────────────────────────────────┐
│    Admin Control Center (Admin)     │ │  Technician Workspace (Tech)    │
│  • Security Audit Log View & Filter │ │  • Queue Card SLA Countdowns    │
│  • Audit CSV Exporter               │ │  • Inspector Header SLA Status  │
│  • Custom SLA Target Configurator   │ │  • Sidebar Live SLA Compliance  │
│  • Overview & Reports SLA Metrics   │ │                                 │
└─────────────────────────────────────┘ └─────────────────────────────────┘
```

- **Data Model & State**:
  - `SecurityAuditEntry`:
    - `id`: Unique identifier (`AUD-xxxx`)
    - `action`: `'ROLE_UPDATED' | 'USER_APPROVED' | 'USER_REJECTED' | 'USER_SUSPENDED' | 'USER_RESTORED' | 'USER_DELETED' | 'SLA_UPDATED' | 'PROFILE_UPDATED'`
    - `category`: `'role' | 'approval' | 'status' | 'policy' | 'profile'`
    - `actor_id`, `actor_name`, `actor_email`: The administrator or user who performed the action
    - `target_id`, `target_name`, `target_email`: The affected user or policy resource
    - `details`: Human-readable summary of the before/after state (e.g., `"Role changed from CUSTOMER to TECHNICIAN"`)
    - `metadata`: Optional structured before/after values
    - `created_at`: ISO timestamp
  - `SLAConfig`:
    - `urgent`: number (hours, default `2`)
    - `high`: number (hours, default `4`)
    - `medium`: number (hours, default `8`)
    - `low`: number (hours, default `24`)
    - `updated_at`: ISO timestamp
    - `updated_by`: Administrator email
- **Interactive Component & State Mapping**:
  - **Admin Security Audit View**: Supports category tab filtering, text search across actor/target/details, and one-click CSV download of the audit log.
  - **Admin System Settings (Custom SLA Panel)**: Numeric inputs for Urgent, High, Medium, and Low target hours (validated between `0.5` and `168` hours), a **Save SLA Targets** button that persists changes and logs an audit entry, and a **Reset to Defaults** button.
  - **Live SLA Evaluator**: Computes remaining hours/minutes and compliance percentage for every ticket in the Admin and Technician views using `tabular-nums` formatting.
