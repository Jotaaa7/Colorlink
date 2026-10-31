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

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'email_diagnostic'>('contact');

  // Support ticket form
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [ticketEmail, setTicketEmail] = useState(currentUser?.email || 'Stivengamer1803@gmail.com');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketError, setTicketError] = useState('');

  // Email diagnostic
  const [resendStatus, setResendStatus] = useState<ResendStatusData | null>(null);
  const [testEmail, setTestEmail] = useState(currentUser?.email || 'Stivengamer1803@gmail.com');
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    provider?: string;
    error?: string;
    diagnostic?: string;
  } | null>(null);

  // Load Resend status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/notifications/status');
      if (res.ok) {
        const data = await res.json();
        if (data.resend) {
          setResendStatus(data.resend);
        }
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

    try {
      const res = await fetch('/api/test/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: testEmail.trim() }),
      });

      const data = await res.json();
      setTestResult({
        success: Boolean(data.success),
        message: data.message || (data.success ? 'Correo entregado' : 'Error al enviar'),
        provider: data.providerUsed,
        error: data.result?.error,
        diagnostic: data.result?.diagnostic,
      });

      // Refresh status logs
      fetchStatus();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Error de red al conectar con el servidor de correos',
        error: err.message,
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
            <span>Diagnóstico Resend</span>
            {resendStatus?.isConfigured && (
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

        {/* TAB 2: DIAGNÓSTICO RESEND */}
        {activeTab === 'email_diagnostic' && (
          <div className="space-y-4">
            {/* Status Card */}
            <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0d4788] uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  Estado del Servicio Resend
                </span>
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="p-1 rounded-md text-[#7f765f] hover:text-[#0d4788] hover:bg-[#e2e8f0]"
                  title="Refrescar estado"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-[#e2e8f0]">
                  <span className="text-[#64748b] block text-[10px]">API Key Resend</span>
                  <span className="font-bold text-[#0f172a] truncate block">
                    {resendStatus?.isConfigured ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                        Detectada ({resendStatus.rawKeyMasked})
                      </span>
                    ) : resendStatus?.isDummy ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 inline" />
                        Placeholder de prueba
                      </span>
                    ) : (
                      <span className="text-rose-700">No configurada</span>
                    )}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#e2e8f0]">
                  <span className="text-[#64748b] block text-[10px]">Remitente (From)</span>
                  <span className="font-bold text-[#0f172a] truncate block text-[11px]" title={resendStatus?.sender}>
                    {resendStatus?.sender || 'onboarding@resend.dev'}
                  </span>
                </div>
              </div>

              {/* Informative Note */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950 mb-0.5">
                    {resendStatus?.isConfigured
                      ? '¿Cómo funciona el envío con Resend?'
                      : '¿Por qué aún no envía correos reales?'}
                  </div>
                  {resendStatus?.isDummy ? (
                    <p>
                      La variable <code>RESEND_API_KEY</code> tiene asignado un valor de prueba temporal (<code>re_1234...</code>). Para que los correos lleguen a tu bandeja de entrada real, copia tu API Key obtenida en{' '}
                      <a
                        href="https://resend.com/api-keys"
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-amber-950 inline-flex items-center gap-0.5"
                      >
                        resend.com/api-keys <ExternalLink className="w-3 h-3" />
                      </a>{' '}
                      y pégala en el archivo <code>.env</code>.
                    </p>
                  ) : !resendStatus?.hasCustomDomain ? (
                    <p>
                      En el plan gratuito de Resend con el remitente <code>onboarding@resend.dev</code>, Resend <strong>únicamente entrega correos al correo con el que te registraste en Resend</strong>. Si envías a un correo diferente, Resend bloqueará el mensaje hasta que verifiques un dominio en{' '}
                      <a
                        href="https://resend.com/domains"
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold underline text-amber-950 inline-flex items-center gap-0.5"
                      >
                        resend.com/domains <ExternalLink className="w-3 h-3" />
                      </a>.
                    </p>
                  ) : (
                    <p>
                      Dominio verificado activo. Los correos se enviarán directamente a cualquier destinatario a través de Resend.
                    </p>
                  )}
                </div>
              </div>
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
                  Correo Electrónico Destino (Tu cuenta de Resend):
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="ejemplo@gmail.com"
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
                    <div className="space-y-1">
                      <div className="font-bold">
                        {testResult.success
                          ? '¡Resultado Exitoso!'
                          : 'Diagnóstico de Envío Fallido'}
                      </div>
                      <p>{testResult.message}</p>
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
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
