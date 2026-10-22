import sys
import re

file_path = 'src/context/AppContext.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace signIn definition
pattern_signin = re.compile(r'  const signIn = async \(email: string, password\?: string\): Promise<boolean> => \{.*?return false;\n    \}\n  \};', re.DOTALL)
new_signin = """  const signIn = async (email: string, password?: string): Promise<boolean> => {
    if (!password || password.length < 6) {
      showToast('Password is required (min 6 chars).', 'error');
      return false;
    }

    const isDesignated = isDesignatedAdminEmail(email);

    try {
      const fbCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = fbCredential.user.uid;
      
      let existing = users.find((u) => u.id === uid || u.email.toLowerCase() === email.toLowerCase());
      
      // If user is designated admin but profile doesn't exist yet, automatically generate it
      if (!existing && isDesignated) {
        const adminUid = uid;
        existing = {
          id: adminUid,
          email: DESIGNATED_ADMIN_EMAIL,
          full_name: 'Philibane Awonke',
          company: 'TechnoResolve IT Administration',
          role: 'admin',
          is_approved: true,
          email_verified: true,
          banned: false,
          created_at: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, existing!]);
        saveUserToFirestore(existing);
      }

      if (existing) {
        if (existing.banned) {
          showToast('This account has been suspended by an administrator.', 'error');
          return false;
        }

        // If designated admin, ensure admin role and full approval
        if (isDesignated && (existing.role !== 'admin' || !existing.is_approved || !existing.email_verified)) {
          existing = {
            ...existing,
            role: 'admin',
            is_approved: true,
            email_verified: true,
          };
          setUsers((prev) => prev.map((u) => u.id === existing!.id ? existing! : u));
          updateUserInFirestore(existing.id, { role: 'admin', is_approved: true, email_verified: true });
        }
        
        setCurrentUser(existing);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, existing.id);
        setViewRoleState(existing.role);
        localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, existing.role);
        setActivePage('dashboard');
        
        if (!existing.email_verified && existing.role !== 'admin') {
           // They will be redirected to the email verification page by App.tsx
           return true; 
        }
        
        showToast(`Welcome back, ${existing.full_name}! (${existing.role.toUpperCase()})`, 'success');
        return true;
      } else {
        showToast('Invalid login credentials or account not registered.', 'error');
        return false;
      }
    } catch (err: any) {
      console.log('Sign in general notice:', err?.code, err?.message);
      if (err?.code === 'auth/operation-not-allowed') {
        showToast('Firebase Auth is disabled. Please enable Email/Password provider in the Firebase Console.', 'error');
      } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential' || err?.code === 'auth/wrong-password') {
        showToast('Login failed. Please verify your email and password.', 'error');
      } else {
        showToast(err?.message || 'Login failed. Please verify your credentials.', 'error');
      }
      return false;
    }
  };"""
content = pattern_signin.sub(new_signin, content)

# Replace signUp definition
pattern_signup = re.compile(r'  // Sign Up with First Admin Guarantee, Designated Admin Upgrade, Email Confirmation & Admin Approval requirement\n  const signUp = async \(data: \{.*?return true;\n  \};', re.DOTALL)
new_signup = """  // Sign Up with First Admin Guarantee, Designated Admin Upgrade, Email Confirmation & Admin Approval requirement
  const signUp = async (data: {
    email: string;
    password?: string;
    full_name: string;
    company?: string;
    role?: UserRole;
  }): Promise<boolean> => {
    if (!data.password || data.password.length < 6) {
      showToast('Password is required (min 6 chars).', 'error');
      return false;
    }
    
    const isDesignated = isDesignatedAdminEmail(data.email);
    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      // If designated admin already exists in record, upgrade to admin and sign in
      if (isDesignated) {
        const upgradedAdmin: UserProfile = {
          ...existing,
          role: 'admin',
          is_approved: true,
          email_verified: true,
        };
        setUsers((prev) => prev.map((u) => u.id === existing.id ? upgradedAdmin : u));
        await updateUserInFirestore(existing.id, { role: 'admin', is_approved: true, email_verified: true });
        setCurrentUser(upgradedAdmin);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, upgradedAdmin.id);
        setViewRoleState('admin');
        localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, 'admin');
        setActivePage('dashboard');
        showToast('👑 Welcome! Signed in as Administrator.', 'success');
        return true;
      }
      showToast('An account with this email already exists.', 'error');
      return false;
    }

    let uid = '';
    try {
      const fbCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      uid = fbCredential.user.uid;
    } catch (authErr: any) {
      console.log('Firebase Auth registration notice:', authErr?.code, authErr?.message);
      if (authErr?.code === 'auth/operation-not-allowed') {
        showToast('Firebase Auth is disabled. Please enable Email/Password provider in the Firebase Console.', 'error');
      } else if (authErr?.code === 'auth/email-already-in-use') {
        showToast('Email already in use. Please sign in instead.', 'error');
      } else {
        showToast(authErr?.message || 'Registration failed.', 'error');
      }
      return false; // MUST fail early. Do NOT proceed to write to Firestore with a fake UID!
    }

    const isFirstUser = users.length === 0;
    const assignedRole: UserRole = (isFirstUser || isDesignated) ? 'admin' : (data.role || 'user');
    const isAutoApproved = isFirstUser || isDesignated;
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const newUser: UserProfile = {
      id: uid,
      email: data.email.trim(),
      full_name: data.full_name,
      company: data.company || (isDesignated ? 'TechnoResolve IT Administration' : 'TechnoResolve Enterprise'),
      role: assignedRole,
      is_approved: isAutoApproved, // First user or designated admin is automatically approved
      email_verified: isAutoApproved, // Automatically verified for admin
      verification_code: isAutoApproved ? undefined : code,
      banned: false,
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    await saveUserToFirestore(newUser);

    if (!isAutoApproved) {
      // 1. Dispatch confirmation email to outbox
      const outItem: EmailOutboxItem = {
        id: `out-${Date.now()}`,
        to: data.email,
        subject: `[TechnoResolve] Action Required: Verify your email address - Code: ${code}`,
        template: 'email_verification',
        status: 'sent',
        created_at: new Date().toISOString(),
        payload: `Hi ${data.full_name},\n\nWelcome to TechnoResolve IT Service Desk!\n\nYour 6-digit email confirmation code is: ${code}\n\nOnce verified, an administrator will review and activate your account access.`,
      };
      setOutbox((prev) => [outItem, ...prev]);
      saveOutboxToFirestore(outItem);

      // 2. Dispatch approval notification to all Admins
      const adminNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        user_id: 'admin',
        title: 'New User Approval Required',
        message: `${data.full_name} (${data.email}) requested ${assignedRole.toUpperCase()} access and requires approval.`,
        type: 'approval',
        read: false,
        created_at: new Date().toISOString(),
        target_id: newUser.id,
        link_page: 'users',
      };
      setNotifications((prev) => [adminNotif, ...prev]);
      saveNotificationToFirestore(adminNotif);
    }

    setCurrentUser(newUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);
    setViewRoleState(assignedRole);
    localStorage.setItem(STORAGE_KEYS.VIEW_ROLE, assignedRole);
    setActivePage('dashboard');

    if (isAutoApproved) {
      showToast('👑 Welcome! Granted full Administrator access.', 'success');
    } else {
      showToast('Account created! Please check your email to verify your address.', 'success');
    }
    
    return true;
  };"""
content = pattern_signup.sub(new_signup, content)

with open(file_path, 'w') as f:
    f.write(content)
