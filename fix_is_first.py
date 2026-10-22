import re

file_context = 'src/context/AppContext.tsx'
with open(file_context, 'r') as f:
    content = f.read()

# Fix signInWithGoogle
content = content.replace("const isFirstUser = users.length === 0;", "const count = await getUsersCountFromFirestore();\n      const isFirstUser = count === 0;")
content = content.replace("import { getUsersCountFromFirestore } from '../lib/firestoreService';", "")
content = content.replace(
    "import {\n  initializeFirestoreDatabase,",
    "import {\n  initializeFirestoreDatabase,\n  getUsersCountFromFirestore,"
)

with open(file_context, 'w') as f:
    f.write(content)

