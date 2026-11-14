import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Bot,
  User,
  AlertCircle,
  ChevronDown,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ProjectRequest, UserProfile } from '../types';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  aiPowered?: boolean;
}

interface ChatBotWidgetProps {
  currentUser?: UserProfile | null;
  currentRequest?: ProjectRequest | null;
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
  onOpenStore?: () => void;
  onOpenNewRequest?: () => void;
}

const QUICK_SUGGESTIONS = [
  '¿Cómo pintar una pared con humedad o moho?',
  '¿Cuánto rinde un galón de Viniltex en interiores?',
  '¿Qué pintura usar para metal o rejas oxidadas?',
  '¿Cuál es la mejor pintura para fachadas exteriores?',
  '¿Cuánto tiempo debo esperar entre manos de pintura?',
  '¿Qué servicios y beneficios ofrece ColorLink Pintuco?',
];

export const ChatBotWidget: React.FC<ChatBotWidgetProps> = ({
  currentUser,
  currentRequest,
  isOpenExternal,
  onCloseExternal,
  onOpenStore,
  onOpenNewRequest,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'init-1',
        sender: 'bot',
        text: `¡Hola! Soy **ColorLink Bot**, tu asistente técnico especializado de **Pintuco Colombia** 🎨.\n\nEstoy capacitado **únicamente** para resolver tus dudas técnicas y operativas sobre:\n• Selección de pinturas y recubrimientos Pintuco (Viniltex, Koraza, Pintulux, Madetec, Sellomax, etc.)\n• Diagnóstico y preparación de superficies (humedad, fisuras, óxido)\n• Cálculos de rendimiento (m²/galón), manos y tiempos de secado\n• Servicios de la plataforma ColorLink, cotizaciones y pedidos\n\n¿En qué superficie o producto te puedo asesorar hoy?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiPowered: true,
      },
    ];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external open request
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
      if (isOpenExternal) {
        setHasUnread(false);
      }
    }
  }, [isOpenExternal]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/colorlink/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          projectContext: currentRequest
            ? {
                surfaceType: currentRequest.surfaceType,
                areaM2: currentRequest.areaM2,
                city: currentRequest.city,
                condition: currentRequest.condition,
                environment: currentRequest.environment,
                clientName: currentRequest.client?.fullName,
              }
            : undefined,
          history: messages.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en servidor (${response.status})`);
      }

      const data = await response.json();
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text:
          data.reply ||
          'Disculpa, como asesor técnico de ColorLink Pintuco solo respondo inquietudes relacionadas con pinturas, recubrimientos y servicios de nuestra plataforma.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiPowered: data.aiPowered,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.warn('Error en chat bot:', err);
      const fallbackMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text:
          'Para tu requerimiento de pintura te recomendamos seguir el sistema Pintuco: aplicar 1 mano de Sellador Sellomax para sellar porosidad y uniformizar la absorción, seguido de 2 manos de Viniltex Avanzado en interiores o Koraza en exteriores para máxima durabilidad.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiPowered: false,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'bot',
        text: `¡Hola de nuevo! Soy **ColorLink Bot**, asesor técnico oficial de Pintuco. Recuerda que mi especialidad está **únicamente enfocada** en pinturas, recubrimientos, preparación de sustratos y servicios de ColorLink. ¿Qué proyecto deseas consultar?`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiPowered: true,
      },
    ]);
  };

  const handleToggleOpen = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      setHasUnread(false);
    }
    if (!nextState && onCloseExternal) {
      onCloseExternal();
    }
  };

  // Render markdown-like simple formatting for bold, bullets, and numbered lists
  const renderFormattedText = (text: string) => {
    const paragraphs = text.split('\n');
    return paragraphs.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-1.5" />;
      }

      const isBullet = /^[•\-*]\s+/.test(trimmed);
      const numberedMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
      const cleanLine = isBullet
        ? trimmed.replace(/^[•\-*]\s+/, '')
        : numberedMatch
        ? numberedMatch[2]
        : trimmed;

      // Parse bold segments
      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-bold text-[#1f1b10]">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start gap-2 my-0.5 pl-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#725c00] mt-1.5 shrink-0"></span>
            <div className="flex-1 leading-relaxed">{formattedParts}</div>
          </div>
        );
      }

      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start gap-1.5 my-0.5 pl-1">
            <span className="font-bold text-[#725c00] shrink-0">{numberedMatch[1]}</span>
            <div className="flex-1 leading-relaxed">{formattedParts}</div>
          </div>
        );
      }

      return (
        <p key={idx} className="leading-relaxed mb-1">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
        {!isOpen && (
          <div className="mb-2 hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-lg border border-[#ebe2cf] text-xs font-semibold text-[#1f1b10] animate-bounce">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>¿Dudas sobre pintura? Chatea con ColorLink AI</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleToggleOpen}
          className="relative w-14 h-14 rounded-full bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-2 border-white cursor-pointer group"
          aria-label="Abrir Asesor Virtual ColorLink"
          id="btn-open-chatbot"
        >
          {isOpen ? (
            <ChevronDown className="w-6 h-6 text-[#1f1b10] group-hover:rotate-180 transition-transform" />
          ) : (
            <>
              <Bot className="w-7 h-7 text-[#1f1b10]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#0d4788] text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-xs ring-2 ring-white">
                AI
              </span>
              {hasUnread && (
                <span className="absolute -top-1 -left-1 w-3.5 h-3.5 bg-rose-500 rounded-full animate-ping"></span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Chatbot Window Modal / Popup */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-white border border-[#ebe2cf] shadow-2xl rounded-3xl overflow-hidden ${
            isExpanded
              ? 'inset-3 sm:inset-6 max-w-4xl mx-auto my-auto h-[90vh]'
              : 'bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh]'
          }`}
          id="colorlink-chat-window"
        >
          {/* Header */}
          <div className="bg-[#fff8f0] border-b border-[#ebe2cf] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-[#ffd100] text-[#1f1b10] font-black flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5 text-[#1f1b10]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-black text-[#1f1b10]">ColorLink Bot</h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#0d4788] text-white text-[9px] font-black uppercase tracking-wider">
                    Pintuco AI
                  </span>
                </div>
                <p className="text-[11px] text-[#7f765f] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Asesor Especialista en Recubrimientos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reiniciar conversación"
                className="p-1.5 rounded-xl text-[#7f765f] hover:text-[#1f1b10] hover:bg-[#f6eddb] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restaurar tamaño' : 'Maximizar'}
                className="hidden sm:block p-1.5 rounded-xl text-[#7f765f] hover:text-[#1f1b10] hover:bg-[#f6eddb] transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleToggleOpen}
                className="p-1.5 rounded-xl text-[#7f765f] hover:text-[#1f1b10] hover:bg-[#f6eddb] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Strict Service-Only Scope Notice Banner */}
          <div className="bg-[#fcf3e0] border-b border-[#ebe2cf] px-3.5 py-1.5 flex items-center gap-2 text-[10px] text-[#725c00] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#725c00] shrink-0" />
            <span className="truncate">
              Asistente exclusivo para pinturas, recubrimientos y servicios Pintuco.
            </span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#fbf9f4]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-[#ffd100] text-[#1f1b10] flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#725c00] text-white rounded-br-xs shadow-xs'
                      : 'bg-white text-[#332f25] border border-[#ebe2cf] rounded-bl-xs shadow-2xs'
                  }`}
                >
                  <div className="break-words">
                    {msg.sender === 'bot' ? (
                      renderFormattedText(msg.text)
                    ) : (
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                  <div
                    className={`text-[9px] mt-1 text-right font-medium ${
                      msg.sender === 'user' ? 'text-amber-200' : 'text-[#a19984]'
                    }`}
                  >
                    {msg.time}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-[#725c00] text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs font-bold text-[10px]">
                    {currentUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#ffd100] text-[#1f1b10] flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-[#ebe2cf] px-3.5 py-2 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#725c00] animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#725c00] animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-[#725c00] animate-bounce"></span>
                  <span className="text-[11px] text-[#7f765f] ml-1">Consultando Pintuco AI...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 pt-2 pb-1.5 bg-white border-t border-[#ebe2cf] overflow-x-auto no-scrollbar flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#7f765f] shrink-0 uppercase tracking-wider pl-1">
              Sugerencias:
            </span>
            {QUICK_SUGGESTIONS.map((sug, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => handleSendMessage(sug)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#f6eddb] hover:bg-[#ffd100] text-[#1f1b10] text-[11px] font-medium transition-colors border border-[#ebe2cf] cursor-pointer disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-[#ebe2cf]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pregunta sobre pinturas, preparación o rendimientos..."
                className="flex-1 bg-[#fff8f0] border border-[#d1c6ab] rounded-xl px-3.5 py-2.5 text-xs text-[#1f1b10] placeholder:text-[#a19984] focus:outline-hidden focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100]"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] flex items-center justify-center shrink-0 shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                title="Enviar mensaje"
                id="btn-send-chat-msg"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1 flex items-center justify-between text-[10px] text-[#7f765f] px-1">
              <span>Solo consultas técnicas y de servicio Pintuco</span>
              {currentRequest && (
                <span className="text-[#0d4788] font-bold">
                  Contexto: {currentRequest.surfaceType} ({currentRequest.city})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
