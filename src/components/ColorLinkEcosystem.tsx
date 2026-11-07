import React, { useState } from 'react';
import {
  ProjectRequest,
  ActiveTab,
  Quotation,
  ProductionOrder,
  QuotationItem,
} from '../types';
import { AddProductModal } from './AddProductModal';
import { ColorSelectorModal, ColorSelectionResult } from './ColorSelectorModal';
import {
  Sparkles,
  FileText,
  DollarSign,
  Package,
  Cpu,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Printer,
  Download,
  Send,
  Building2,
  Droplets,
  Clock,
  ShieldCheck,
  Zap,
  RotateCw,
  Sliders,
  Layers,
  ThermometerSun,
  Truck,
  Paintbrush,
  Sparkle,
  Palette,
  PackagePlus,
  Plus,
} from 'lucide-react';

interface ColorLinkEcosystemProps {
  request: ProjectRequest;
  onBackToForm: () => void;
  onNavigateToStatus?: () => void;
  onUpdateOrderStatus?: (status: any) => void;
  onUpdateProject?: (updatedRequest: ProjectRequest) => void;
}

export const ColorLinkEcosystem: React.FC<ColorLinkEcosystemProps> = ({
  request,
  onBackToForm,
  onNavigateToStatus,
  onUpdateProject,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'technical' | 'commercial' | 'inventory' | 'production_qa' | 'ai_chat'
  >('technical');

  // Interactive AI chat in ecosystem
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'ai'; text: string; time: string }>
  >([
    {
      sender: 'ai',
      text: `¡Hola! Soy ColorLink AI, tu especialista técnico de Pintuco. He formulado la solución para ${request.client.fullName} en ${request.city} (${request.surfaceType} de ${request.areaM2} m²). ¿Deseas ajustar el número de manos, consultar sobre dilución o verificar tiempos de curado?`,
      time: 'Ahora',
    },
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isTypingAI, setIsTypingAI] = useState(false);

  // Add Product & Color Modals state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [colorModalItemIndex, setColorModalItemIndex] = useState<number | null>(null);

  const handleAddProduct = (newItem: QuotationItem) => {
    if (!request.quotation) return;
    const updatedItems = [...request.quotation.items, newItem];
    const subtotal = updatedItems.reduce((acc, it) => acc + (it.totalCOP || 0), 0);
    const discount = Math.round(subtotal * 0.05);
    const tax = Math.round((subtotal - discount) * 0.19);
    const labor = request.quotation.laborEstimateCOP || Math.round(request.areaM2 * 6500);
    const total = subtotal - discount + tax + labor;

    const updatedRequest: ProjectRequest = {
      ...request,
      quotation: {
        ...request.quotation,
        items: updatedItems,
        subtotalCOP: subtotal,
        discountCOP: discount,
        taxCOP: tax,
        totalCOP: total,
      },
    };
    if (onUpdateProject) {
      onUpdateProject(updatedRequest);
    }
  };

  const handleApplyColorSelection = (result: ColorSelectionResult) => {
    if (colorModalItemIndex === null || !request.quotation) return;
    const targetItem = request.quotation.items[colorModalItemIndex];
    if (!targetItem) return;

    const baseName = targetItem.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const newName = `${baseName} (${result.name})`;

    const updatedItems = [...request.quotation.items];
    updatedItems[colorModalItemIndex] = {
      ...targetItem,
      name: newName,
      hasColors: true,
      selectedColorMode: result.mode,
      selectedColorName: result.name,
      selectedColorHex: result.hex,
      selectedColorCode: result.code,
    };

    const updatedRequest: ProjectRequest = {
      ...request,
      quotation: {
        ...request.quotation,
        items: updatedItems,
      },
    };
    if (onUpdateProject) {
      onUpdateProject(updatedRequest);
    }
    setColorModalItemIndex(null);
  };

  const diagnosis = request.diagnosis;
  const quote = request.quotation;
  const plantStocks = request.plantStocks || [];
  const prodOrder = request.productionOrder;

  // Format COP Currency
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;

    const userText = inputQuestion.trim();
    setInputQuestion('');
    const newMsg = {
      sender: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setIsTypingAI(true);

    try {
      const response = await fetch('/api/colorlink/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          projectContext: {
            surfaceType: request.surfaceType,
            areaM2: request.areaM2,
            city: request.city,
            condition: request.condition,
            environment: request.environment,
            clientName: request.client.fullName,
          },
          history: chatMessages.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text:
            data.reply ||
            'Para este tipo de requerimiento, recomendamos seguir estrictamente la preparación de superficie y respetar las 4 horas mínimas entre manos de pintura.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (error) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Para ${request.surfaceType} en ${request.environment}, la especificación técnica de Pintuco garantiza un rendimiento óptimo de ${
            request.environment === 'exterior' ? '28' : '35'
          } m²/galón a 2 manos. Si necesitas un aditivo antihumedad o acabado especial, indícanoslo.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTypingAI(false);
    }
  };

  const handlePrintQuote = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* Top Banner: Project Context & Status */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf] mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#ebe2cf]">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full bg-[#ffd100] text-[#1f1b10] text-xs font-black tracking-wide uppercase">
                {request.id}
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Solución ColorLink Automatizada
              </span>
              <span className="text-xs text-[#7f765f] font-medium">
                {new Date(request.createdAt).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1f1b10] tracking-tight">
              {request.client.fullName}
            </h1>
            <p className="text-sm text-[#4d4632] flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>📍 {request.address}, {request.city}</span>
              <span>•</span>
              <span>📐 {request.areaM2} m² ({request.surfaceType}, {request.environment})</span>
              <span>•</span>
              <span>📅 Requerido: {request.requiredDate}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToStatus && (
              <button
                onClick={onNavigateToStatus}
                className="px-4 py-2 rounded-xl bg-[#f6eddb] border border-[#d1c6ab] text-[#725c00] text-xs sm:text-sm font-bold hover:bg-[#f0e7d5] transition-colors flex items-center gap-1.5"
                id="btn-goto-project-status"
              >
                <Clock className="w-4 h-4 text-[#edc200]" />
                <span>Estado del Proyecto</span>
              </button>
            )}
            <button
              onClick={onBackToForm}
              className="px-4 py-2 rounded-xl border border-[#d1c6ab] text-[#4d4632] text-xs sm:text-sm font-bold hover:bg-[#f6eddb] transition-colors"
            >
              + Nueva Solicitud
            </button>
            <button
              onClick={handlePrintQuote}
              className="px-4 py-2 rounded-xl bg-[#ffd100] text-[#1f1b10] text-xs sm:text-sm font-bold hover:bg-[#ffc800] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Exportar Ficha
            </button>
          </div>
        </div>

        {/* 5-Step Ecosystem Pipeline Indicator */}
        <div className="pt-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[#725c00] mb-3 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#ffd100]" />
            Pipeline Operacional Integrado ColorLink:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              {
                step: '1. Solicitud',
                label: 'Requerimiento Registrado',
                done: true,
                icon: FileText,
              },
              {
                step: '2. Formulación IA',
                label: 'Diagnóstico & Ficha Técnica',
                done: true,
                icon: Sparkles,
              },
              {
                step: '3. Cotización',
                label: 'Costos & Aprobación',
                done: true,
                icon: DollarSign,
              },
              {
                step: '4. Inventario',
                label: 'Reserva en Planta/CEDI',
                done: true,
                icon: Package,
              },
              {
                step: '5. Calidad QA',
                label: 'Control Lote & Despacho',
                done: true,
                icon: ShieldCheck,
              },
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all ${
                    p.done
                      ? 'bg-[#fcf3e0] border-[#d1c6ab]'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-[#725c00]">{p.step}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-xs font-semibold text-[#1f1b10] truncate flex items-center gap-1">
                    <Icon className="w-3 h-3 text-[#2f5ea1]" />
                    {p.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 border-b border-[#ebe2cf]">
        {[
          {
            id: 'technical',
            label: '1. Ficha Técnica & Formulación IA',
            icon: Sparkles,
            color: 'text-[#725c00]',
          },
          {
            id: 'commercial',
            label: '2. Cotización Comercial Automatizada',
            icon: DollarSign,
            color: 'text-[#2f5ea1]',
          },
          {
            id: 'inventory',
            label: '3. Inventario en Plantas / CEDI',
            icon: Package,
            color: 'text-[#725c00]',
          },
          {
            id: 'production_qa',
            label: '4. Producción & Control Calidad (QA)',
            icon: ShieldCheck,
            color: 'text-emerald-700',
          },
          {
            id: 'ai_chat',
            label: '5. Asistente Técnico IA en Vivo',
            icon: MessageSquare,
            color: 'text-[#2f5ea1]',
          },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-[#725c00] text-white shadow-sm'
                  : 'bg-white text-[#4d4632] hover:bg-[#f6eddb] border border-[#ebe2cf]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#ffd100]' : tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: Ficha Técnica & Formulación IA */}
      {activeSubTab === 'technical' && diagnosis && (
        <div className="space-y-6">
          {/* Diagnostic Summary */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#ffd100] flex items-center justify-center text-[#6f5a00]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1f1b10]">
                  Diagnóstico Técnico y Sistema Recomendado
                </h2>
                <p className="text-xs sm:text-sm text-[#7f765f]">
                  Generado con IA en base a condición, ambiente y sustrato
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab] mb-6">
              <p className="text-sm sm:text-base text-[#1f1b10] leading-relaxed">
                {diagnosis.diagnosticSummary}
              </p>
            </div>

            {/* Recommended Products Grid */}
            <h3 className="text-base font-bold text-[#1f1b10] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#725c00]" />
              Esquema de Recubrimiento Pintuco Especificado:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {diagnosis.recommendedProducts.map((prod, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white border-2 border-[#edc200]/50 hover:border-[#725c00] transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-[#f6eddb] text-[#725c00] text-[11px] font-bold uppercase">
                        {prod.type}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#7f765f]">
                        SKU: {prod.sku}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-[#1f1b10] mb-2">{prod.name}</h4>
                    <p className="text-xs sm:text-sm text-[#4d4632] mb-4 leading-relaxed">
                      {prod.reason}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#ebe2cf] grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#fcf3e0] p-2 rounded-lg">
                      <div className="text-[10px] text-[#7f765f] uppercase font-bold">Rendimiento</div>
                      <div className="text-sm font-bold text-[#1f1b10]">{prod.coverageM2PerGal} m²/gal</div>
                    </div>
                    <div className="bg-[#fcf3e0] p-2 rounded-lg">
                      <div className="text-[10px] text-[#7f765f] uppercase font-bold">Manos</div>
                      <div className="text-sm font-bold text-[#725c00]">{prod.recommendedCoats} capas</div>
                    </div>
                    <div className="bg-[#ffd100]/20 p-2 rounded-lg border border-[#ffd100]">
                      <div className="text-[10px] text-[#6f5a00] uppercase font-bold">Volumen Total</div>
                      <div className="text-sm font-black text-[#1f1b10]">{prod.totalGallonsNeeded} Gal</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Preparation and Application Advice */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#ebe2cf]">
              {/* Surface Prep */}
              <div className="bg-[#fff8f0] p-5 rounded-xl border border-[#ebe2cf]">
                <h4 className="text-sm font-bold text-[#725c00] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-[#725c00]" />
                  Protocolo de Preparación de Superficie:
                </h4>
                <ul className="space-y-2.5">
                  {diagnosis.surfacePreparation.map((step, idx) => (
                    <li key={idx} className="text-xs sm:text-sm text-[#1f1b10] flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#ffd100] text-[#6f5a00] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Application parameters */}
              <div className="bg-[#fff8f0] p-5 rounded-xl border border-[#ebe2cf] space-y-3">
                <h4 className="text-sm font-bold text-[#2f5ea1] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#2f5ea1]" />
                  Parámetros Técnicos de Aplicación:
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-[#d1c6ab]">
                    <span className="text-[#7f765f] block font-semibold">Dilución</span>
                    <span className="font-bold text-[#1f1b10]">{diagnosis.applicationAdvice.dilution}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#d1c6ab]">
                    <span className="text-[#7f765f] block font-semibold">Secado al Tacto</span>
                    <span className="font-bold text-[#1f1b10]">{diagnosis.applicationAdvice.dryingTimeTouch}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#d1c6ab]">
                    <span className="text-[#7f765f] block font-semibold">Entre Manos</span>
                    <span className="font-bold text-[#1f1b10]">{diagnosis.applicationAdvice.dryingTimeBetweenCoats}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#d1c6ab]">
                    <span className="text-[#7f765f] block font-semibold">Curado Total</span>
                    <span className="font-bold text-[#1f1b10]">{diagnosis.applicationAdvice.cureTime}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-[#d1c6ab] text-xs">
                  <span className="text-[#7f765f] font-semibold block mb-1">Herramientas sugeridas:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {diagnosis.applicationAdvice.recommendedTools.map((tool, ti) => (
                      <span key={ti} className="px-2 py-1 rounded bg-[#f6eddb] text-[#1f1b10] font-medium">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Environmental & Quality Alert */}
            <div className="mt-6 pt-4 border-t border-[#ebe2cf] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                <ThermometerSun className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Condiciones Climáticas para {request.city}:</span>
                  <span>{diagnosis.environmentalFactor}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Puntos de Control de Calidad (QA):</span>
                  <span>{diagnosis.qualityCheckpoints.join(' • ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Cotización Comercial Automatizada */}
      {activeSubTab === 'commercial' && quote && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-[#ebe2cf]">
            {/* Header of Quote */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#ebe2cf]">
              <div>
                <div className="text-xs font-black tracking-widest text-[#725c00] uppercase">
                  Pintuco Colombia S.A.S. • ColorLink Pro
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#1f1b10]">
                  Cotización Comercial {quote.quoteNumber}
                </h2>
                <p className="text-xs text-[#7f765f] mt-0.5">
                  Emitida: {quote.date} | Validez: {quote.validUntil}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs text-[#7f765f] font-semibold">Total a Pagar (COP)</div>
                <div className="text-3xl sm:text-4xl font-black text-[#725c00]">
                  {formatCOP(quote.totalCOP)}
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  ✓ Descuento por Ecosistema ColorLink Aplicado
                </div>
              </div>
            </div>

            {/* Client Info Summary in Quote */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-b border-[#ebe2cf] text-xs">
              <div>
                <span className="text-[#7f765f] font-bold block uppercase">Cliente:</span>
                <span className="font-bold text-[#1f1b10] text-sm">{request.client.fullName}</span>
                <span className="text-[#4d4632] block">{request.client.documentType}: {request.client.documentNumber}</span>
              </div>
              <div>
                <span className="text-[#7f765f] font-bold block uppercase">Proyecto:</span>
                <span className="font-bold text-[#1f1b10] text-sm">{request.surfaceType} ({request.areaM2} m²)</span>
                <span className="text-[#4d4632] block">{request.address}, {request.city}</span>
              </div>
              <div>
                <span className="text-[#7f765f] font-bold block uppercase">Contacto & Pago:</span>
                <span className="font-bold text-[#1f1b10]">{request.client.phone}</span>
                <span className="text-[#4d4632] block">{quote.paymentTerms}</span>
              </div>
            </div>

            {/* Itemized Table Header with Add Product CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 pb-2">
              <span className="text-xs font-bold text-[#725c00] uppercase tracking-wider">
                Desglose de Productos y Servicios ({quote.items.length} ítems)
              </span>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                id="btn-add-product-quote-ecosystem"
              >
                <PackagePlus className="w-4 h-4" />
                <span>+ Agregar Producto al Proyecto</span>
              </button>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto pb-6">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b-2 border-[#d1c6ab] text-[#725c00] font-bold uppercase tracking-wider text-[11px]">
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Descripción de Producto / Servicio</th>
                    <th className="pb-3">Unidad / Empaque</th>
                    <th className="pb-3 text-center">Cant.</th>
                    <th className="pb-3 text-right">Precio Unitario</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe2cf]">
                  {quote.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#fff8f0]/80 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-[#7f765f]">{item.sku}</td>
                      <td className="py-3.5 font-bold text-[#1f1b10]">
                        <div className="flex items-center gap-2">
                          <span>{item.name}</span>
                          {item.isCustomManual && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                              Obra
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] font-normal text-[#7f765f]">
                          {item.type}
                        </span>

                        {/* Color selection chip if product has color */}
                        {item.hasColors && (
                          <div className="flex items-center gap-2 mt-1.5 p-1.5 rounded-lg bg-[#fcf3e0] border border-[#ebe2cf] w-fit">
                            <div
                              className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: item.selectedColorHex || '#E28468' }}
                            ></div>
                            <span className="text-[11px] font-bold text-[#1f1b10]">
                              {item.selectedColorName || 'Tono Asignado'}
                            </span>
                            <span className="text-[10px] font-mono text-[#7f765f]">
                              {item.selectedColorCode || item.selectedColorHex}
                            </span>
                            <button
                              type="button"
                              onClick={() => setColorModalItemIndex(idx)}
                              className="text-[10px] text-[#2f5ea1] hover:underline font-bold flex items-center gap-0.5 ml-1.5 cursor-pointer"
                            >
                              <Palette className="w-3 h-3" />
                              <span>Elegir Color</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 text-[#4d4632]">{item.unit}</td>
                      <td className="py-3.5 text-center font-bold text-[#1f1b10]">{item.quantity}</td>
                      <td className="py-3.5 text-right font-medium text-[#4d4632]">{formatCOP(item.unitPriceCOP)}</td>
                      <td className="py-3.5 text-right font-bold text-[#1f1b10]">{formatCOP(item.totalCOP)}</td>
                    </tr>
                  ))}
                  {/* Labor estimate line */}
                  <tr className="hover:bg-[#fff8f0]/80 transition-colors bg-[#fcf3e0]/50">
                    <td className="py-3.5 font-mono font-bold text-[#7f765f]">SRV-APLIC-PRO</td>
                    <td className="py-3.5 font-bold text-[#1f1b10]">
                      Mano de Obra Certificada Pintuco (Opcional Llave en Mano)
                      <span className="block text-[11px] font-normal text-[#7f765f]">
                        Pintores certificados con seguridad social y garantía de aplicación
                      </span>
                    </td>
                    <td className="py-3.5 text-[#4d4632]">Servicio Obra</td>
                    <td className="py-3.5 text-center font-bold text-[#1f1b10]">1</td>
                    <td className="py-3.5 text-right font-medium text-[#4d4632]">{formatCOP(quote.laborEstimateCOP)}</td>
                    <td className="py-3.5 text-right font-bold text-[#1f1b10]">{formatCOP(quote.laborEstimateCOP)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-6 border-t border-[#ebe2cf] flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-3 max-w-md text-xs text-[#4d4632]">
                <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab]">
                  <span className="font-bold text-[#725c00] block mb-1">Garantía Directa de Fábrica Pintuco:</span>
                  <span>
                    El recubrimiento cuenta con certificado de calidad ISO 9001 y garantía extendida de hasta 10 años
                    cumpliendo el protocolo de preparación formulado.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Entrega estimada en obra: {quote.estimatedLeadDays} días hábiles (Flete incluido).</span>
                </div>
              </div>

              <div className="w-full md:w-80 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-[#4d4632]">
                  <span>Subtotal Materiales:</span>
                  <span className="font-semibold">{formatCOP(quote.subtotalCOP)}</span>
                </div>
                <div className="flex justify-between text-[#4d4632]">
                  <span>Mano de Obra Estimada:</span>
                  <span className="font-semibold">{formatCOP(quote.laborEstimateCOP)}</span>
                </div>
                {quote.discountCOP > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Descuento Comercial (5%):</span>
                    <span>- {formatCOP(quote.discountCOP)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#4d4632]">
                  <span>IVA (19%):</span>
                  <span className="font-semibold">{formatCOP(quote.taxCOP)}</span>
                </div>
                <div className="flex justify-between text-[#4d4632]">
                  <span>Flete Logístico Regional:</span>
                  <span className="font-semibold text-emerald-700">GRATIS (ColorLink Pro)</span>
                </div>
                <div className="pt-3 border-t-2 border-[#1f1b10] flex justify-between text-base sm:text-lg font-black text-[#1f1b10]">
                  <span>Total Cotización:</span>
                  <span className="text-[#725c00]">{formatCOP(quote.totalCOP)}</span>
                </div>

                {/* Workflow advance action from quote to production */}
                {request.status === 'Cotizada' && (
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateProject) {
                          onUpdateProject({
                            ...request,
                            status: 'Inventario Asignado',
                            approvedAt: new Date().toISOString(),
                          });
                        }
                        if (onNavigateToStatus) {
                          onNavigateToStatus();
                        }
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#0d4788]" />
                      <span>Aprobar Cotización y Mandar a Producción</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Inventario en Plantas / CEDI */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf]">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ffd100] flex items-center justify-center text-[#6f5a00]">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1f1b10]">
                    Disponibilidad de Inventario en Tiempo Real
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7f765f]">
                    Stock sincronizado en plantas de producción y centros de distribución
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                Stock Conectado
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plantStocks.map((plant, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-[#d1c6ab] bg-[#fff8f0] hover:border-[#725c00] transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-[#725c00] uppercase tracking-wider">
                        {plant.city}
                      </div>
                      <h4 className="text-base font-bold text-[#1f1b10]">{plant.plantName}</h4>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        plant.status === 'Inmediato'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {plant.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-[#ebe2cf]">
                      <span className="text-[#7f765f] block text-[10px] font-bold uppercase">Disponible</span>
                      <span className="text-sm font-black text-[#1f1b10]">{plant.availableGallons} Gal</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#ebe2cf]">
                      <span className="text-[#7f765f] block text-[10px] font-bold uppercase">Lote Activo</span>
                      <span className="text-xs font-mono font-bold text-[#2f5ea1]">{plant.batchCode}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-[#ebe2cf]">
                      <span className="text-[#7f765f] block text-[10px] font-bold uppercase">Tiempo Despacho</span>
                      <span className="text-sm font-bold text-[#725c00]">{plant.leadTimeHours} hrs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab] flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-[#725c00] font-semibold">
                <Building2 className="w-4 h-4" />
                <span>Asignación automática preferente: Centro de Distribución Calle 80 (Bogotá)</span>
              </div>
              <span className="font-bold text-emerald-700">Reserva de Lote Exitosa</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Producción & Control Calidad (QA) */}
      {activeSubTab === 'production_qa' && prodOrder && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#8cb7ff] flex items-center justify-center text-[#0d4788]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1f1b10]">
                    Orden de Producción & Certificación de Calidad
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7f765f]">
                    Seguimiento industrial en línea y pruebas de laboratorio aprobadas
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Lote Certificado ISO 9001</span>
              </div>
            </div>

            {/* Production Progress Bar */}
            <div className="p-5 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab] mb-6 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-[#725c00] uppercase tracking-wider">
                  Etapa Actual: {prodOrder.currentStep}
                </span>
                <span className="text-sm font-black text-[#1f1b10]">
                  {prodOrder.progressPercentage}% Completado
                </span>
              </div>
              <div className="w-full bg-[#ebe2cf] h-3.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-[#ffd100] to-[#725c00] h-full rounded-full transition-all duration-1000 shadow-xs"
                  style={{ width: `${prodOrder.progressPercentage}%` }}
                ></div>
              </div>
              <div className="text-[11px] text-[#7f765f] flex justify-between">
                <span>Orden: {prodOrder.orderId}</span>
                <span>Planta: {prodOrder.plant}</span>
                <span>Volumen: {prodOrder.volumeGallons} Galones</span>
              </div>
            </div>

            {/* Lab QA Metrics Grid */}
            <h3 className="text-base font-bold text-[#1f1b10] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-[#2f5ea1]" />
              Resultados de Ensayos Técnicos de Calidad (ASTM / NTC):
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="p-3.5 rounded-xl bg-white border border-[#d1c6ab] text-center shadow-2xs">
                <div className="text-[10px] text-[#7f765f] uppercase font-bold">Viscosidad (Krebs)</div>
                <div className="text-lg font-black text-[#1f1b10] my-1">{prodOrder.qaMetrics.viscosityKrebs} KU</div>
                <div className="text-[10px] text-emerald-700 font-bold">Rango: 95-105 KU ✓</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#d1c6ab] text-center shadow-2xs">
                <div className="text-[10px] text-[#7f765f] uppercase font-bold">Densidad</div>
                <div className="text-lg font-black text-[#1f1b10] my-1">{prodOrder.qaMetrics.densityGml} g/mL</div>
                <div className="text-[10px] text-emerald-700 font-bold">Norma NTC 593 ✓</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#d1c6ab] text-center shadow-2xs">
                <div className="text-[10px] text-[#7f765f] uppercase font-bold">Color Delta E (ΔE)</div>
                <div className="text-lg font-black text-[#725c00] my-1">{prodOrder.qaMetrics.deltaEColor}</div>
                <div className="text-[10px] text-emerald-700 font-bold">&lt; 0.5 Tolerancia ✓</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#d1c6ab] text-center shadow-2xs">
                <div className="text-[10px] text-[#7f765f] uppercase font-bold">Espesor DFT</div>
                <div className="text-lg font-black text-[#1f1b10] my-1">{prodOrder.qaMetrics.dryFilmThicknessMils} mils</div>
                <div className="text-[10px] text-emerald-700 font-bold">Óptimo 2.0-2.5 ✓</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#d1c6ab] text-center shadow-2xs">
                <div className="text-[10px] text-[#7f765f] uppercase font-bold">Adherencia ASTM</div>
                <div className="text-sm font-black text-emerald-800 my-1">{prodOrder.qaMetrics.adhesionTapeASTM}</div>
                <div className="text-[10px] text-emerald-700 font-bold">Corte enrejado ✓</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#d1c6ab] text-center shadow-2xs">
                <div className="text-[10px] text-[#7f765f] uppercase font-bold">Finura Hegman</div>
                <div className="text-lg font-black text-[#1f1b10] my-1">{prodOrder.qaMetrics.finenessHegman}</div>
                <div className="text-[10px] text-emerald-700 font-bold">Molienda ultra-fina ✓</div>
              </div>
            </div>

            {/* QA Signoff Box */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-emerald-950 block">
                  Liberación Técnica de Calidad:
                </span>
                <span className="text-emerald-800">{prodOrder.qaMetrics.approvedBy}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-700 text-white font-bold">
                  Aprobado para Entrega y Aplicación
                </span>
                {request.status !== 'Completada' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateProject) {
                        onUpdateProject({
                          ...request,
                          status: 'Completada',
                          deliveryDate: new Date().toLocaleDateString('es-CO'),
                          trackingNumber: request.trackingNumber || `PTC-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
                          assignedCarrier: 'Flota Logística Pintuco Express',
                          completedAt: new Date().toISOString(),
                        });
                      }
                      if (onNavigateToStatus) {
                        onNavigateToStatus();
                      }
                    }}
                    className="px-4 py-1.5 rounded-full bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Despachar y Entregar en Obra</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onNavigateToStatus}
                    className="px-3 py-1 rounded-full bg-emerald-800 text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#ffd100]" />
                    <span>Ver Entrega en Obra</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Asistente IA Técnico en Vivo */}
      {activeSubTab === 'ai_chat' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf] flex flex-col h-[600px]">
            <div className="flex items-center gap-3 pb-4 border-b border-[#ebe2cf]">
              <div className="w-10 h-10 rounded-full bg-[#ffd100] flex items-center justify-center text-[#6f5a00]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1f1b10]">
                  Asesor Técnico ColorLink (IA Gemini)
                </h2>
                <p className="text-xs text-[#7f765f]">
                  Consultas técnicas sobre preparación, patologías, diluciones y fichas técnicas
                </p>
              </div>
            </div>

            {/* Chat message box */}
            <div className="flex-grow overflow-y-auto py-4 space-y-4 pr-2">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#725c00] text-white rounded-tr-xs'
                        : 'bg-[#fcf3e0] text-[#1f1b10] border border-[#d1c6ab] rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <span
                      className={`block text-[10px] mt-1.5 ${
                        msg.sender === 'user' ? 'text-white/70 text-right' : 'text-[#7f765f]'
                      }`}
                    >
                      {msg.time}
                    </span>
                  </div>
                </div>
              ))}
              {isTypingAI && (
                <div className="flex justify-start">
                  <div className="bg-[#fcf3e0] text-[#1f1b10] border border-[#d1c6ab] rounded-2xl rounded-tl-xs p-4 text-xs flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#725c00] animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-[#725c00] animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#725c00] animate-bounce [animation-delay:0.4s]"></div>
                    <span className="text-[#7f765f] font-medium ml-1">Consultando base técnica Pintuco...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggested quick questions */}
            <div className="py-2 flex flex-wrap gap-1.5">
              {[
                '¿Cómo tratar si hay humedad en la pared?',
                '¿Qué porcentaje de agua se diluye?',
                '¿Cuánto tiempo dura la garantía en exteriores?',
                '¿Qué rodillo recomiendan para acabado liso?',
              ].map((q, qi) => (
                <button
                  key={qi}
                  type="button"
                  onClick={() => setInputQuestion(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#4d4632] font-medium transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendChat} className="pt-3 border-t border-[#ebe2cf] flex gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder="Escribe tu duda técnica sobre pinturas, rendimiento o aplicación..."
                className="flex-grow rounded-xl border border-[#d1c6ab] bg-white py-3 px-4 text-xs sm:text-sm text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden"
              />
              <button
                type="submit"
                disabled={isTypingAI || !inputQuestion.trim()}
                className="px-5 py-3 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span>Enviar</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: AGREGAR PRODUCTO AL PROYECTO ===================== */}
      {isAddProductOpen && (
        <AddProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          onAddProduct={handleAddProduct}
        />
      )}

      {/* ===================== MODAL: SELECCIONAR COLOR / RUEDA ===================== */}
      {colorModalItemIndex !== null && quote?.items[colorModalItemIndex] && (
        <ColorSelectorModal
          isOpen={colorModalItemIndex !== null}
          onClose={() => setColorModalItemIndex(null)}
          productName={quote.items[colorModalItemIndex].name}
          productSku={quote.items[colorModalItemIndex].sku}
          initialMode={quote.items[colorModalItemIndex].selectedColorMode || 'suggestion'}
          initialHex={quote.items[colorModalItemIndex].selectedColorHex || '#E28468'}
          initialName={quote.items[colorModalItemIndex].selectedColorName || 'Salmón Terracota'}
          initialCode={quote.items[colorModalItemIndex].selectedColorCode || 'PT-248-A'}
          onApplyColor={handleApplyColorSelection}
        />
      )}
    </div>
  );
};
