import fs from 'fs';

let content = fs.readFileSync('server.ts', 'utf8');

const importStr = "import nodemailer from 'nodemailer';\n";
content = content.replace("import dotenv from 'dotenv';", importStr + "import dotenv from 'dotenv';");

const emailLogic = `
// 4. Email Endpoint
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text } = req.body;

  // We check if SMTP credentials are provided
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('Mock sending email (SMTP credentials missing in Environment Variables):', { to, subject, text });
    return res.json({ success: true, mocked: true });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: \`"TechnoResolve Desk" <\${process.env.SMTP_USER}>\`,
      to,
      subject,
      text,
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email: ' + err.message });
  }
});

`;

content = content.replace("// Setup Vite / Static handling", emailLogic + "// Setup Vite / Static handling");

fs.writeFileSync('server.ts', content);
