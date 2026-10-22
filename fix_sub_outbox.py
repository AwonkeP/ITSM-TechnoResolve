import re

file_service = 'src/lib/firestoreService.ts'
with open(file_service, 'r') as f:
    content = f.read()

content = content.replace(
    "export function subscribeToOutbox(callback: (items: EmailOutboxItem[]) => void) {",
    "export function subscribeToOutbox(userRole: string | undefined, callback: (items: EmailOutboxItem[]) => void) {"
)

check = """  try {
    if (userRole !== 'admin') {
      callback([]);
      return () => {};
    }
    const q = collection(db, COLLECTIONS.OUTBOX);"""

content = content.replace("  try {\n    const q = collection(db, COLLECTIONS.OUTBOX);", check)

with open(file_service, 'w') as f:
    f.write(content)

file_context = 'src/context/AppContext.tsx'
with open(file_context, 'r') as f:
    content = f.read()

content = content.replace(
    "const unsubOutbox = subscribeToOutbox((realOutbox) => {",
    "const unsubOutbox = subscribeToOutbox(currentUser?.role, (realOutbox) => {"
)

with open(file_context, 'w') as f:
    f.write(content)

