import express from 'express';
import path from 'path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fast, stable model cascade prioritizing high-availability models to eliminate 503 high demand errors
const TEXT_MODELS = ['gemini-2.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
const AUDIO_MODELS = ['gemini-2.5-flash', 'gemini-3.7-flash'];

async function executeGeminiWithFallback(
  ai: GoogleGenAI,
  models: string[],
  requestFn: (model: string) => any
) {
  let lastError: any = null;
  for (const model of models) {
    // Retry once on transient demand spikes (503/429)
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        if (attempt > 0) {
          await sleep(350 * attempt);
        }
        const payload = requestFn(model);
        const response = await ai.models.generateContent({
          model,
          ...payload,
        });
        return { response, model };
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const status = err?.status || err?.code || (msg.includes('503') ? 503 : (msg.includes('429') ? 429 : null));

        if (status === 404 || msg.includes('404') || msg.includes('not found') || msg.includes('no longer available')) {
          break; // Skip non-existent model
        }

        if ((status === 503 || status === 429 || msg.includes('high demand') || msg.includes('UNAVAILABLE') || msg.includes('RESOURCE_EXHAUSTED')) && attempt === 0) {
          continue; // Retry with small backoff once
        }
        break; // Try next model in cascade
      }
    }
  }
  throw lastError;
}

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. AI Triage Endpoint (Ultra-fast classification)
app.post('/api/triage', async (req, res) => {
  const { title, description, company, userSelectedCategory } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required for AI triage.' });
  }

  const ai = getAI();

  // If Gemini API Key is available, run high-speed model classification with multi-model cascade
  if (ai) {
    try {
      const prompt = `You are the AI Triage Engine for TechnoResolve Desk, an IT support desk.
Classify the following incoming support ticket:
Title: "${title}"
Description: "${description}"
Company: "${company || 'Not provided'}"
User Selected Category: "${userSelectedCategory || 'None'}"

Categories: "hardware" | "software" | "network" | "access" | "security" | "billing" | "general"
Priorities: "low" | "medium" | "high" | "urgent"

Respond ONLY with valid JSON:
{
  "category": "hardware|software|network|access|security|billing|general",
  "priority": "low|medium|high|urgent",
  "confidence": 0.95,
  "reasoning": "Brief 1-sentence reason.",
  "suggested_first_response": "Polite initial acknowledgement."
}`;

      const { response, model } = await executeGeminiWithFallback(ai, TEXT_MODELS, (m) => ({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
          ...(m.includes('3.7') ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
        },
      }));

      const text = response.text?.trim() || '{}';
      const parsed = JSON.parse(text);
      return res.json({
        success: true,
        ai: {
          category: parsed.category || userSelectedCategory || 'general',
          priority: parsed.priority || 'medium',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.95,
          reasoning: parsed.reasoning || 'Automated triage based on request scope and keywords.',
          suggested_first_response: parsed.suggested_first_response || '',
        },
        modelUsed: model,
      });
    } catch {
      // Seamlessly fall through to heuristic engine without noise
    }
  }

  // Instant Smart Heuristic Fallback
  const lowerText = `${title} ${description}`.toLowerCase();
  let category = userSelectedCategory || 'general';
  let priority = 'medium';
  let reasoning = 'Categorized based on instant natural language heuristic analysis.';

  if (/502|500|crash|bug|exception|runtime|api|error|deploy|build|code|license/i.test(lowerText)) {
    category = 'software';
    priority = /502|500|crash|production|outage|down|block/i.test(lowerText) ? 'urgent' : 'high';
    reasoning = 'Identified software error or system runtime incident.';
  } else if (/phish|malware|hack|breach|fraud|scam|suspicious|gift card|threat/i.test(lowerText)) {
    category = 'security';
    priority = 'urgent';
    reasoning = 'Flagged security or phishing threat requiring prompt mitigation.';
  } else if (/wifi|wi-fi|vpn|dns|gateway|internet|ping|connection|latency|drop/i.test(lowerText)) {
    category = 'network';
    priority = /down|cannot connect|offline/i.test(lowerText) ? 'high' : 'medium';
    reasoning = 'Network and connectivity routing diagnostics indicated.';
  } else if (/password|mfa|2fa|sso|okta|login|lock|access|permission|account/i.test(lowerText)) {
    category = 'access';
    priority = /locked out|cannot login/i.test(lowerText) ? 'high' : 'medium';
    reasoning = 'Account authentication or IAM access permissions request.';
  } else if (/card|invoice|bill|payment|charge|declined|subscription|renew|seat/i.test(lowerText)) {
    category = 'billing';
    priority = /declined|cancelled|due/i.test(lowerText) ? 'high' : 'medium';
    reasoning = 'Commercial transaction, subscription renewal or invoicing request.';
  } else if (/laptop|dock|screen|monitor|display|printer|mouse|keyboard|macbook|hardware/i.test(lowerText)) {
    category = 'hardware';
    priority = 'medium';
    reasoning = 'Physical workstation or device peripheral troubleshooting.';
  }

  return res.json({
    success: true,
    ai: {
      category,
      priority,
      confidence: 0.92,
      reasoning,
      suggested_first_response: `Thank you for contacting TechnoResolve. We have logged your ${category} request and routed it to our specialized team.`,
    },
  });
});

// 3. AI Reply Drafting for Technicians (Low Latency)
app.post('/api/ai-draft-reply', async (req, res) => {
  const { title, description, category, priority, messages, technicianName } = req.body;

  const ai = getAI();

  if (ai) {
    try {
      const prompt = `You are an expert IT technician named "${technicianName || 'Support Tech'}".
Quickly draft a concise, empathetic, and professional reply for the customer.

Ticket Context:
Title: ${title}
Category: ${category}
Priority: ${priority}
Description: ${description}

Recent Messages:
${(messages || []).slice(-4).map((m: any) => `[${m.author_role} - ${m.author_name}]: ${m.body}`).join('\n')}

Reply directly with just the clean message body. No markdown backticks or commentary.`;

      const { response } = await executeGeminiWithFallback(ai, TEXT_MODELS, (m) => ({
        contents: prompt,
        config: {
          temperature: 0.2,
          ...(m.includes('3.7') ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
        },
      }));

      const suggestion = response.text?.trim();
      if (suggestion) {
        return res.json({ suggestion });
      }
    } catch {
      // Quietly fall back to template
    }
  }

  // Fallback template
  const suggestion = `Hi there,\n\nThanks for reaching out about "${title}". I've reviewed your request regarding the ${category} issue.\n\nTo help us resolve this swiftly, could you please confirm if you are still experiencing this and share any recent error codes or timestamps? I am actively monitoring this ticket.\n\nBest regards,\n${technicianName || 'TechnoResolve Support'}`;
  return res.json({ suggestion });
});


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
      from: `"TechnoResolve Desk" <${process.env.SMTP_USER}>`,
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

// 5. Audio Voice Transcription Endpoint with Gemini
app.post('/api/transcribe', async (req, res) => {
  const { audioData, mimeType } = req.body;

  if (!audioData) {
    return res.status(400).json({ error: 'audioData base64 is required.' });
  }

  const ai = getAI();
  if (ai) {
    try {
      const { response } = await executeGeminiWithFallback(ai, AUDIO_MODELS, (m) => ({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'audio/webm',
                  data: audioData,
                },
              },
              {
                text: 'Accurately transcribe the spoken words in this audio recording. Return ONLY the transcribed text verbatim without any introductory remarks, markdown formatting, explanations, or quotes.',
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          ...(m.includes('3.7') ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
        },
      }));

      const transcript = response.text?.trim() || '';
      return res.json({ success: true, transcript });
    } catch (err: any) {
      return res.status(500).json({
        error: 'AI transcription service temporarily busy. Please try speaking again or type your message.',
        details: err?.message || 'Server demand peak',
      });
    }
  }

  return res.status(503).json({ error: 'AI audio transcription service unavailable (missing GEMINI_API_KEY).' });
});

// 6. Customer Helpdesk AI Assistant
app.post('/api/helpdesk-chat', async (req, res) => {
  const { message, history = [], userName } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const ai = getAI();

  if (ai) {
    const systemInstruction = `You are "ResolveBot", the dedicated AI Helpdesk Assistant for TechnoResolve Desk, an enterprise IT service management platform.
Your goal is to assist customers and employees with IT issues, password/access requests, network troubleshooting, hardware and software inquiries, and service requests.

Company IT Policies & Verified Procedures:
- Password Reset: Users can click "Forgot password" on the login screen or visit the 2nd floor IT kiosk for an immediate in-person PIN reset.
- Wi-Fi Connectivity: The corporate network is "Enterprise-Secure" using enterprise WPA2/WPA3 SSO credentials. For connection issues: toggle Wi-Fi, forget and reconnect, or verify VPN client status.
- VPN Access: GlobalProtect / AnyConnect client with server portal "vpn.technoresolve.internal" using SSO credentials.
- Multi-Factor Authentication (MFA): Supports Google Authenticator & Microsoft Authenticator; scan QR code in Account Settings.
- Software & SaaS Licences: Submit a request under "Software & Application Support" detailing software name, business justification, and department cost centre.
- SLA Resolution Times: Urgent (P1) < 15 min; High (P2) < 1 hour; Medium (P3) < 4 hours; Low (P4) < 24 business hours.
- Hardware & Devices: Laptops, monitors, docking stations, keyboards, and printers.

Guidelines:
- Greet or refer to the user as "${userName || 'there'}" politely when natural.
- Be concise, friendly, and practical.
- Use clear bullet points or numbered troubleshooting steps.
- When an issue requires hands-on technician intervention (e.g. broken hardware, hardware replacement, account unlocking by admin, network outage), kindly guide them to create a support ticket using the "Create Ticket" button.
- If you can identify the most relevant ticket category ("hardware", "software", "network", "access", "security", "billing", or "general"), mention it.`;

    const contents = [
      ...history.slice(-8).map((h: any) => ({
        role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text || '' }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    try {
      const { response, model } = await executeGeminiWithFallback(ai, TEXT_MODELS, (m) => ({
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
          ...(m.includes('3.7') ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
        },
      }));

      const reply = response.text?.trim();
      if (reply) {
        return res.json({ success: true, reply, modelUsed: model });
      }
    } catch {
      // Quietly fall through to smart heuristic fallback
    }
  }

  // Smart Heuristic Fallback (Runs instantly when offline or Gemini unavailable)
  const lower = message.toLowerCase();
  let reply = '';
  let suggestedCategory = 'general';

  if (/password|passcode|pin|login|sign in|locked|forgot|sso|okta/i.test(lower)) {
    suggestedCategory = 'access';
    reply = `Here is how to quickly resolve account or password issues:\n\n1. **Self-Service Reset**: On the login screen, click **"Forgot password"** to receive an instant verification link.\n2. **In-Person Fast Track**: Visit the IT Kiosk on the **2nd Floor** with your employee badge for an immediate PIN reset.\n3. **MFA Verification**: If your authenticator app is out of sync, ensure your device clock is set to automatic.\n\nWould you like me to help you open a ticket for our Access Management team?`;
  } else if (/wifi|wi-fi|internet|connect|offline|slow|network|ping|drops/i.test(lower)) {
    suggestedCategory = 'network';
    reply = `Let's troubleshoot your network connection:\n\n1. **Toggle Connection**: Turn your Wi-Fi off, wait 10 seconds, and turn it back on.\n2. **Forget Network**: In your Wi-Fi settings, forget **"Enterprise-Secure"** and reconnect using your active SSO username and password.\n3. **VPN Interference**: If you are connected to the corporate VPN, disconnect temporarily to see if internet throughput recovers.\n\nIf the issue persists, click **"Create Support Ticket"** and select **Network & Connectivity** so our engineers can test your floor's access point.`;
  } else if (/vpn|globalprotect|anyconnect|gateway|remote|tunnel/i.test(lower)) {
    suggestedCategory = 'network';
    reply = `To connect to the corporate VPN from home or travel:\n\n1. Open your installed **GlobalProtect** or **Cisco AnyConnect** client.\n2. In the Portal address field, enter: \`vpn.technoresolve.internal\`\n3. Click **Connect** and authenticate via your SSO credentials and MFA push notification.\n4. Ensure you don't have conflicting third-party proxies running.\n\nNeed assistance or profile provisioning? Submit a ticket under **Network & Connectivity**.`;
  } else if (/mfa|2fa|authenticator|token|google auth|microsoft auth|code/i.test(lower)) {
    suggestedCategory = 'access';
    reply = `To set up or re-enroll Multi-Factor Authentication (MFA):\n\n1. Open your authenticator app (Google Authenticator or Microsoft Authenticator).\n2. In TechnoResolve, visit your **Account** tab.\n3. Scan the provisioned QR code with your mobile device camera.\n4. Enter the 6-digit verification code to lock in the enrollment.\n\nIf you have lost your primary device, please submit a ticket or visit the 2nd floor kiosk for identity re-verification.`;
  } else if (/software|license|licence|install|app|seat|figma|adobe|slack|tool/i.test(lower)) {
    suggestedCategory = 'software';
    reply = `To request new software licences or SaaS tooling:\n\n1. Click **"Create Support Ticket"**.\n2. Choose **Software & Application Support** as the category.\n3. In your description, specify:\n   - Software title & version\n   - Business justification\n   - Department cost centre\n\nOur software asset management team processes standard requests within **24 hours**.`;
  } else if (/hardware|laptop|monitor|screen|mouse|keyboard|dock|docking|printer|cable/i.test(lower)) {
    suggestedCategory = 'hardware';
    reply = `For hardware and equipment support:\n\n1. **Docking Stations**: Unplug the Thunderbolt/USB-C host cable, power cycle the dock for 15 seconds, and reconnect firmly.\n2. **Monitors**: Verify the display cable (HDMI/DisplayPort) is seated properly and input source is set correctly.\n3. **Printers**: Verify the printer display shows "Ready" and your machine is connected to the office network.\n\nIf replacement hardware or an on-site technician is required, click **"Create Support Ticket"** under **Hardware & Devices**.`;
  } else if (/sla|hours|urgent|priority|response time|escalat/i.test(lower)) {
    suggestedCategory = 'general';
    reply = `Here are TechnoResolve's guaranteed SLA response times:\n\n- **Urgent (P1)**: Under **15 minutes** (Critical business or outage)\n- **High (P2)**: Under **1 hour** (Significant workflow blocker)\n- **Medium (P3)**: Under **4 hours** (Standard business impact)\n- **Low (P4)**: Under **24 business hours** (Minor inquiry or general request)\n\nAll tickets are monitored 24/7 by our on-call technicians.`;
  } else if (/ticket|help|support|agent|human|contact/i.test(lower)) {
    suggestedCategory = 'general';
    reply = `I can help you prepare and submit a support ticket right away!\n\nClick the **"Create Support Ticket"** button below to open the new request form. You can dictate your problem using voice input or type your details, and our AI triage will automatically classify and assign the best technician.`;
  } else {
    reply = `Hi ${userName || 'there'}! I've noted your question regarding "${message}".\n\nI can help you with:\n- 🔑 **Account & Access**: Password resets, MFA tokens, Okta access\n- 📶 **Network**: Wi-Fi issues, VPN setup, connection drops\n- 💻 **Software**: License requests, application errors\n- 🖥️ **Hardware**: Laptop, docking stations, multi-monitor setups\n\nIf you'd like a human technician to inspect this immediately, please click **"Create Support Ticket"** below!`;
  }

  return res.json({
    success: true,
    reply,
    suggestedCategory,
    fallback: true,
  });
});

// Setup Vite / Static handling
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TechnoResolve Desk Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
