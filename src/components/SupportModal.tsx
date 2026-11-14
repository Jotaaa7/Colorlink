import React, { useState, useEffect } from 'react';
import {
  X,
  PhoneCall,
  MessageCircle,
  Mail,
  CheckCircle2,
  Send,
  AlertTriangle,
  RefreshCw,
  Info,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { UserProfile } from '../types';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
}

interface ResendStatusData {
  isConfigured: boolean;
  isDummy: boolean;
  rawKeyMasked: string;
  sender: string;
  hasCustomDomain: boolean;
  note: string;
}

interface SmtpStatusData {
  isConfigured: boolean;
  isGmail: boolean;
  service?: string;
  userMasked: string;
  sender: string;
  host: string;
  port: number | string;
  note: string;
}

interface BrevoStatusData {
  isConfigured: boolean;
  isSmtpKeyMistake?: boolean;
  keyMasked: string;
  senderEmail: string;
  note: string;
}

interface SmtpDiagnosticError {
  timestamp: string;
  error: string;
  hint: string;
}

interface EmailLogItem {
  id: string;
  timestamp: string;
  to: string;
  subject: string;
  provider: string;
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
  diagnostic?: string;
  redirected?: boolean;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'email_diagnostic'>('contact');

  // Support ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketEmail, setTicketEmail] = useState(currentUser?.email || '');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketError, setTicketError] = useState('');

  // Email diagnostic
  const [resendStatus, setResendStatus] = useState<ResendStatusData | null>(null);
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatusData | null>(null);
  const [brevoStatus, setBrevoStatus] = useState<BrevoStatusData | null>(null);
  const [lastSmtpError, setLastSmtpError] = useState<SmtpDiagnosticError | null>(null);
  const [lastBrevoError, setLastBrevoError] = useState<SmtpDiagnosticError | null>(null);
  const [canSendToAnyEmail, setCanSendToAnyEmail] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<string>('');
  const [testEmail, setTestEmail] = useState(currentUser?.email || '');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [showGmailInstructions, setShowGmailInstructions] = useState(false);
  const [showBrevoInstructions, setShowBrevoInstructions] = useState(false);
  const [recentLogs, setRecentLogs] = useState<EmailLogItem[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    provider?: string;
    previewUrl?: string;
    error?: string;
    smtpError?: string;
    brevoError?: string;
    diagnostic?: string;
  } | null>(null);

  // Load email configuration status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/notifications/status');
      if (res.ok) {
        const data = await res.json();
        if (data.resend) setResendStatus(data.resend);
        if (data.smtp) setSmtpStatus(data.smtp);
        if (data.brevo) setBrevoStatus(data.brevo);
        setLastSmtpError(data.lastSmtpError || null);
        setLastBrevoError(data.lastBrevoError || null);
        setCanSendToAnyEmail(Boolean(data.canSendToAnyEmail));
        if (data.activeMode) setActiveMode(data.activeMode);
        if (Array.isArray(data.recentLogs)) setRecentLogs(data.recentLogs);
      }
    } catch (err) {
      console.warn('Error fetching notification status:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      if (currentUser?.email) {
        setTicketEmail(currentUser.email);
        setTestEmail(currentUser.email);
      }
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;

    setIsSubmittingTicket(true);
    setTicketError('');

    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: currentUser?.fullName || 'Cliente ColorLink',
          email: ticketEmail.trim(),
          phone: currentUser?.phone || '',
          subject: ticketSubject.trim(),
          message: ticketMsg.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTicketSubmitted(true);
        setTimeout(() => {
          setTicketSubmitted(false);
          setTicketSubject('');
          setTicketMsg('');
        }, 3000);
      } else {
        setTicketError(data.error || 'No se pudo enviar el ticket');
      }
    } catch (err: any) {
      setTicketError(err.message || 'Error de conexión');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setIsTestingEmail(true);
    setTestResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    try {
      const res = await fetch('/api/test/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: testEmail.trim() }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`El servidor respondió con código ${res.status}`);
      }

      const data = await res.json();
      if (data.brevoStatus) setBrevoStatus(data.brevoStatus);
      if (data.smtpStatus) setSmtpStatus(data.smtpStatus);
      if (data.resendStatus) setResendStatus(data.resendStatus);
      setLastSmtpError(data.lastSmtpError || null);
      setLastBrevoError(data.lastBrevoError || null);

      setTestResult({
        success: Boolean(data.success),
        message: data.message || (data.success ? 'Correo entregado' : 'Error al enviar'),
        provider: data.providerUsed,
        previewUrl: data.result?.previewUrl,
        error: data.result?.error,
        smtpError: data.result?.smtpError,
        brevoError: data.result?.brevoError,
        diagnostic: data.result?.diagnostic,
      });

      // Refresh status logs
      fetchStatus();
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      setTestResult({
        success: false,
        message: isAbort
          ? 'Tiempo de espera agotado al conectar con el servidor de correo (14s)'
          : 'Error de conexión con el servidor',
        error: err.message,
        diagnostic:
          'Si usas Render plan Free, recuerda que Render bloquea puertos SMTP (465/587). Configura BREVO_API_KEY + BREVO_FROM en Render para enviar vía HTTPS (puerto 443).',
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffd100] flex items-center justify-center text-[#6f5a00] shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1f1b10]">
                Canales de Soporte & Notificaciones
              </h3>
              <p className="text-xs text-[#7f765f]">
                Atención técnica y diagnóstico de correos ColorLink
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#4d4632] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#fcf3e0] p-1 rounded-xl my-4 border border-[#ebe2cf]">
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'contact'
                ? 'bg-white text-[#725c00] shadow-xs'
                : 'text-[#7f765f] hover:text-[#1f1b10]'
            }`}
          >
            Atención al Cliente
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('email_diagnostic');
              fetchStatus();
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'email_diagnostic'
                ? 'bg-white text-[#0d4788] shadow-xs'
                : 'text-[#7f765f] hover:text-[#1f1b10]'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-[#0d4788]" />
            <span>Servidor de Correo</span>
            {(brevoStatus?.isConfigured || resendStatus?.isConfigured || smtpStatus?.isConfigured) && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* TAB 1: CONTACTO Y CANALES */}
        {activeTab === 'contact' && (
          <div>
            {ticketSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-bold text-[#1f1b10]">
                  ¡Solicitud de Soporte Radicada!
                </h4>
                <p className="text-xs text-[#4d4632] max-w-sm mx-auto">
                  Hemos enviado la confirmación a <strong>{ticketEmail}</strong>. Un especialista técnico de Pintuco se comunicará contigo.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Quick Contact Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="tel:018000111247"
                    className="p-3.5 rounded-xl border border-[#d1c6ab] bg-[#fff8f0] hover:border-[#725c00] transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#ffd100] text-[#6f5a00] flex items-center justify-center shrink-0">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#725c00] block uppercase">Línea Nacional</span>
                      <span className="text-sm font-black text-[#1f1b10]">01 8000 111 247</span>
                      <span className="text-[10px] text-[#7f765f] block">Llamada sin costo</span>
                    </div>
                  </a>

                  <a
                    href="https://wa.me/573107468899"
                    target="_blank"
                    rel="noreferrer"
                    className="p-3.5 rounded-xl border border-[#d1c6ab] bg-[#fff8f0] hover:border-[#725c00] transition-colors flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-emerald-800 block uppercase">WhatsApp Técnico</span>
                      <span className="text-sm font-black text-[#1f1b10]">+57 310 746 8899</span>
                      <span className="text-[10px] text-[#7f765f] block">Chat con ingenieros</span>
                    </div>
                  </a>
                </div>

                {/* Ticket Form */}
                <form onSubmit={handleSubmitTicket} className="space-y-3.5 pt-2 border-t border-[#ebe2cf]">
                  <h4 className="text-xs font-bold text-[#1f1b10] uppercase tracking-wider">
                    Radicar Consulta con Notificación por Correo:
                  </h4>

                  {ticketError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{ticketError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block mb-1 text-xs font-semibold text-[#1f1b10]">
                      Correo Electrónico para Respuesta
                    </label>
                    <input
                      type="email"
                      required
                      value={ticketEmail}
                      onChange={(e) => setTicketEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full rounded-lg border border-[#d1c6ab] bg-white py-2 px-3 text-xs sm:text-sm text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-semibold text-[#1f1b10]">
                      Asunto de la Consulta
                    </label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="Ej: Consulta sobre compatibilidad de imprimante Sellomax"
                      className="w-full rounded-lg border border-[#d1c6ab] bg-white py-2 px-3 text-xs sm:text-sm text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100] outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-semibold text-[#1f1b10]">
                      Detalle del Requerimiento
                    </label>
                    <textarea
                      rows={3}
                      value={ticketMsg}
                      onChange={(e) => setTicketMsg(e.target.value)}
                      placeholder="Describe las condiciones de la obra o dudas sobre el producto..."
                      className="w-full rounded-lg border border-[#d1c6ab] bg-white py-2 px-3 text-xs sm:text-sm text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100] outline-hidden resize-none"
                    ></textarea>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-full border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb]"
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingTicket}
                      className="px-5 py-2 rounded-full bg-[#ffd100] text-[#1f1b10] hover:bg-[#ffc800] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingTicket ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-[#1f1b10] border-t-transparent rounded-full animate-spin"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Enviar Consulta</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DIAGNÓSTICO Y SERVIDOR DE CORREOS */}
        {activeTab === 'email_diagnostic' && (
          <div className="space-y-4">
            {/* Universal Capability Status Banner */}
            <div
              className={`p-3.5 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
                canSendToAnyEmail
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : resendStatus?.isConfigured
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-sky-50 border-sky-200 text-sky-900'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  canSendToAnyEmail
                    ? 'bg-emerald-200 text-emerald-800'
                    : resendStatus?.isConfigured
                    ? 'bg-amber-200 text-amber-800'
                    : 'bg-sky-200 text-sky-800'
                }`}
              >
                {canSendToAnyEmail ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : resendStatus?.isConfigured ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-black text-sm mb-0.5">
                  {canSendToAnyEmail
                    ? 'Envíos a CUALQUIER Correo Habilitados'
                    : resendStatus?.isConfigured
                    ? 'Modo Sandbox Resend Activo'
                    : 'SMTP de Prueba en Vivo Activo (Ethereal)'}
                </div>
                {canSendToAnyEmail ? (
                  <p>
                    El sistema está configurado para entregar correos directamente a <strong>cualquier destinatario externo</strong> ({activeMode}).
                  </p>
                ) : resendStatus?.isConfigured ? (
                  <p>
                    Con el remitente gratuito <code>onboarding@resend.dev</code>, Resend restringe el envío al correo del propietario registrado en la cuenta. Por eso, todas las notificaciones a clientes, cotizaciones y facturas <strong>se redirigen a dicha bandeja de entrada con el prefijo <code>[Para: cliente@...]</code></strong>.
                  </p>
                ) : (
                  <p>
                    Todos los correos (bienvenida, recuperación de contraseña, facturas y actualizaciones de proyecto) se transmiten vía <strong>Ethereal SMTP</strong> con enlace de vista previa real abajo. Para entrega a bandejas Gmail/corporativas, configura <code>SMTP_*</code> o <code>RESEND_API_KEY</code> en tus variables de entorno.
                  </p>
                )}
              </div>
            </div>

            {/* Last Brevo Diagnostic Error Alert */}
            {(lastBrevoError || brevoStatus?.isSmtpKeyMistake) && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-rose-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    Fallo Detectado en Brevo API
                  </span>
                  {lastBrevoError?.timestamp && (
                    <span className="text-[10px] text-rose-700 font-medium">
                      {new Date(lastBrevoError.timestamp).toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono bg-white/80 px-2.5 py-1.5 rounded-lg border border-rose-200 break-words">
                  {lastBrevoError?.error || 'BREVO_API_KEY es una clave SMTP (xsmtpsib-) en vez de API Key (xkeysib-)'}
                </p>
                <p className="text-[11px] leading-relaxed font-medium text-rose-900">
                  {lastBrevoError?.hint || brevoStatus?.note}
                </p>
              </div>
            )}

            {/* Last SMTP Diagnostic Error Alert */}
            {lastSmtpError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-rose-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    Último Fallo Detectado en SMTP
                  </span>
                  <span className="text-[10px] text-rose-700 font-medium">
                    {new Date(lastSmtpError.timestamp).toLocaleTimeString('es-CO', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[11px] font-mono bg-white/80 px-2.5 py-1.5 rounded-lg border border-rose-200 break-words">
                  {lastSmtpError.error}
                </p>
                <p className="text-[11px] leading-relaxed font-medium text-rose-900">
                  {lastSmtpError.hint}
                </p>
              </div>
            )}

            {/* Providers Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Brevo HTTPS API Status (Best for Render Free Tier) */}
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" />
                    Brevo (HTTPS)
                  </span>
                  {brevoStatus?.isSmtpKeyMistake ? (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                      Clave SMTP
                    </span>
                  ) : brevoStatus?.isConfigured ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lastBrevoError
                          ? 'text-rose-700 bg-rose-100'
                          : 'text-emerald-700 bg-emerald-100'
                      }`}
                    >
                      {lastBrevoError ? 'Con fallo' : 'Activo'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#64748b] bg-[#e2e8f0] px-2 py-0.5 rounded-full">
                      Render Free
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#475569] truncate">
                  API Key: <strong>{brevoStatus?.keyMasked || 'No configurada'}</strong>
                </div>
                <div className="text-[11px] text-[#475569] truncate" title={brevoStatus?.senderEmail}>
                  Remitente: <strong>{brevoStatus?.senderEmail || 'No configurado'}</strong>
                </div>
                <div className="text-[10px] text-[#64748b] pt-1 border-t border-[#e2e8f0]">
                  {brevoStatus?.isConfigured
                    ? 'Puerto 443 activo (Outlook/Gmail)'
                    : 'Usa xkeysib-... + BREVO_FROM'}
                </div>
              </div>

              {/* SMTP / Gmail Status */}
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[#725c00] uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" />
                    SMTP Gmail
                  </span>
                  {smtpStatus?.isConfigured ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        lastSmtpError
                          ? 'text-rose-700 bg-rose-100'
                          : 'text-emerald-700 bg-emerald-100'
                      }`}
                    >
                      {lastSmtpError ? 'Con fallo' : 'Activo'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#64748b] bg-[#e2e8f0] px-2 py-0.5 rounded-full">
                      Opcional
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#475569] truncate">
                  Cuenta: <strong>{smtpStatus?.userMasked || 'No configurado'}</strong>
                </div>
                <div className="text-[11px] text-[#475569] truncate">
                  Host: <strong>{smtpStatus?.host || 'smtp.gmail.com'}:{smtpStatus?.port || 587}</strong>
                </div>
                <div className="text-[10px] text-[#64748b] pt-1 border-t border-[#e2e8f0]">
                  {smtpStatus?.isConfigured
                    ? 'Reintento IPv4 en puertos 587/465'
                    : 'Bloqueado en Render plan Free'}
                </div>
              </div>

              {/* Resend Status */}
              <div className="p-3 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-[#0d4788] uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    Resend API
                  </span>
                  {resendStatus?.isConfigured && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Conectado
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#475569] truncate">
                  API Key: <strong>{resendStatus?.rawKeyMasked || 'No configurada'}</strong>
                </div>
                <div className="text-[11px] text-[#475569] truncate" title={resendStatus?.sender}>
                  Remitente: <strong>{resendStatus?.sender || 'onboarding@resend.dev'}</strong>
                </div>
                <div className="text-[10px] text-[#64748b] pt-1 border-t border-[#e2e8f0]">
                  {resendStatus?.hasCustomDomain
                    ? 'Dominio propio verificado'
                    : 'Sandbox (redirige si falla SMTP)'}
                </div>
              </div>
            </div>

            {/* Brevo HTTPS API Guide (Recommended for Render Free Tier -> Outlook/Hotmail) */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <button
                type="button"
                onClick={() => setShowBrevoInstructions(!showBrevoInstructions)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-emerald-900 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>¿En Render Free no llegan correos a Outlook? Usa Brevo HTTPS (Gratis)</span>
                </span>
                <span className="text-[11px] underline shrink-0 ml-2">
                  {showBrevoInstructions ? 'Ocultar guía' : 'Ver 3 pasos'}
                </span>
              </button>

              {showBrevoInstructions && (
                <div className="text-xs text-[#334155] space-y-2 pt-2 border-t border-emerald-200 leading-relaxed">
                  <p>
                    El plan gratuito de <strong>Render</strong> bloquea los puertos SMTP (25, 465 y 587).{' '}
                    <strong>Brevo</strong> envía por <strong>HTTPS (puerto 443)</strong>, regala 300 correos/día sin comprar dominio y entrega directo a <strong>Outlook, Hotmail y Gmail</strong>:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-[11px]">
                    <li>
                      Crea una cuenta gratuita en{' '}
                      <a
                        href="https://app.brevo.com/account/register"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-800 font-bold underline inline-flex items-center gap-0.5"
                      >
                        brevo.com <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      y verifica tu correo Gmail en <strong>Senders &amp; IP → Senders</strong>.
                    </li>
                    <li>
                      Ve a <strong>SMTP &amp; API → API Keys</strong> y genera una nueva clave (empieza por <code>xkeysib-...</code>).
                    </li>
                    <li>
                      En Render (<strong>Environment</strong>) agrega estas 2 variables y haz <strong>Manual Deploy</strong>:
                      <pre className="p-2 bg-white rounded-lg font-mono text-[10px] text-[#0f172a] mt-1 select-all overflow-x-auto border border-emerald-200">
{`BREVO_API_KEY=xkeysib-tu_api_key_aqui
BREVO_FROM=tu_correo@gmail.com`}
                      </pre>
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* How to enable sending to ANY email with Gmail SMTP */}
            <div className="p-3.5 rounded-2xl bg-white border border-[#d1c6ab] space-y-2">
              <button
                type="button"
                onClick={() => setShowGmailInstructions(!showGmailInstructions)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-[#0d4788] cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#0d4788]" />
                  <span>Guía de variables Gmail SMTP (servidores con puertos 587/465 abiertos)</span>
                </span>
                <span className="text-[11px] underline">
                  {showGmailInstructions ? 'Ocultar guía' : 'Ver 3 pasos'}
                </span>
              </button>

              {showGmailInstructions && (
                <div className="text-xs text-[#334155] space-y-2 pt-2 border-t border-[#e2e8f0] leading-relaxed">
                  <p>
                    Si tu servidor permite tráfico SMTP saliente (Render pago o entorno local), usa cualquier cuenta de <strong>Gmail</strong>:
                  </p>
                  <ol className="list-decimal pl-5 space-y-1.5 text-[11px]">
                    <li>
                      Entra a tu cuenta de Google en{' '}
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0d4788] font-bold underline inline-flex items-center gap-0.5"
                      >
                        myaccount.google.com/security <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      y activa la <strong>Verificación en dos pasos</strong>.
                    </li>
                    <li>
                      Ingresa a{' '}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0d4788] font-bold underline inline-flex items-center gap-0.5"
                      >
                        Contraseñas de aplicaciones <ExternalLink className="w-3 h-3" />
                      </a>
                      , escribe el nombre "ColorLink" y haz clic en <strong>Crear</strong>. Copia la clave de 16 letras sin espacios.
                    </li>
                    <li>
                      Configura estas variables en Render / <code>.env</code>:
                      <pre className="p-2 bg-[#f1f5f9] rounded-lg font-mono text-[10px] text-[#0f172a] mt-1 select-all overflow-x-auto">
{`SMTP_SERVICE=gmail
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_clave_de_16_letras_sin_espacios`}
                      </pre>
                    </li>
                  </ol>
                </div>
              )}
            </div>

            {/* Test Email Form */}
            <form onSubmit={handleSendTestEmail} className="p-4 rounded-2xl bg-[#fff8f0] border border-[#d1c6ab] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#725c00] uppercase tracking-wider">
                  Enviar Correo de Prueba en Vivo
                </span>
                <span className="text-[10px] bg-[#ffd100] px-2 py-0.5 rounded-full font-bold text-[#1f1b10]">
                  TEST
                </span>
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-[#1f1b10]">
                  Correo Electrónico Destino a Probar:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="ejemplo@gmail.com, cliente@empresa.com"
                    className="flex-1 rounded-xl border border-[#d1c6ab] bg-white py-2 px-3 text-xs sm:text-sm text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100] outline-hidden shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={isTestingEmail}
                    className="bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] px-4 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {isTestingEmail ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-[#1f1b10] border-t-transparent rounded-full animate-spin"></div>
                        <span>Probando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Probar Envío</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1 flex-1">
                      <div className="font-bold">
                        {testResult.success
                          ? '¡Resultado Exitoso!'
                          : 'Diagnóstico de Envío Fallido'}
                      </div>
                      <p>{testResult.message}</p>
                      {testResult.brevoError && (
                        <p className="text-[11px] font-semibold bg-rose-50 text-rose-800 p-2 rounded-lg mt-1 border border-rose-200 break-words">
                          Detalle fallo Brevo: {testResult.brevoError}
                        </p>
                      )}
                      {testResult.smtpError && (
                        <p className="text-[11px] font-semibold bg-rose-50 text-rose-800 p-2 rounded-lg mt-1 border border-rose-200 break-words">
                          Detalle fallo SMTP: {testResult.smtpError}
                        </p>
                      )}
                      {testResult.diagnostic && (
                        <p className="text-[11px] opacity-90 font-medium bg-white/70 p-2 rounded-lg mt-1 border border-current/20">
                          {testResult.diagnostic}
                        </p>
                      )}
                      {testResult.provider && (
                        <div className="text-[10px] text-[#64748b]">
                          Proveedor utilizado: <strong>{testResult.provider}</strong>
                        </div>
                      )}
                      {testResult.previewUrl && (
                        <a
                          href={testResult.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-[#0d4788] font-bold text-[11px] hover:bg-[#fff8f0]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir correo enviado (Vista previa)</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Recent Email Delivery Logs */}
            <div className="p-4 rounded-2xl bg-white border border-[#ebe2cf] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1f1b10] uppercase tracking-wider">
                  Historial Reciente de Correos ({recentLogs.length})
                </span>
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="text-[11px] font-bold text-[#0d4788] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Actualizar</span>
                </button>
              </div>

              {recentLogs.length === 0 ? (
                <p className="text-xs text-[#7f765f] py-2">
                  Aún no hay correos enviados en esta sesión. Registra una cuenta, solicita recuperación de contraseña, realiza una compra o envía un correo de prueba.
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-[#fcf3e0]/60 border border-[#ebe2cf] text-xs flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="font-bold text-[#1f1b10] truncate">{log.subject}</div>
                        <div className="text-[11px] text-[#4d4632] truncate">
                          Para: <strong>{log.to}</strong> •{' '}
                          {new Date(log.timestamp).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {log.error && (
                          <div className="text-[10px] text-rose-700 truncate">{log.error}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.success
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {log.provider}
                        </span>
                        {log.previewUrl && (
                          <a
                            href={log.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0d4788] hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Ver</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
