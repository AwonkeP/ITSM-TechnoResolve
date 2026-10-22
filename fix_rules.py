import re

with open('firestore.rules', 'r') as f:
    content = f.read()

content = content.replace(
    "function isAdmin() {",
    "function isDesignatedAdmin() {\n      return isSignedIn() && request.auth.token.email != null && request.auth.token.email.lower() == 'tatiavumile@gmail.com';\n    }\n    function isAdmin() {"
)

content = content.replace(
    "isAdmin() || \n           (userId == request.auth.uid",
    "isAdmin() || isDesignatedAdmin() || \n           (userId == request.auth.uid"
)

with open('firestore.rules', 'w') as f:
    f.write(content)
