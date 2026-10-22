import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "export const isDesignatedAdminEmail = (email?: string | null): boolean => { return false; };",
    "export const DESIGNATED_ADMIN_EMAILS = ['tatiavumile@gmail.com'];\nexport const isDesignatedAdminEmail = (email?: string | null): boolean => {\n  if (!email) return false;\n  return DESIGNATED_ADMIN_EMAILS.includes(email.trim().toLowerCase());\n};"
)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)
