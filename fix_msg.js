import fs from 'fs';

let content = fs.readFileSync('src/components/EmailVerificationView.tsx', 'utf8');
content = content.replace(
  "setErrorMsg('Invalid code. Please verify the code sent to your email or check the outbox.');",
  "setErrorMsg('Invalid code. Please verify the code sent to your email.');"
);
fs.writeFileSync('src/components/EmailVerificationView.tsx', content);
