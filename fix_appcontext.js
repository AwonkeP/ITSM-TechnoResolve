import fs from 'fs';

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

// Update resendVerificationEmail
content = content.replace(
  "    setOutbox((prev) => [outItem, ...prev]);\n    saveOutboxToFirestore(outItem);",
  "    setOutbox((prev) => [outItem, ...prev]);\n    saveOutboxToFirestore(outItem);\n    // Send actual email via backend\n    fetch('/api/send-email', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ to: outItem.to, subject: outItem.subject, text: outItem.payload })\n    }).catch(console.error);"
);

// Update signUp
content = content.replace(
  "      setOutbox((prev) => [outItem, ...prev]);\n      saveOutboxToFirestore(outItem);",
  "      setOutbox((prev) => [outItem, ...prev]);\n      saveOutboxToFirestore(outItem);\n      // Send actual email via backend\n      fetch('/api/send-email', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ to: outItem.to, subject: outItem.subject, text: outItem.payload })\n      }).catch(console.error);"
);

fs.writeFileSync('src/context/AppContext.tsx', content);
