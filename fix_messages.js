import fs from 'fs';

let content = fs.readFileSync('src/lib/firestoreService.ts', 'utf8');
content = content.replace(
  "q = query(collection(db, COLLECTIONS.MESSAGES), where('ticket_requester_id', '==', userId));",
  "q = query(collection(db, COLLECTIONS.MESSAGES), where('ticket_requester_id', '==', userId), where('internal', '==', false));"
);

fs.writeFileSync('src/lib/firestoreService.ts', content);
