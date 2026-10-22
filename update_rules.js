const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  "    function isAdmin() {",
  "    function isDesignatedAdmin() {\n      return isSignedIn() && request.auth.token.email != null && request.auth.token.email.lower() == 'tatiavumile@gmail.com';\n    }\n    function isAdmin() {"
);

rules = rules.replace(
  "          isAdmin() || \n           (userId == request.auth.uid",
  "          isAdmin() || isDesignatedAdmin() || \n           (userId == request.auth.uid"
);

fs.writeFileSync('firestore.rules', rules);
