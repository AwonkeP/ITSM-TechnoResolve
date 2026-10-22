import admin from 'firebase-admin';
import fs from 'fs';

// Since we don't have a service account key JSON here directly... wait, do we?
// I can just try to delete the user directly via the REST API or Firestore directly?
// Actually, I can just use the provided Firebase applet config if it has admin privileges, but it doesn't.
