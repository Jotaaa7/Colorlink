import React, { useState } from 'react';
import { X, PhoneCall, MessageCircle, Mail, MapPin, CheckCircle2, Clock, Send } from 'lucide-react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setTicketSubject('');
      setTicketMsg('');
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffd100] flex items-center justify-center text-[#6f5a00]">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1f1b10]">
                Canales de Soporte Pintuco
              </h3>
              <p className="text-xs text-[#7f765f]">
                Atención personalizada para clientes y contratistas ColorLink
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

        {isSubmitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-bold text-[#1f1b10]">
              ¡Solicitud de Soporte Recibida!
            </h4>
            <p className="text-sm text-[#4d4632] max-w-sm mx-auto">
              Un asesor técnico de Pintuco se comunicará contigo en menos de 15 minutos.
            </p>
          </div>
        ) : (
          <div className="py-6 space-y-6">
            {/* Quick Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="tel:018000111247"
                className="p-4 rounded-xl border border-[#d1c6ab] bg-[#fff8f0] hover:border-[#725c00] transition-colors flex items-start gap-3"
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
                className="p-4 rounded-xl border border-[#d1c6ab] bg-[#fff8f0] hover:border-[#725c00] transition-colors flex items-start gap-3"
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

            {/* Fast Ticket Form */}
            <form onSubmit={handleSubmitTicket} className="space-y-4 pt-2 border-t border-[#ebe2cf]">
              <h4 className="text-sm font-bold text-[#1f1b10] uppercase tracking-wider">
                Enviar Mensaje a Asesoría Técnica:
              </h4>

              <div>
                <label className="block mb-1 text-xs font-semibold text-[#1f1b10]">
                  Asunto / Tipo de Consulta
                </label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="Ej: Consulta sobre compatibilidad de imprimante"
                  className="w-full rounded-lg border border-[#d1c6ab] bg-white py-2.5 px-3 text-xs sm:text-sm text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100] outline-hidden"
                />
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold text-[#1f1b10]">
                  Mensaje o Detalle
                </label>
                <textarea
                  rows={3}
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  placeholder="Describe tu duda o requerimiento técnico..."
                  className="w-full rounded-lg border border-[#d1c6ab] bg-white py-2.5 px-3 text-xs sm:text-sm text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100] outline-hidden resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#ffd100] text-[#1f1b10] hover:bg-[#ffc800] text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar Consulta
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
