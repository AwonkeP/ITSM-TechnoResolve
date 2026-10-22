import re

with open('src/context/AppContext.tsx', 'r') as f:
    content = f.read()

# Make isDesignatedAdminEmail return false always
content = re.sub(
    r"export const DESIGNATED_ADMIN_EMAIL.*?};",
    "export const isDesignatedAdminEmail = (email?: string | null): boolean => { return false; };",
    content,
    flags=re.DOTALL
)

with open('src/context/AppContext.tsx', 'w') as f:
    f.write(content)

