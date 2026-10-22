import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(
    r"(  const sendMessage = async \(ticketId: string, body: string, internal: boolean = false, attachments: any\[\] = \[\]\) => \{\n)(    const newMsg: TicketMessage = \{\n      id: `msg-\$\{Date.now\(\)\}`,)"
)

repl = r"\1    const targetTicket = tickets.find((t) => t.id === ticketId);\n\2\n      ticket_requester_id: targetTicket?.requester_id || currentUser?.id || '',"

content = pattern.sub(repl, content)

# Remove the later `const targetTicket = ...` since we already defined it
content = content.replace("    const targetTicket = tickets.find((t) => t.id === ticketId);\n    if (targetTicket) {", "    if (targetTicket) {")

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)
