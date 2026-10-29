# ITSM-TechnoResolve

ITSM-TechnoResolve is an IT Service Management (ITSM) application designed to handle ticketing, user authentication, and system resolutions. The project is built using a modern TypeScript/Vite frontend and relies on Firebase/Firestore for its backend infrastructure.

## 🛠️ Tech Stack

*   **Frontend/Build Tool:** Vite, TypeScript (`vite.config.ts`, `tsconfig.json`)
*   **Backend/Database:** Firebase, Firestore (`firestore.rules`, `firebase-applet-config.json`)
*   **Server:** Node.js (`server.ts`)
*   **Admin/Migration Scripts:** Python & Node.js

## 📂 Repository Structure Highlights

*   `/src` & `/public`: Main application source code and public assets.
*   `.env.example`: Template for environment variables needed to run the app.
*   `firestore.rules`: Security rules for the Firebase Firestore database.
*   `server.ts`: The main server entry point.
*   **Utility & Fix Scripts:** The repository contains numerous scripts for database administration, testing, and state correction.
    *   *Python Scripts:* `fix_auth.py`, `fix_sync.py`, `fix_login.py`, etc.
    *   *JS Scripts:* `wipe_db.js`, `admin_delete.js`, `test_rules.js`, `check_db.js`.

## 🚀 Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   Python 3.x (if you plan to run the `.py` utility scripts)
*   A Firebase Account and Project setup.

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/AwonkeP/ITSM-TechnoResolve.git](https://github.com/AwonkeP/ITSM-TechnoResolve.git)
   cd ITSM-TechnoResolve
