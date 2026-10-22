import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Ticket, TicketMessage, UserProfile, EmailOutboxItem, UserRole } from '../types';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth';


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

const COLLECTIONS = {
  USERS: 'users',
  TICKETS: 'tickets',
  MESSAGES: 'messages',
  OUTBOX: 'outbox',
  NOTIFICATIONS: 'notifications',
};

// Helper to deep clean undefined values from Firestore payloads
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Purge all documents from Firestore collections (clean slate)
export async function purgeAllFirestoreData(): Promise<void> {
  try {
    for (const colName of Object.values(COLLECTIONS)) {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
      }
    }
    console.log('🧹 Firestore database completely purged of all mock/previous data.');
  } catch (error) {
    console.warn('Error purging Firestore database:', error);
  }
}

// Check database initialization and clean previous mock records if needed
export async function initializeFirestoreDatabase(): Promise<void> {
  // Safe initialization - intentionally empty to prevent accidental data wipes
  // Legacy seeds were already handled in prior builds
}

// Check if any registered users exist
export async function getUsersCountFromFirestore(): Promise<number> {
  try {
    const usersCol = collection(db, COLLECTIONS.USERS);
    const userSnapshot = await getDocs(usersCol);
    return userSnapshot.size;
  } catch (error) {
    console.warn('Failed to query users count from Firestore:', error);
    return 0;
  }
}

// Subscribe to real-time Tickets

export function subscribeToTickets(userRole: string | undefined, userId: string | undefined, callback: (tickets: Ticket[]) => void) {
  try {
    let q;
    if (userRole === 'admin' || userRole === 'technician') {
       q = collection(db, COLLECTIONS.TICKETS);
    } else if (userId) {
       q = query(collection(db, COLLECTIONS.TICKETS), where('requester_id', '==', userId));
    } else {
       callback([]);
       return () => {};
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const items: Ticket[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Ticket);
        });
        // Sort descending by created_at
        items.sort(
          (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
        callback(items);
      },
      (error) => {
        console.warn('Tickets snapshot subscription error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to listen to tickets in Firestore:', err);
    return () => {};
  }
}

// Subscribe to real-time Messages
export function subscribeToMessages(userRole: string | undefined, userId: string | undefined, callback: (messages: TicketMessage[]) => void) {
  try {
    let q;
    if (userRole === 'admin' || userRole === 'technician') {
      q = collection(db, COLLECTIONS.MESSAGES);
    } else if (userId) {
      // For standard users, we only want messages for their tickets.
      // We will batch queries or just rely on a user_id on the message? 
      // Wait, messages don't have requester_id. They have ticket_id.
      // Firestore 'in' has a max of 10. Let's query by author_id? No, they need to see tech messages too.
      // If we don't have a secure way to query, let's query all their ticket IDs in chunks of 10.
      // For simplicity in this demo app, let's add a 'ticket_requester_id' or rely on the rule `allow list: if isAdmin() || (isSignedIn() && get(/databases/$(database)/documents/tickets/$(resource.data.ticket_id)).data.requester_id == request.auth.uid)`.
      // BUT get() is not allowed in `allow list`! "You are strictly forbidden from placing get() or exists() document lookups inside allow list blocks."
      // Therefore, the message MUST have a field `ticket_requester_id` for secure querying.
      // Since it doesn't currently, we'll let it be collection() and see what happens, or we'll add `ticket_requester_id` to messages.
      // Wait, let's update `messages` to have `ticket_requester_id` when created.
      q = query(collection(db, COLLECTIONS.MESSAGES), where('ticket_requester_id', '==', userId), where('internal', '==', false));
    } else {
      callback([]);
      return () => {};
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const items: TicketMessage[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as TicketMessage);
        });
        items.sort(
          (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
        );
        callback(items);
      },
      (error) => {
        console.warn('Messages snapshot subscription error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to listen to messages in Firestore:', err);
    return () => {};
  }
}

// Subscribe to real-time Users
export function subscribeToUsers(userId: string | undefined, callback: (users: UserProfile[]) => void) {
  try {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = collection(db, COLLECTIONS.USERS);
    return onSnapshot(
      q,
      (snapshot) => {
        const items: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as UserProfile);
        });
        callback(items);
      },
      (error) => {
        console.warn('Users snapshot subscription error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to listen to users in Firestore:', err);
    return () => {};
  }
}

// Save or Update Ticket in Firestore
export async function saveTicketToFirestore(ticket: Ticket): Promise<void> {
  try {
    const cleaned = cleanForFirestore(ticket);
    await setDoc(doc(db, COLLECTIONS.TICKETS, ticket.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'tickets');
  }
}

export async function updateTicketInFirestore(
  ticketId: string,
  updates: Partial<Ticket>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.TICKETS, ticketId);
    const cleaned = cleanForFirestore(updates);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'tickets');
  }
}

export async function deleteTicketFromFirestore(ticketId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.TICKETS, ticketId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'tickets');
  }
}

// Save Message in Firestore
export async function saveMessageToFirestore(message: TicketMessage): Promise<void> {
  try {
    const cleaned = cleanForFirestore(message);
    await setDoc(doc(db, COLLECTIONS.MESSAGES, message.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'messages');
  }
}

// Save User in Firestore
export async function saveUserToFirestore(user: UserProfile): Promise<void> {
  // Ensure Firebase Auth is active to comply with Firestore security rules
  if (!auth.currentUser) {
    return;
  }
  try {
    const cleaned = cleanForFirestore(user);
    await setDoc(doc(db, COLLECTIONS.USERS, user.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'users');
  }
}

export async function updateUserInFirestore(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  // Ensure Firebase Auth is active to comply with Firestore security rules
  if (!auth.currentUser) {
    return;
  }
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    const cleaned = cleanForFirestore(updates);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'users');
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'users');
  }
}

// Save Outbox Item in Firestore
export async function saveOutboxToFirestore(item: EmailOutboxItem): Promise<void> {
  try {
    const cleaned = cleanForFirestore(item);
    await setDoc(doc(db, COLLECTIONS.OUTBOX, item.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'outbox');
  }
}

// Subscribe to real-time Outbox
export function subscribeToOutbox(userRole: string | undefined, callback: (items: EmailOutboxItem[]) => void) {
  try {
    if (userRole !== 'admin') {
      callback([]);
      return () => {};
    }
    const q = collection(db, COLLECTIONS.OUTBOX);
    return onSnapshot(
      q,
      (snapshot) => {
        const items: EmailOutboxItem[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as EmailOutboxItem);
        });
        items.sort(
          (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
        callback(items);
      },
      (error) => {
        console.warn('Outbox snapshot subscription error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to listen to outbox in Firestore:', err);
    return () => {};
  }
}

// Subscribe to real-time Notifications
export function subscribeToNotifications(userRole: string | undefined, userId: string | undefined, callback: (notifications: any[]) => void) {
  try {
    let q;
    if (userRole === 'admin') {
      q = collection(db, COLLECTIONS.NOTIFICATIONS); // admins see all
    } else if (userId) {
      // A normal user sees their own notifications. 
      // The app also targets 'all', so we'd need an `in` query: where('user_id', 'in', [userId, 'all'])
      q = query(collection(db, COLLECTIONS.NOTIFICATIONS), where('user_id', 'in', [userId, 'all']));
    } else {
      callback([]);
      return () => {};
    }
    return onSnapshot(
      q,
      (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data());
        });
        items.sort(
          (a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        );
        callback(items);
      },
      (error) => {
        console.warn('Notifications snapshot subscription error:', error);
      }
    );
  } catch (err) {
    console.warn('Failed to listen to notifications in Firestore:', err);
    return () => {};
  }
}

// Save Notification in Firestore
export async function saveNotificationToFirestore(notif: any): Promise<void> {
  try {
    const cleaned = cleanForFirestore(notif);
    await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notif.id), cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'notifications');
  }
}

export async function updateNotificationInFirestore(id: string, updates: any): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.NOTIFICATIONS, id);
    const cleaned = cleanForFirestore(updates);
    await setDoc(docRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'notifications');
  }
}

