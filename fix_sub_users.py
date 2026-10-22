import re

file_service = 'src/lib/firestoreService.ts'
with open(file_service, 'r') as f:
    content = f.read()

content = content.replace(
    "export function subscribeToUsers(callback: (users: UserProfile[]) => void) {",
    "export function subscribeToUsers(userId: string | undefined, callback: (users: UserProfile[]) => void) {"
)

check = """  try {
    if (!userId) {
      callback([]);
      return () => {};
    }
    const q = collection(db, COLLECTIONS.USERS);"""

content = content.replace("  try {\n    const q = collection(db, COLLECTIONS.USERS);", check)

with open(file_service, 'w') as f:
    f.write(content)

file_context = 'src/context/AppContext.tsx'
with open(file_context, 'r') as f:
    content = f.read()

content = content.replace(
    "const unsubUsers = subscribeToUsers((realUsers) => {",
    "const unsubUsers = subscribeToUsers(currentUser?.id, (realUsers) => {"
)

with open(file_context, 'w') as f:
    f.write(content)

