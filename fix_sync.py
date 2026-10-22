import re

file_service = 'src/lib/firestoreService.ts'
with open(file_service, 'r') as f:
    content = f.read()

content = content.replace(
    "export function subscribeToMessages(userRole: string | undefined, userId: string | undefined, tickets: any[], callback: (messages: TicketMessage[]) => void) {",
    "export function subscribeToMessages(userRole: string | undefined, userId: string | undefined, callback: (messages: TicketMessage[]) => void) {"
)
content = content.replace("} else if (userId && tickets.length > 0) {", "} else if (userId) {")

with open(file_service, 'w') as f:
    f.write(content)

file_context = 'src/context/AppContext.tsx'
with open(file_context, 'r') as f:
    content = f.read()

content = content.replace(
    "const unsubMessages = subscribeToMessages(currentUser?.role, currentUser?.id, tickets, (realMessages) => {",
    "const unsubMessages = subscribeToMessages(currentUser?.role, currentUser?.id, (realMessages) => {"
)
content = content.replace(
    "  }, []);\n\n  useEffect(() => {",
    "  }, [currentUser?.id, currentUser?.role]);\n\n  useEffect(() => {"
)

with open(file_context, 'w') as f:
    f.write(content)

