import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export interface EmailResult {
  success: boolean;
  simulated: boolean;
  provider?: 'Resend' | 'SMTP' | 'Ethereal' | 'Simulator';
  messageId?: string;
  previewUrl?: string;
  error?: string;
  diagnostic?: string;
  redirected?: boolean;
  redirectedTo?: string;
  originalTo?: string;
}

export interface PasswordResetEmailData {
  fullName: string;
  email: string;
  code: string;
  expiresMinutes: number;
}

export interface RegistrationVerificationEmailData {
  fullName: string;
  email: string;
  code: string;
  verificationUrl?: string;
  role?: string;
  expiresMinutes: number;
}

export interface UserEmailData {
  fullName: string;
  email: string;
  role?: string;
  documentType?: string;
  documentNumber?: string;
  phone?: string;
  city?: string;
  companyName?: string;
}

export interface SupportEmailData {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  companyName?: string;
}

export interface OrderEmailItem {
  id: string;
  name: string;
  unit?: string;
  presentation?: string;
  quantity: number;
  unitPriceCOP?: number;
  totalCOP: number;
  colorName?: string;
  colorHex?: string;
}

export interface OrderEmailData {
  id: string;
  sapOrderCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  deliveryAddress: string;
  deliveryCity: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  iva: number;
  shipping: number;
  total: number;
  status?: string;
  items: OrderEmailItem[];
}

export interface ProjectEmailData {
  id: string;
  clientName: string;
  clientEmail: string;
  surfaceType?: string;
  city?: string;
  status: string;
  previousStatus?: string;
  assignedAdvisor?: string;
  areaM2?: number;
  trackingNumber?: string;
  assignedCarrier?: string;
  comments?: string;
}

export interface EmailLogEntry {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  provider: 'Resend' | 'SMTP' | 'Ethereal' | 'Simulator';
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  diagnostic?: string;
  redirected?: boolean;
}

const emailLogs: EmailLogEntry[] = [];

export function getRecentEmailLogs(): EmailLogEntry[] {
  return [...emailLogs].reverse().slice(0, 20);
}

let detectedResendAccountEmail = (process.env.RESEND_ACCOUNT_EMAIL || process.env.RESEND_TEST_EMAIL || '').trim();
let cachedEtherealTransporter: Transporter | null = null;
let cachedEtherealUser: string | null = null;

/**
 * Checks Resend configuration status and detects placeholder dummy keys
 */
export function getResendStatus() {
  dotenv.config({ override: true });
  const rawKey = (process.env.RESEND_API_KEY || '').trim();
  const isDummy =
    rawKey === '' ||
    rawKey === 're_123456789_abcdefg' ||
    rawKey.startsWith('re_1234') ||
    rawKey === 'your_resend_api_key' ||
    rawKey.length < 25;
  const isConfigured = !isDummy && rawKey.startsWith('re_');
  const sender = getSenderAddress(true);
  const hasCustomDomain = Boolean(
    process.env.RESEND_FROM && !process.env.RESEND_FROM.includes('onboarding@resend.dev')
  );

  return {
    isConfigured,
    isDummy,
    rawKeyMasked: rawKey ? `${rawKey.slice(0, 6)}...${rawKey.slice(-4)}` : 'No configurada',
    sender,
    hasCustomDomain,
    note: isDummy
      ? "La variable RESEND_API_KEY contiene un valor de prueba/placeholder ('re_123456789_abcdefg')."
      : isConfigured && !hasCustomDomain
      ? "Usando 'onboarding@resend.dev' de Resend. En el plan gratuito, Resend restringe el envío al correo del desarrollador registrado en la cuenta. Las notificaciones se entregan con el prefijo [Para: ...] para que puedas probarlas en vivo."
      : "Configuración de Resend activa con dominio personalizado verificado.",
  };
}

export interface SmtpStatusData {
  isConfigured: boolean;
  isGmail: boolean;
  service?: string;
  userMasked: string;
  sender: string;
  host: string;
  port: number | string;
  note: string;
}

/**
 * Checks SMTP configuration status (Gmail, Brevo, Outlook, Custom)
 */
export function getSmtpStatus(): SmtpStatusData {
  dotenv.config({ override: true });
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const host = (process.env.SMTP_HOST || '').trim();
  const service = (process.env.SMTP_SERVICE || '').trim().toLowerCase();

  const isGmail = service === 'gmail' || host.includes('gmail') || user.includes('@gmail.com');
  const isConfigured = Boolean(user && pass && (host || isGmail));
  const sender = getSenderAddress(false);

  return {
    isConfigured,
    isGmail,
    service: isGmail ? 'gmail' : (host || undefined),
    userMasked: user ? `${user.slice(0, 3)}***@${user.split('@')[1] || 'mail.com'}` : 'No configurado',
    sender,
    host: isGmail ? 'smtp.gmail.com' : host || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || (process.env.SMTP_SECURE === 'true' ? 465 : 587),
    note: isConfigured
      ? `Servicio SMTP activo (${isGmail ? 'Gmail' : host}). ¡Puede enviar correos a CUALQUIER email del mundo sin restricciones de dominio!`
      : 'SMTP no configurado. Para enviar a cualquier email (Hotmail, Outlook, Yahoo, empresas) sin tener que comprar un dominio, configura tu cuenta de Gmail con una Contraseña de Aplicación en el archivo .env.',
  };
}

/**
 * Fallback: Creates the Nodemailer transport from environment variables or returns null if not configured
 */
export function getEmailTransporter() {
  dotenv.config({ override: true });
  const user = (process.env.SMTP_USER || '').trim();
  const rawPass = (process.env.SMTP_PASS || '').trim();
  const host = (process.env.SMTP_HOST || '').trim();
  const service = (process.env.SMTP_SERVICE || '').trim().toLowerCase();

  if (!user || !rawPass) {
    return null;
  }

  const isGmail = service === 'gmail' || host.includes('gmail') || user.includes('@gmail.com');
  // Strip spaces from Gmail App Passwords if user pasted them with spaces
  const pass = isGmail ? rawPass.replace(/\s+/g, '') : rawPass;

  // Gmail direct service shortcut or detected gmail address
  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      connectionTimeout: 6000,
      greetingTimeout: 4000,
      socketTimeout: 8000,
    });
  }

  // Standard generic SMTP host
  if (host) {
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 6000,
      greetingTimeout: 4000,
      socketTimeout: 8000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return null;
}

async function getEtherealTransporter(): Promise<{ transporter: Transporter; user: string } | null> {
  if (cachedEtherealTransporter && cachedEtherealUser) {
    return { transporter: cachedEtherealTransporter, user: cachedEtherealUser };
  }
  try {
    const testAccount = await Promise.race([
      nodemailer.createTestAccount(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Ethereal timeout')), 4500)
      ),
    ]);
    cachedEtherealTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      connectionTimeout: 5000,
      greetingTimeout: 4000,
      socketTimeout: 7000,
    });
    cachedEtherealUser = testAccount.user;
    console.log(`📧 [ETHEREAL SMTP READY] Buzón de pruebas creado: ${testAccount.user}`);
    return { transporter: cachedEtherealTransporter, user: cachedEtherealUser };
  } catch (err: any) {
    console.warn('⚠️ [ETHEREAL NOTICE] No se pudo inicializar buzón Ethereal:', err.message);
    return null;
  }
}

function getSenderAddress(isResend: boolean = false): string {
  if (isResend) {
    if (process.env.RESEND_FROM && process.env.RESEND_FROM.trim() !== '') {
      return process.env.RESEND_FROM.trim();
    }
    return 'ColorLink Pintuco <onboarding@resend.dev>';
  }

  if (process.env.SMTP_FROM && process.env.SMTP_FROM.trim() !== '') {
    return process.env.SMTP_FROM.trim();
  }
  if (process.env.SMTP_USER && process.env.SMTP_USER.trim() !== '') {
    return `ColorLink Pintuco <${process.env.SMTP_USER.trim()}>`;
  }
  return 'ColorLink Pintuco <notificaciones@pintuco.com>';
}

function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Universal email sender that supports ANY recipient email address:
 * 1. If SMTP (Gmail / Brevo / Custom) is configured -> sends directly to ANY recipient email on Earth without domain restrictions.
 * 2. If Resend has a verified custom domain -> sends directly to ANY recipient.
 * 3. If Resend is on free sandbox (onboarding@resend.dev):
 *    - If sent to the developer's account email, sends directly.
 *    - If sent to an external client email, delivers to the developer's inbox with clear header "[Para: cliente@...]" and explanation banner so no email is ever lost!
 * 4. Fallback: Simulation mode with clean logging.
 */
async function sendOrSimulateEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<EmailResult> {
  const resendStatus = getResendStatus();
  const smtpStatus = getSmtpStatus();
  const accountEmail = (process.env.RESEND_ACCOUNT_EMAIL || process.env.RESEND_TEST_EMAIL || '').trim();
  const normalizedTarget = options.to.trim().toLowerCase();
  const isTargetAccountOwner = Boolean(accountEmail && normalizedTarget === accountEmail.toLowerCase());

  // 1. PRIMARY FOR ANY EMAIL: Standard SMTP (Gmail, Brevo, Outlook, etc.)
  if (smtpStatus.isConfigured) {
    const transporter = getEmailTransporter();
    if (transporter) {
      try {
        const fromAddress = getSenderAddress(false);
        const info = await transporter.sendMail({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.subject,
        });

        console.log(`✅ [SMTP EMAIL SENT TO ANY RECIPIENT] Enviado con éxito a ${options.to} con ID: ${info.messageId}`);
        const logEntry: EmailLogEntry = {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          to: options.to,
          subject: options.subject,
          provider: 'SMTP',
          success: true,
          messageId: info.messageId,
          diagnostic: `Entregado exitosamente a ${options.to} vía SMTP (${smtpStatus.isGmail ? 'Gmail' : smtpStatus.host}).`,
        };
        emailLogs.push(logEntry);

        return {
          success: true,
          simulated: false,
          provider: 'SMTP',
          messageId: info.messageId,
          diagnostic: `Correo enviado a ${options.to} mediante SMTP`,
        };
      } catch (err: any) {
        console.error(`❌ [SMTP ERROR] Error enviando a ${options.to}:`, err.message);
        emailLogs.push({
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString(),
          to: options.to,
          subject: options.subject,
          provider: 'SMTP',
          success: false,
          error: err.message,
          diagnostic: `Fallo en SMTP (${smtpStatus.isGmail ? 'Gmail' : smtpStatus.host}): ${err.message}`,
        });
      }
    }
  }

  // 2. RESEND INTEGRATION
  if (resendStatus.isConfigured) {
    const resend = new Resend(process.env.RESEND_API_KEY!.trim());
    const fromAddress = getSenderAddress(true);

    // Try direct delivery first (works for custom verified domain, or if target IS the Resend account owner, or reveals owner email)
    if (resendStatus.hasCustomDomain || isTargetAccountOwner || !detectedResendAccountEmail) {
      try {
        const response = await resend.emails.send({
          from: fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || options.subject,
        });

        if (!response.error) {
          console.log(`✅ [RESEND EMAIL SENT] Correo entregado a ${options.to} con ID: ${response.data?.id}`);
          const logEntry: EmailLogEntry = {
            id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            to: options.to,
            subject: options.subject,
            provider: 'Resend',
            success: true,
            messageId: response.data?.id,
            diagnostic: `Entregado vía Resend API a ${options.to}.`,
          };
          emailLogs.push(logEntry);

          return {
            success: true,
            simulated: false,
            provider: 'Resend',
            messageId: response.data?.id,
            diagnostic: `Correo enviado a ${options.to} vía Resend`,
          };
        } else {
          console.warn(`⚠️ [RESEND NOTICE] ${response.error.message}`);
          if (response.error.message.includes('only send testing emails')) {
            const match = response.error.message.match(/\(([^)]+@[^)]+)\)/);
            if (match && match[1]) {
              detectedResendAccountEmail = match[1].trim();
            }
          }
        }
      } catch (err: any) {
        console.warn(`⚠️ [RESEND EXCEPTION] ${err.message}`);
      }
    }

    // Case B: Resend Free Sandbox (onboarding@resend.dev) relay to detected/configured owner email
    const targetRelay = (detectedResendAccountEmail || accountEmail).trim();
    if (targetRelay) {
      try {
        const sandboxBanner = `
          <div style="background:#fef9c3;border-bottom:2px solid #eab308;padding:10px 16px;font-family:sans-serif;font-size:12px;color:#713f12;text-align:center;">
            <strong>Modo Sandbox Resend:</strong> Destinatario original: <strong>${options.to}</strong> (configura SMTP Gmail o un dominio verificado para entregar directo al cliente).
          </div>
        `;

        const modifiedHtml = options.html.includes('<body>')
          ? options.html.replace('<body>', `<body>${sandboxBanner}`)
          : `${sandboxBanner}${options.html}`;

        const modifiedSubject = `[Para: ${options.to}] ${options.subject}`;

        const relayResponse = await resend.emails.send({
          from: fromAddress,
          to: targetRelay,
          subject: modifiedSubject,
          html: modifiedHtml,
          text: `[Destinatario original: ${options.to}]\n\n${options.text || options.subject}`,
        });

        if (relayResponse.data?.id) {
          console.log(`✅ [RESEND SANDBOX RELAY] Notificación para ${options.to} entregada con éxito a ${targetRelay} con ID: ${relayResponse.data.id}`);
          const logEntry: EmailLogEntry = {
            id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            to: options.to,
            subject: options.subject,
            provider: 'Resend',
            success: true,
            messageId: relayResponse.data.id,
            redirected: true,
            diagnostic: `Entregado vía Resend Sandbox (destinatario original: ${options.to}).`,
          };
          emailLogs.push(logEntry);

          return {
            success: true,
            simulated: false,
            provider: 'Resend',
            messageId: relayResponse.data.id,
            redirected: true,
            redirectedTo: targetRelay,
            originalTo: options.to,
            diagnostic: `Notificación entregada vía Resend Sandbox (destinatario original: ${options.to}).`,
          };
        }
      } catch (relayErr: any) {
        console.error(`❌ [RESEND RELAY ERROR]`, relayErr.message);
      }
    }
  }

  // 3. ZERO-CONFIG REAL SMTP FALLBACK: Ethereal Test Mailer (real SMTP transmission + inspectable preview URL)
  const ethereal = await getEtherealTransporter();
  if (ethereal) {
    try {
      const info = await ethereal.transporter.sendMail({
        from: `ColorLink Pintuco <${ethereal.user}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      });
      const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      console.log(`✅ [ETHEREAL SMTP SENT] Para: ${options.to} | Asunto: ${options.subject} | Preview: ${previewUrl}`);

      const logEntry: EmailLogEntry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toISOString(),
        to: options.to,
        subject: options.subject,
        provider: 'Ethereal',
        success: true,
        messageId: info.messageId,
        previewUrl,
        diagnostic: `Correo enviado por SMTP de pruebas Ethereal a ${options.to}. Abre el enlace de vista previa para inspeccionar el correo real.`,
      };
      emailLogs.push(logEntry);

      return {
        success: true,
        simulated: false,
        provider: 'Ethereal',
        messageId: info.messageId,
        previewUrl,
        diagnostic: `Correo enviado por SMTP Ethereal (vista previa disponible). Para entrega en bandeja real, configura SMTP_USER y SMTP_PASS en .env.`,
      };
    } catch (etherealErr: any) {
      console.warn('⚠️ [ETHEREAL SEND NOTICE]:', etherealErr.message);
    }
  }

  // 4. LAST RESORT FALLBACK: Local Simulation Mode
  console.log('\n========================================================');
  console.log('📨 [EMAIL SIMULATOR - ColorLink Pintuco Notification]');
  console.log(`Para: ${options.to}`);
  console.log(`Asunto: ${options.subject}`);
  console.log(`Estado: Modo Simulación`);
  console.log('========================================================\n');

  const logEntry: EmailLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    to: options.to,
    subject: options.subject,
    provider: 'Simulator',
    success: true,
    messageId: `sim-${Date.now()}`,
    diagnostic: 'Registrado en simulador local (configura SMTP o Resend para entrega real).',
  };
  emailLogs.push(logEntry);

  return {
    success: true,
    simulated: true,
    provider: 'Simulator',
    messageId: logEntry.messageId,
    diagnostic: 'Correo registrado en simulador local.',
  };
}


/**
 * 1. Welcome Email upon registration
 */
export async function sendWelcomeEmail(user: UserEmailData): Promise<EmailResult> {
  const subject = `¡Bienvenido a ColorLink Pintuco, ${user.fullName}! 🎨`;
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #1f2937; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #0d4788 0%, #173663 100%); padding: 32px 24px; text-align: center; }
    .badge { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .brand-title { color: #ffffff; font-size: 26px; font-weight: 900; margin: 0; letter-spacing: -0.5px; }
    .brand-subtitle { color: #e2e8f0; font-size: 14px; margin: 6px 0 0 0; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 700; color: #0d4788; margin-bottom: 16px; }
    .info-card { background-color: #f8fafc; border-left: 4px solid #ffd100; border-radius: 8px; padding: 18px 20px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px dashed #e2e8f0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #64748b; font-weight: 600; }
    .info-val { color: #0f172a; font-weight: 700; text-align: right; }
    .features-list { margin: 20px 0; padding-left: 20px; }
    .features-list li { margin-bottom: 10px; font-size: 14px; color: #334155; }
    .cta-container { text-align: center; margin: 32px 0 16px 0; }
    .cta-button { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 900; font-size: 15px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 12px rgba(255, 209, 0, 0.4); text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .footer a { color: #0d4788; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Ecosistema Profesional Pintuco®</span>
      <h1 class="brand-title">ColorLink Pintuco</h1>
      <p class="brand-subtitle">Plataforma de Diagnóstico con IA y Suministro Técnico Directo</p>
    </div>

    <div class="content">
      <div class="greeting">¡Hola, ${user.fullName}!</div>
      <p>Nos complace darte la bienvenida a <strong>ColorLink Pintuco</strong>. Tu cuenta profesional ha sido creada y validada satisfactoriamente en nuestro sistema central.</p>

      <div class="info-card">
        <div style="font-size: 12px; font-weight: 800; color: #0d4788; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">
          Resumen de tu Perfil Registrado
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Nombre Completo:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; text-align: right; font-weight: 600;">${user.fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Correo Electrónico:</strong></td>
            <td style="padding: 6px 0; color: #0d4788; text-align: right; font-weight: 600;">${user.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Rol en el Ecosistema:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; text-align: right; font-weight: 600;">${user.role || 'Constructora / Arquitecto'}</td>
          </tr>
          ${user.companyName ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Empresa / Razón Social:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; text-align: right; font-weight: 600;">${user.companyName}</td>
          </tr>` : ''}
          ${user.documentNumber ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Documento / NIT:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; text-align: right; font-weight: 600;">${user.documentType || 'NIT'} ${user.documentNumber}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Ciudad Principal:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; text-align: right; font-weight: 600;">${user.city || 'Bogotá, Colombia'}</td>
          </tr>
        </table>
      </div>

      <p>A partir de este momento puedes acceder a todas las capacidades de la plataforma:</p>
      <ul class="features-list">
        <li><strong>Diagnóstico de Superficies con IA Gemini:</strong> Detección automática de patologías, cálculo de manos de pintura y dosificación exacta por m².</li>
        <li><strong>Simulador Tintométrico y Color Wheel:</strong> Personalización de más de 2.000 tonos en catálogo corporativo Pintuco.</li>
        <li><strong>Ruta Técnica de Producción:</strong> Seguimiento en tiempo real desde la reserva de base en SAP hasta el tinturado Giotto y entrega en obra.</li>
        <li><strong>Tienda Directa con Descuentos Corporativos:</strong> Insumos oficiales despachados directamente desde nuestras plantas de Rionegro, Calle 80 y Yumbo.</li>
      </ul>

      <div class="cta-container">
        <a href="${process.env.APP_URL || 'https://colorlink.onrender.com'}" class="cta-button">Ingresar a ColorLink</a>
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 24px;">
        ¿Tienes dudas o necesitas acompañamiento en obra? Nuestros ingenieros y especialistas técnicos están a tu disposición.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 8px 0; font-weight: bold; color: #0d4788;">Pintuco Colombia S.A.S. • ColorLink Pro</p>
      <p style="margin: 0 0 8px 0;">Línea Técnica Nacional: 01 8000 111 247 | Medellín: (604) 378 8000 | Bogotá: (601) 307 8000</p>
      <p style="margin: 0;">Este es un mensaje automático de confirmación generado por el ecosistema Pintuco ColorLink.</p>
    </div>
  </div>
</body>
</html>
`;

  return sendOrSimulateEmail({
    to: user.email,
    subject,
    html,
  });
}

/**
 * 2. Purchase Confirmation & Invoice Email upon direct store order
 */
export async function sendInvoiceEmail(order: OrderEmailData): Promise<EmailResult> {
  const subject = `Factura y Confirmación de Compra Pintuco #${order.sapOrderCode} 🧾`;

  const itemsRows = (order.items || [])
    .map(
      (item, idx) => `
      <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 14px; font-size: 13px; color: #0f172a; vertical-align: top;">
          <strong>${item.name}</strong>
          ${item.colorName ? `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Tono: <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${item.colorHex || '#ccc'}; margin-right:4px; vertical-align:middle;"></span>${item.colorName}</div>` : ''}
        </td>
        <td style="padding: 12px 14px; font-size: 13px; color: #475569; text-align: center; vertical-align: top;">
          ${item.quantity} ${item.presentation || item.unit || 'Gal'}
        </td>
        <td style="padding: 12px 14px; font-size: 13px; color: #0f172a; text-align: right; font-weight: 600; vertical-align: top;">
          ${formatCOP(item.totalCOP)}
        </td>
      </tr>
    `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #1f2937; }
    .container { max-width: 650px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #0d4788 0%, #173663 100%); padding: 32px 24px; text-align: center; }
    .badge { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .brand-title { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; }
    .order-number { color: #ffd100; font-family: monospace; font-size: 16px; font-weight: 700; margin-top: 6px; }
    .content { padding: 30px 28px; line-height: 1.6; }
    .section-title { font-size: 14px; font-weight: 800; color: #0d4788; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; border-bottom: 2px solid #ffd100; padding-bottom: 4px; display: inline-block; }
    .table-container { width: 100%; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin: 16px 0; }
    .totals-table { width: 100%; max-width: 280px; margin-left: auto; border-collapse: collapse; margin-top: 16px; }
    .totals-table td { padding: 5px 8px; font-size: 13px; }
    .highlight-card { background: #fefce8; border: 1px solid #fef08a; border-radius: 10px; padding: 14px 18px; margin: 24px 0; font-size: 13px; color: #854d0e; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Facturación Electrónica DIAN</span>
      <h1 class="brand-title">Confirmación de Compra Pintuco</h1>
      <div class="order-number">Orden SAP: ${order.sapOrderCode}</div>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #0f172a; margin-top: 0;">
        Estimado/a <strong>${order.customerName}</strong>,
      </p>
      <p style="color: #475569; font-size: 14px;">
        Hemos recibido y procesado exitosamente tu orden de compra en la Tienda Oficial ColorLink Pintuco. A continuación encuentras la remisión y factura detallada de tu pedido.
      </p>

      <div style="background-color: #f8fafc; border-radius: 10px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b;"><strong>Fecha de Emisión:</strong></td>
            <td style="padding: 4px 0; color: #0f172a; text-align: right;">${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;"><strong>Método de Pago:</strong></td>
            <td style="padding: 4px 0; color: #0f172a; text-align: right; font-weight: 600;">${order.paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;"><strong>Dirección de Entrega:</strong></td>
            <td style="padding: 4px 0; color: #0f172a; text-align: right;">${order.deliveryAddress}, ${order.deliveryCity}</td>
          </tr>
          ${order.customerPhone ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b;"><strong>Teléfono de Contacto:</strong></td>
            <td style="padding: 4px 0; color: #0f172a; text-align: right;">${order.customerPhone}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 4px 0; color: #64748b;"><strong>Estado del Pedido:</strong></td>
            <td style="padding: 4px 0; color: #15803d; text-align: right; font-weight: 700;">✅ ${order.status || 'Pagado y Confirmado'}</td>
          </tr>
        </table>
      </div>

      <span class="section-title">Detalle de Insumos y Pinturas</span>

      <table class="table-container" style="border-collapse: collapse;">
        <thead>
          <tr style="background-color: #0d4788; color: #ffffff; text-align: left; font-size: 12px; text-transform: uppercase;">
            <th style="padding: 10px 14px;">Producto</th>
            <th style="padding: 10px 14px; text-align: center;">Cantidad</th>
            <th style="padding: 10px 14px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Resumen Liquidación -->
      <table class="totals-table">
        <tr>
          <td style="color: #64748b;">Subtotal:</td>
          <td style="text-align: right; font-weight: 600;">${formatCOP(order.subtotal)}</td>
        </tr>
        ${order.discount > 0 ? `
        <tr>
          <td style="color: #16a34a;">Descuento ColorLink (5%):</td>
          <td style="text-align: right; font-weight: 600; color: #16a34a;">-${formatCOP(order.discount)}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #64748b;">IVA (19%):</td>
          <td style="text-align: right; font-weight: 600;">${formatCOP(order.iva)}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Flete / Despacho:</td>
          <td style="text-align: right; font-weight: 600; color: ${order.shipping === 0 ? '#16a34a' : '#0f172a'};">
            ${order.shipping === 0 ? '¡GRATIS!' : formatCOP(order.shipping)}
          </td>
        </tr>
        <tr style="border-top: 2px solid #0d4788;">
          <td style="font-size: 15px; font-weight: 900; color: #0d4788; padding-top: 8px;">TOTAL PAGADO:</td>
          <td style="font-size: 16px; font-weight: 900; color: #0d4788; text-align: right; padding-top: 8px;">
            ${formatCOP(order.total)}
          </td>
        </tr>
      </table>

      <div class="highlight-card">
        <strong>🛡️ Garantía Oficial Pintuco:</strong> Todos los productos incluidos en esta orden cuentan con certificado de calidad ASTM y garantía de hasta 5 años en cubrimiento y adherencia bajo correcta preparación de superficie.
      </div>

      <p style="font-size: 13px; color: #64748b; text-align: center;">
        Tu pedido ha ingresado a la cola de preparación en nuestro Centro Logístico. En breve recibirás la guía de transporte con la placa del vehículo asignado.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0; font-weight: bold; color: #0d4788;">Pintuco Colombia S.A.S. • NIT: 890.900.120-1</p>
      <p style="margin: 0 0 6px 0;">Factura electrónica generada bajo estándares de la DIAN. Documento equivalente.</p>
      <p style="margin: 0;">Soporte de despacho: 01 8000 111 247 | despacho@pintuco.com</p>
    </div>
  </div>
</body>
</html>
`;

  return sendOrSimulateEmail({
    to: order.customerEmail,
    subject,
    html,
  });
}

/**
 * 3. Status Update Notification Email for Project Technical Route
 */
export async function sendProjectStatusEmail(data: ProjectEmailData): Promise<EmailResult> {
  const subject = `Actualización de Proyecto #${data.id}: Estado [${data.status}] 🚀`;

  const statusDescriptions: Record<string, { desc: string; icon: string; action: string }> = {
    'Registrada': {
      desc: 'Tu solicitud técnica ha sido radicada correctamente en el sistema ColorLink. El equipo de ingeniería Pintuco está revisando las especificaciones del sustrato.',
      icon: '📋',
      action: 'Revisión técnica de sustrato en proceso',
    },
    'Analizada por IA': {
      desc: 'El modelo de visión e ingeniería con IA Gemini ha diagnosticado la porosidad, humedad y textura de la superficie. La formulación recomendada está calculada.',
      icon: '🤖',
      action: 'Diagnóstico computacional completado',
    },
    'Cotizada': {
      desc: 'La cotización técnica y selección de color han sido aprobadas por el asesor. Puedes verificar la paleta formulada y la cantidad de manos recomendadas.',
      icon: '🎨',
      action: 'Especificación y cotización lista para autorización',
    },
    'Inventario Asignado': {
      desc: 'Las bases tintométricas y materias primas han sido bloqueadas y reservadas en el sistema SAP del Centro de Distribución.',
      icon: '📦',
      action: 'Reserva de stock confirmada en CEDI',
    },
    'En Producción': {
      desc: 'El lote ha entrado a planta de producción. Se está realizando el tinturado computarizado Giotto y la dispersión de pigmentos de alta resistencia UV.',
      icon: '⚙️',
      action: 'Tinturado y mezcla en línea de producción',
    },
    'Aprobada QA': {
      desc: 'El laboratorio de control de calidad ha emitido el certificado ISO 9001. Pruebas de adherencia ASTM y Delta E < 0.4 validadas con éxito.',
      icon: '🔬',
      action: 'Calidad certificada bajo norma técnica',
    },
    'Completada': {
      desc: `¡Tu pedido ha sido despachado y entregado exitosamente en obra! El transportador oficial confirmó la recepción a satisfacción y la póliza de garantía de 5 años está activa.`,
      icon: '🚚',
      action: 'Entrega final confirmada en obra',
    },
  };

  const currentInfo = statusDescriptions[data.status] || {
    desc: `El estado de tu proyecto ha avanzado a "${data.status}".`,
    icon: '✨',
    action: 'Actualización en ruta técnica',
  };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #1f2937; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #0d4788 0%, #173663 100%); padding: 32px 24px; text-align: center; }
    .badge { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .brand-title { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; }
    .project-code { color: #ffd100; font-family: monospace; font-size: 15px; font-weight: 700; margin-top: 6px; }
    .content { padding: 30px 28px; line-height: 1.6; }
    .status-alert { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .status-badge { display: inline-block; background-color: #0d4788; color: #ffffff; font-weight: 800; font-size: 13px; padding: 6px 14px; border-radius: 8px; margin-bottom: 8px; }
    .cta-container { text-align: center; margin: 28px 0 16px 0; }
    .cta-button { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 900; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 12px rgba(255, 209, 0, 0.4); text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Seguimiento de Ruta Técnica</span>
      <h1 class="brand-title">Actualización de Estado de Proyecto</h1>
      <div class="project-code">Proyecto #${data.id}</div>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #0f172a; margin-top: 0;">
        Estimado/a <strong>${data.clientName}</strong>,
      </p>
      <p style="color: #475569; font-size: 14px;">
        Te informamos que tu proyecto técnico de recubrimientos ha cambiado de etapa en la ruta de especificación y suministro de Pintuco.
      </p>

      <div class="status-alert">
        <div style="font-size: 28px; margin-bottom: 4px;">${currentInfo.icon}</div>
        <div class="status-badge">Nuevo Estado: ${data.status}</div>
        ${data.previousStatus ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Estado anterior: ${data.previousStatus}</div>` : ''}
        <div style="font-size: 14px; color: #1e3a8a; font-weight: 600; line-height: 1.5;">
          ${currentInfo.desc}
        </div>
      </div>

      <div style="background-color: #f8fafc; border-radius: 10px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 5px 0; color: #64748b;"><strong>Superficie / Sustrato:</strong></td>
            <td style="padding: 5px 0; color: #0f172a; text-align: right; font-weight: 600;">${data.surfaceType || 'Superficie Arquitectónica'}</td>
          </tr>
          ${data.areaM2 ? `
          <tr>
            <td style="padding: 5px 0; color: #64748b;"><strong>Área Proyectada:</strong></td>
            <td style="padding: 5px 0; color: #0f172a; text-align: right; font-weight: 600;">${data.areaM2} m²</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 5px 0; color: #64748b;"><strong>Ciudad de la Obra:</strong></td>
            <td style="padding: 5px 0; color: #0f172a; text-align: right;">${data.city || 'Colombia'}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: #64748b;"><strong>Asesor Técnico Responsable:</strong></td>
            <td style="padding: 5px 0; color: #0d4788; text-align: right; font-weight: 600;">${data.assignedAdvisor || 'Ing. Especialista Técnico Pintuco'}</td>
          </tr>
          ${data.trackingNumber ? `
          <tr>
            <td style="padding: 5px 0; color: #64748b;"><strong>Número de Guía:</strong></td>
            <td style="padding: 5px 0; color: #0f172a; text-align: right; font-family: monospace; font-weight: 700;">${data.trackingNumber}</td>
          </tr>` : ''}
          ${data.assignedCarrier ? `
          <tr>
            <td style="padding: 5px 0; color: #64748b;"><strong>Transportadora Asignada:</strong></td>
            <td style="padding: 5px 0; color: #0f172a; text-align: right;">${data.assignedCarrier}</td>
          </tr>` : ''}
        </table>
      </div>

      <div class="cta-container">
        <a href="${process.env.APP_URL || 'https://colorlink.onrender.com'}" class="cta-button">Ver Ruta en Tiempo Real</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0; font-weight: bold; color: #0d4788;">Pintuco Colombia S.A.S. • ColorLink Tracking</p>
      <p style="margin: 0 0 6px 0;">Para consultas directas sobre este proyecto, contacta a tu asesor técnico asignado.</p>
      <p style="margin: 0;">Línea Técnica Nacional: 01 8000 111 247</p>
    </div>
  </div>
</body>
</html>
`;

  return sendOrSimulateEmail({
    to: data.clientEmail,
    subject,
    html,
  });
}

/**
 * 4. Support Ticket Notification Email
 */
export async function sendSupportTicketEmail(ticket: SupportEmailData): Promise<EmailResult> {
  const subject = `Confirmación de Soporte Técnico ColorLink Pintuco: ${ticket.subject}`;
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #1f2937; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #0d4788 0%, #173663 100%); padding: 32px 24px; text-align: center; }
    .badge { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .brand-title { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; }
    .content { padding: 30px 28px; line-height: 1.6; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Soporte Técnico Especializado</span>
      <h1 class="brand-title">Solicitud Radicada con Éxito</h1>
    </div>
    <div class="content">
      <p style="font-size: 16px; color: #0f172a; margin-top: 0;">Hola <strong>${ticket.fullName}</strong>,</p>
      <p style="color: #475569; font-size: 14px;">Hemos recibido tu consulta técnica en el sistema ColorLink de Pintuco. Uno de nuestros ingenieros especialistas la está evaluando para darte respuesta inmediata.</p>
      <div style="background:#f8fafc; border-left:4px solid #ffd100; padding:16px; margin:16px 0; border-radius:8px; border:1px solid #e2e8f0; border-left-width:4px;">
        <p style="margin:0 0 6px 0; font-weight:bold; color:#0d4788;">Asunto: ${ticket.subject}</p>
        <p style="margin:0; font-size:13px; color:#475569;">"${ticket.message}"</p>
      </div>
      <p style="font-size:13px; color:#64748b; text-align: center;">Línea de atención técnica gratuita: 01 8000 111 247 | WhatsApp: +57 310 746 8899</p>
    </div>
    <div class="footer">
      <p style="margin:0; font-weight:bold; color:#0d4788;">Pintuco Colombia S.A.S. • ColorLink Pro</p>
    </div>
  </div>
</body>
</html>`;

  return sendOrSimulateEmail({
    to: ticket.email,
    subject,
    html,
  });
}

/**
 * 5. Password Reset Verification Code Email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<EmailResult> {
  const subject = `Código de Recuperación ColorLink Pintuco: ${data.code} 🔐`;
  const appUrl = process.env.APP_URL || 'https://colorlink.onrender.com';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #1f2937; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #0d4788 0%, #173663 100%); padding: 32px 24px; text-align: center; }
    .badge { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .brand-title { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .code-box { background: #fffbeb; border: 2px dashed #eab308; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0; }
    .code-digits { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0d4788; margin: 8px 0; }
    .cta-container { text-align: center; margin: 24px 0 12px 0; }
    .cta-button { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 900; font-size: 14px; padding: 12px 28px; border-radius: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Seguridad de Cuenta ColorLink</span>
      <h1 class="brand-title">Recuperación de Contraseña</h1>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #0f172a; margin-top: 0;">
        Hola <strong>${data.fullName}</strong>,
      </p>
      <p style="color: #475569; font-size: 14px;">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>ColorLink Pintuco</strong> (${data.email}). Utiliza el siguiente código de verificación en la pantalla de recuperación:
      </p>

      <div class="code-box">
        <div style="font-size: 11px; font-weight: 800; color: #854d0e; text-transform: uppercase; letter-spacing: 0.08em;">
          Código de Verificación
        </div>
        <div class="code-digits">${data.code}</div>
        <div style="font-size: 12px; color: #64748b;">
          Válido durante <strong>${data.expiresMinutes} minutos</strong>
        </div>
      </div>

      <p style="color: #475569; font-size: 13px;">
        Si tú no solicitaste cambiar tu contraseña, puedes ignorar este mensaje de forma segura; tu clave actual permanecerá sin cambios.
      </p>

      <div class="cta-container">
        <a href="${appUrl}" class="cta-button">Volver a ColorLink</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0; font-weight: bold; color: #0d4788;">Pintuco Colombia S.A.S. • Seguridad ColorLink</p>
      <p style="margin: 0;">Línea Técnica Nacional: 01 8000 111 247</p>
    </div>
  </div>
</body>
</html>
`;

  return sendOrSimulateEmail({
    to: data.email,
    subject,
    html,
    text: `Tu código de recuperación ColorLink Pintuco es: ${data.code} (válido por ${data.expiresMinutes} minutos).`,
  });
}

/**
 * 6. Registration Email Verification (OTP Code + One-Click Confirmation Link)
 */
export async function sendRegistrationVerificationEmail(
  data: RegistrationVerificationEmailData
): Promise<EmailResult> {
  const subject = `Confirma tu registro en ColorLink Pintuco: Código ${data.code} ✅`;
  const appUrl = process.env.APP_URL || 'https://colorlink.onrender.com';
  const confirmUrl = data.verificationUrl || appUrl;

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f6f8; color: #1f2937; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5e7eb; }
    .header { background: linear-gradient(135deg, #0d4788 0%, #173663 100%); padding: 32px 24px; text-align: center; }
    .badge { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 800; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
    .brand-title { color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; }
    .content { padding: 32px 28px; line-height: 1.6; }
    .code-box { background: #fffbeb; border: 2px dashed #eab308; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0; }
    .code-digits { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0d4788; margin: 8px 0; }
    .cta-container { text-align: center; margin: 24px 0 12px 0; }
    .cta-button { display: inline-block; background-color: #ffd100; color: #0d4788; font-weight: 900; font-size: 14px; padding: 14px 30px; border-radius: 10px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px; }
    .footer { background-color: #f1f5f9; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Verificación de Cuenta ColorLink</span>
      <h1 class="brand-title">Confirma tu Registro</h1>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #0f172a; margin-top: 0;">
        Hola <strong>${data.fullName}</strong>,
      </p>
      <p style="color: #475569; font-size: 14px;">
        ¡Gracias por registrarte en <strong>ColorLink Pintuco</strong>${data.role ? ` como <strong>${data.role}</strong>` : ''}! Para activar tu cuenta (${data.email}), confirma tu dirección de correo electrónico ingresando el siguiente código de verificación o haciendo clic en el botón de confirmación:
      </p>

      <div class="code-box">
        <div style="font-size: 11px; font-weight: 800; color: #854d0e; text-transform: uppercase; letter-spacing: 0.08em;">
          Código de Verificación de Registro
        </div>
        <div class="code-digits">${data.code}</div>
        <div style="font-size: 12px; color: #64748b;">
          Válido durante <strong>${data.expiresMinutes} minutos</strong>
        </div>
      </div>

      ${data.verificationUrl ? `
      <div class="cta-container">
        <a href="${confirmUrl}" class="cta-button">Confirmar Mi Registro</a>
      </div>` : ''}

      <p style="color: #475569; font-size: 12px; margin-top: 20px;">
        Una vez confirmes tu correo, tu acceso quedará habilitado y recibirás tu correo de bienvenida oficial de Pintuco ColorLink. Si no creaste esta cuenta, puedes ignorar este mensaje.
      </p>
    </div>

    <div class="footer">
      <p style="margin: 0 0 6px 0; font-weight: bold; color: #0d4788;">Pintuco Colombia S.A.S. • ColorLink Pro</p>
      <p style="margin: 0;">Línea Técnica Nacional: 01 8000 111 247</p>
    </div>
  </div>
</body>
</html>
`;

  return sendOrSimulateEmail({
    to: data.email,
    subject,
    html,
    text: `Confirma tu registro en ColorLink Pintuco con el código: ${data.code} (válido por ${data.expiresMinutes} minutos).${data.verificationUrl ? ` También puedes confirmar aquí: ${data.verificationUrl}` : ''}`,
  });
}


