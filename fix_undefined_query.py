import re

file_service = 'src/lib/firestoreService.ts'
with open(file_service, 'r') as f:
    content = f.read()

content = content.replace(
    "export function subscribeToTickets(userRole: string, userId: string, callback: (tickets: Ticket[]) => void) {",
    "export function subscribeToTickets(userRole: string | undefined, userId: string | undefined, callback: (tickets: Ticket[]) => void) {"
)

ticket_check = """
    let q;
    if (userRole === 'admin' || userRole === 'technician') {
       q = collection(db, COLLECTIONS.TICKETS);
    } else if (userId) {
       q = query(collection(db, COLLECTIONS.TICKETS), where('requester_id', '==', userId));
    } else {
       callback([]);
       return () => {};
    }
"""
content = re.sub(
    r"    let q;\n    if \(userRole === 'admin' \|\| userRole === 'technician'\) \{\n       q = collection\(db, COLLECTIONS\.TICKETS\);\n    \} else \{\n       q = query\(collection\(db, COLLECTIONS\.TICKETS\), where\('requester_id', '==', userId\)\);\n    \}",
    ticket_check.strip("\n"),
    content
)

with open(file_service, 'w') as f:
    f.write(content)

