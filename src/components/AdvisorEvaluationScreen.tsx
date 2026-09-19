import React, { useState } from 'react';
import { UserProfile, ProjectRequest } from '../types';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Bell,
  User,
  ChevronRight,
  Save,
  FileDown,
  Send,
  ScanLine,
  GripHorizontal,
  Droplets,
  CheckSquare,
  Palette,
  Calculator,
  Sliders,
  Receipt,
  Truck,
  MessageCircle,
  FileSpreadsheet,
  Check,
  X,
  Printer,
  ArrowRight,
  HelpCircle,
  Info,
  LogOut,
  Layers,
} from 'lucide-react';

interface AdvisorEvaluationScreenProps {
  currentUser: UserProfile | null;
  request: ProjectRequest | null;
  onSwitchToAdvisorAccount: () => void;
  onOpenLogin: () => void;
  onNavigateHome: () => void;
  onNavigateToInventory?: () => void;
}

export const AdvisorEvaluationScreen: React.FC<AdvisorEvaluationScreenProps> = ({
  currentUser,
  request,
  onSwitchToAdvisorAccount,
  onOpenLogin,
  onNavigateHome,
  onNavigateToInventory,
}) => {
  // Check authorization
  const isAuthorized =
    currentUser &&
    (currentUser.role === 'Especialista Técnico Pintuco' ||
      currentUser.role === 'Asesor Comercial / Técnico' ||
      currentUser.role === 'Administrador Pintuco');

  // State for interactive features in the screen
  const [mermaPercent, setMermaPercent] = useState<number>(8);
  const [activeAdvisorNav, setActiveAdvisorNav] = useState<
    'solicitudes' | 'diagnostico' | 'catalogo' | 'historial'
  >('diagnostico');
  const [searchQuery, setSearchQuery] = useState('');

  // Pathologies state
  const [pathologies, setPathologies] = useState({
    sellador: true,
    microfisuras: true,
    grasa: false,
  });

  // Technical note state
  const [technicalNotes, setTechnicalNotes] = useState(
    'Se prescribe aplicación rigurosa de 1 mano homogénea de Sellador 501 para uniformar absorción y maximizar el cubrimiento del Viniltex Avanzado. Garantía de fábrica certificada por 5 años contra decoloración y desprendimiento.'
  );

  // Modals state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showSapModal, setShowSapModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setShowNotificationToast(msg);
    setTimeout(() => {
      setShowNotificationToast(null);
    }, 4000);
  };

  // Pricing calculations
  const subtotal = 419800;
  const discountRate = 0.1; // 10%
  const discountAmount = Math.round(subtotal * discountRate);
  const baseTaxable = subtotal - discountAmount;
  const ivaAmount = Math.round(baseTaxable * 0.19);
  const grandTotal = baseTaxable + ivaAmount;

  // Formatting COP
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Client display metadata
  const clientName = request?.client?.fullName || 'Andrés Cepeda';
  const clientAddress = request?.address || 'Bogotá, Calle 127 # 19-45';
  const projectCode = request?.id || 'PTC-2024-8924';
  const projectArea = request?.areaM2 || 45;

  // =========================================================================
  // 1. RESTRICTED ACCESS SCREEN (If user is NOT an Advisor or Admin)
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] bg-[#fff8f0] flex items-center justify-center p-4 md:p-8">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-[#ebe2cf] p-6 sm:p-10 relative overflow-hidden">
          {/* Decorative background accent */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#ffd100]/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col items-center text-center">
            {/* Lock / Restricted Badge */}
            <div className="w-20 h-20 rounded-3xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shadow-inner mb-6 border border-[#ba1a1a]/20">
              <Lock className="w-10 h-10 stroke-[2.2]" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f6eddb] border border-[#d1c6ab] text-[#725c00] text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldAlert className="w-4 h-4 text-[#ba1a1a]" />
              <span>Acceso Restringido • Seguridad Pintuco PRO</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#1f1b10] tracking-tight mb-3">
              Módulo Exclusivo para Asesores Técnicos y Administradores
            </h1>

            <p className="text-sm sm:text-base text-[#4d4632] max-w-lg mb-6 leading-relaxed">
              Esta pantalla contiene herramientas internas de <strong>visión artificial de sustrato</strong>, 
              <strong> calibración de merma volumétrica</strong>, listas oficiales de precios con 
              <strong> márgenes comerciales</strong> y emisión directa de <strong>órdenes SAP</strong>.
            </p>

            {/* Current Session Info */}
            <div className="w-full bg-[#fcf3e0] border border-[#ebe2cf] rounded-2xl p-4 mb-8 text-left flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#7f765f] uppercase tracking-wider block">
                  Estado de tu sesión actual:
                </span>
                <span className="text-sm font-bold text-[#1f1b10] flex items-center gap-1.5 mt-0.5">
                  <User className="w-4 h-4 text-[#2f5ea1]" />
                  {currentUser ? `${currentUser.fullName} (${currentUser.role})` : 'Visitante no autenticado'}
                </span>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-[#ffdad6] text-[#ba1a1a] rounded-full border border-[#ba1a1a]/20 shrink-0">
                Rol Sin Permisos
              </span>
            </div>

            {/* Action Buttons to gain authorized access */}
            <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onSwitchToAdvisorAccount}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#6f5a00] font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="btn-unlock-advisor-demo"
              >
                <UserCheck className="w-5 h-5 text-[#6f5a00]" />
                <span>Ingresar como Asesor Técnico Pintuco (Demo 1-Clic)</span>
              </button>

              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#f6eddb] hover:bg-[#f0e7d5] text-[#1f1b10] font-bold text-sm border border-[#d1c6ab] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Iniciar con Otras Credenciales</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onNavigateHome}
              className="mt-6 text-xs font-bold text-[#7f765f] hover:text-[#1f1b10] transition-colors underline decoration-dotted"
            >
              Volver al Portal de Cliente y Solicitudes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHORIZED SCREEN: PINTUCO PRO - EVALUACIÓN TÉCNICA & COTIZACIÓN
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#fff8f0] text-[#1f1b10] font-sans antialiased pb-16">
      {/* Toast notification */}
      {showNotificationToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#1f1b10] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#ffd100] animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#ffd100] shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{showNotificationToast}</span>
        </div>
      )}

      {/* ===================================================================
          PINTUCO PRO ADVISOR NAVBAR
          =================================================================== */}
      <div className="w-full bg-[#fff8f0]/95 backdrop-blur-xl border-b border-[#ebe2cf] shadow-xs">
        <div className="h-20 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 max-w-[1440px] mx-auto">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="bg-[#ffd100] text-[#6f5a00] px-3 py-1 rounded-lg text-xl sm:text-2xl font-black tracking-tight shadow-xs">
                PINTUCO
              </div>
              <span className="text-sm font-black text-[#725c00] tracking-wider">PRO</span>
            </div>

            <div className="h-6 w-px bg-[#d1c6ab] hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#f6eddb] rounded-lg border border-[#d1c6ab]/40">
              <span className="text-xs text-[#4d4632] font-medium">Rol:</span>
              <span className="text-xs text-[#1f1b10] font-bold">Portal Técnico Asesor</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="hidden xl:flex items-center flex-1 max-w-xs relative">
            <div className="w-full flex items-center bg-white rounded-xl px-3.5 py-2 border border-[#d1c6ab]/50 shadow-2xs">
              <Search className="w-4 h-4 text-[#7f765f] mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar expediente / radicado..."
                className="w-full bg-transparent text-xs text-[#1f1b10] placeholder:text-[#7f765f] focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Advisor Top Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveAdvisorNav('solicitudes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeAdvisorNav === 'solicitudes'
                  ? 'bg-[#ffd100] text-[#6f5a00] font-bold shadow-2xs'
                  : 'text-[#4d4632] hover:bg-[#f0e7d5] hover:text-[#1f1b10]'
              }`}
            >
              Solicitudes Pendientes
            </button>
            <button
              onClick={() => setActiveAdvisorNav('diagnostico')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeAdvisorNav === 'diagnostico'
                  ? 'bg-[#ffd100] text-[#6f5a00] font-bold shadow-2xs'
                  : 'text-[#4d4632] hover:bg-[#f0e7d5] hover:text-[#1f1b10]'
              }`}
            >
              Diagnóstico & IA
            </button>
            <button
              onClick={() => onNavigateToInventory ? onNavigateToInventory() : setActiveAdvisorNav('inventario')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeAdvisorNav === 'inventario'
                  ? 'bg-[#ffd100] text-[#6f5a00] font-bold shadow-2xs'
                  : 'text-[#4d4632] hover:bg-[#f0e7d5] hover:text-[#1f1b10]'
              }`}
            >
              Inventario & Disponibilidad
            </button>
            <button
              onClick={() => setActiveAdvisorNav('catalogo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeAdvisorNav === 'catalogo'
                  ? 'bg-[#ffd100] text-[#6f5a00] font-bold shadow-2xs'
                  : 'text-[#4d4632] hover:bg-[#f0e7d5] hover:text-[#1f1b10]'
              }`}
            >
              Catálogo Técnico
            </button>
            <button
              onClick={() => setActiveAdvisorNav('historial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeAdvisorNav === 'historial'
                  ? 'bg-[#ffd100] text-[#6f5a00] font-bold shadow-2xs'
                  : 'text-[#4d4632] hover:bg-[#f0e7d5] hover:text-[#1f1b10]'
              }`}
            >
              Historial de Cotizaciones
            </button>
          </nav>

          {/* Right Status & Advisor Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-[#fcf3e0] rounded-full border border-[#d1c6ab]/40">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2f5ea1] animate-pulse"></span>
              <span className="text-xs text-[#4d4632] font-semibold">En línea</span>
            </div>

            {/* Notification Bell */}
            <div className="relative p-2 rounded-xl text-[#4d4632] hover:bg-[#f0e7d5] transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              <span className="absolute 1 right-1 bg-[#c00014] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                3
              </span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#d1c6ab]">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-[#1f1b10] leading-tight">
                  {currentUser?.fullName || 'Ing. Carlos Ruiz'}
                </span>
                <span className="text-[11px] text-[#7f765f] leading-tight">
                  Consultor Técnico Senior
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-[#725c00] text-white flex items-center justify-center shadow-xs">
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          TOP COMMAND & BREADCRUMB STRIP
          =================================================================== */}
      <section className="w-full bg-[#fcf3e0] px-4 sm:px-6 lg:px-8 py-5 border-b border-[#ebe2cf]">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-3">
          {/* Breadcrumb and Expediente Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[#7f765f]">
              <span className="hover:text-[#725c00] transition-colors cursor-pointer">
                Asesorías Activas
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#7f765f]" />
              <span className="text-xs text-[#1f1b10] font-bold bg-[#f0e7d5] px-2.5 py-0.5 rounded border border-[#d1c6ab]/40">
                {projectCode}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[#7f765f]" />
              <span className="text-[#4d4632] font-semibold">Diagnóstico & Cotización IA</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d6e3ff] text-[#001b3d] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#2f5ea1]" />
                Motor IA Pintuco v4.2 Activo
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#ebe2cf] text-[#4d4632] text-xs font-semibold">
                Prioridad Alta
              </span>
            </div>
          </div>

          {/* Main Header Row with Title & CTAs */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pt-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-[#1f1b10] tracking-tight">
                  Evaluación Técnica & Cotización Inteligente
                </h1>
                <span className="hidden md:inline-block px-2.5 py-0.5 rounded bg-[#ffe07f] text-[#231b00] text-xs font-black tracking-wider uppercase">
                  En Proceso
                </span>
              </div>

              {/* Metadata Pill Bar */}
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[#4d4632] text-xs sm:text-sm">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#2f5ea1]" />
                  <span className="font-semibold text-[#1f1b10]">Cliente:</span>
                  <span>{clientName}</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-[#d1c6ab]"></span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#2f5ea1] font-bold">📍</span>
                  <span>{clientAddress}</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-[#d1c6ab]"></span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[#2f5ea1] font-bold">📅</span>
                  <span>12 Mayo 2024</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-[#d1c6ab]"></span>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#725c00]" />
                  <span className="font-bold text-[#1f1b10]">Área Declarada: {projectArea} m²</span>
                  <span className="text-[#7f765f] text-xs">(Interior Residencial)</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => triggerToast('Borrador guardado exitosamente en el servidor')}
                className="px-4 py-2.5 rounded-xl bg-white text-[#1f1b10] hover:bg-[#f6eddb] transition-colors shadow-2xs text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-[#ebe2cf] cursor-pointer"
                id="btn-save-draft"
              >
                <Save className="w-4 h-4 text-[#7f765f]" />
                <span>Guardar Borrador</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#f0e7d5] text-[#2f5ea1] hover:bg-[#ebe2cf] transition-colors text-xs sm:text-sm font-bold flex items-center gap-1.5 border border-[#d1c6ab]/40 cursor-pointer"
                id="btn-preview-pdf"
              >
                <FileDown className="w-4 h-4" />
                <span>Previsualizar PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#ffd100] text-[#0d4788] hover:bg-[#ffc800] transition-all shadow-sm hover:shadow-md text-xs sm:text-sm font-black flex items-center gap-2 cursor-pointer"
                id="btn-approve-send"
              >
                <Send className="w-4 h-4" />
                <span>Aprobar y Enviar</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          WORKSPACE GRID: 2-COLUMN SPLIT (45% vs 55%)
          =================================================================== */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ===============================================================
              LEFT COLUMN: DIAGNÓSTICO DIGITAL POR IA (45% / Span 5)
              =============================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Card: Photographic Scan & Vision AI */}
            <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ffe07f] flex items-center justify-center text-[#231b00] font-bold">
                    <ScanLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#1f1b10] leading-tight">
                      Escaneo Digital de Sustrato
                    </h2>
                    <p className="text-xs text-[#7f765f]">
                      Visión artificial calibrada sobre muro de sala y comedor
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#d6e3ff] text-[#001b3d] text-xs font-black">
                  IA Confianza: 98.4%
                </span>
              </div>

              {/* Interactive Photographic Overlay Container */}
              <div className="relative w-full rounded-xl overflow-hidden bg-[#1f1b10] aspect-[4/3] group shadow-inner">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0NI0657yWS_vLxwCNyXu-WRx786-wyS41v-znOJAeyE8I7_QyGJGIoty2iMmo8Xbn5LVvX-ezlfzkJmPsckEwn3arbF9VxlsRJyGoFS0JTDJFdk9iRUnah70abm64q9UaPC-hkI3rbNIVpoCNuxrnCAml9xVdXj2lixNjkVzID6n97oxJN42M0zLwboPrzSMTGWCJBQZAWDE0GTwHOD5eaa7il_izE1nkUOa2UUuyAA-AJR0Hz6h-Pw"
                  alt="Living room scan"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

                {/* Bounding Box 1: Focal Wall */}
                <div className="absolute top-[18%] left-[22%] w-[48%] h-[56%] border-2 border-dashed border-[#ffd100] rounded-xl pointer-events-none flex flex-col justify-between p-2 bg-[#ffd100]/10 backdrop-blur-[1px]">
                  <div className="self-start px-2 py-0.5 rounded bg-[#ffd100] text-[#0d4788] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c00014] animate-ping"></span>
                    <span>Muro Principal A-1</span>
                  </div>
                  <div className="self-end px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                    Área: 26.4 m²
                  </div>
                </div>

                {/* Bounding Box 2: Lateral Perimeter */}
                <div className="absolute top-[28%] right-[4%] w-[24%] h-[54%] border-2 border-dotted border-[#2f5ea1] rounded-xl pointer-events-none flex flex-col justify-between p-2 bg-[#2f5ea1]/10">
                  <div className="self-start px-2 py-0.5 rounded bg-[#2f5ea1] text-white text-[10px] font-bold uppercase">
                    Perímetro B
                  </div>
                  <div className="self-end px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                    Área: 18.6 m²
                  </div>
                </div>

                {/* AI HUD Live Sensor Floating Pill */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 p-3 rounded-xl bg-white/95 backdrop-blur-md text-[#1f1b10] shadow-md border border-white/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-[#2f5ea1] animate-pulse"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[#7f765f] leading-tight font-medium">
                        Superficie Total Estimada
                      </span>
                      <span className="text-xs font-bold text-[#1f1b10]">
                        45.00 m² (Precisión ±0.2%)
                      </span>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-[#d1c6ab]"></div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-[#7f765f] leading-tight font-medium">
                      Higrometría
                    </span>
                    <span className="text-xs font-bold text-[#2f5ea1]">4.2% Humedad</span>
                  </div>
                </div>
              </div>

              {/* Micro AI Diagnostics Readings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Metric 1: Porosidad */}
                <div className="p-3.5 rounded-xl bg-[#f6eddb] border border-[#ebe2cf] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#7f765f] font-semibold">Porosidad Muro</span>
                    <GripHorizontal className="w-4 h-4 text-[#725c00]" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-[#1f1b10]">38%</span>
                    <span className="text-xs text-[#4d4632] font-semibold">Media-Alta</span>
                  </div>
                  <div className="w-full bg-[#f0e7d5] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#725c00] h-full rounded-full" style={{ width: '38%' }}></div>
                  </div>
                  <span className="text-[11px] text-[#4d4632]">Requiere sellado previo uniforme</span>
                </div>

                {/* Metric 2: Condición del Sustrato */}
                <div className="p-3.5 rounded-xl bg-[#f6eddb] border border-[#ebe2cf] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#7f765f] font-semibold">Nivel Humedad</span>
                    <Droplets className="w-4 h-4 text-[#2f5ea1]" />
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-[#2f5ea1]">4.2%</span>
                    <span className="text-xs text-[#7f765f] font-medium">Óptimo (&lt;6%)</span>
                  </div>
                  <div className="w-full bg-[#f0e7d5] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#2f5ea1] h-full rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <span className="text-[11px] text-[#2f5ea1] font-bold">
                    Apto para aplicación inmediata
                  </span>
                </div>
              </div>
            </div>

            {/* Card: Patologías y Hallazgos (Asesor Validation) */}
            <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f0e7d5] flex items-center justify-center text-[#1f1b10] font-bold">
                    <CheckSquare className="w-5 h-5 text-[#2f5ea1]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#1f1b10]">
                      Validación de Patologías del Sustrato
                    </h3>
                    <p className="text-xs text-[#7f765f]">
                      El asesor valida y confirma las alertas generadas por IA
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#7f765f] font-medium">3 verificados</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Item 1 */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] hover:bg-[#f6eddb] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pathologies.sellador}
                    onChange={(e) =>
                      setPathologies((prev) => ({ ...prev, sellador: e.target.checked }))
                    }
                    className="mt-1 w-4 h-4 accent-[#725c00] rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                        Sellador Antihumedad 501 Requerido
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#ffe07f] text-[#231b00] text-[10px] font-black">
                        Bloqueo Alcalino
                      </span>
                    </div>
                    <span className="text-xs text-[#4d4632] mt-0.5">
                      Estuco tradicional con alcalinidad latente. Se recomienda 1 mano para
                      garantizar anclaje.
                    </span>
                  </div>
                </label>

                {/* Item 2 */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] hover:bg-[#f6eddb] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pathologies.microfisuras}
                    onChange={(e) =>
                      setPathologies((prev) => ({ ...prev, microfisuras: e.target.checked }))
                    }
                    className="mt-1 w-4 h-4 accent-[#725c00] rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                        Microfisuras no estructurales (&lt; 0.5mm)
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#d6e3ff] text-[#001b3d] text-[10px] font-black">
                        Resane Menor
                      </span>
                    </div>
                    <span className="text-xs text-[#4d4632] mt-0.5">
                      Detección en esquinas de vano de ventana. Incorporar 1 kg de Masilla Acrílica.
                    </span>
                  </div>
                </label>

                {/* Item 3 */}
                <label className="flex items-start gap-3 p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] opacity-75 hover:opacity-100 transition-opacity cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pathologies.grasa}
                    onChange={(e) =>
                      setPathologies((prev) => ({ ...prev, grasa: e.target.checked }))
                    }
                    className="mt-1 w-4 h-4 accent-[#725c00] rounded cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-medium text-[#1f1b10]">
                        Presencia de grasa o contaminantes grasos
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#f6eddb] text-[#7f765f] text-[10px]">
                        No Detectado
                      </span>
                    </div>
                    <span className="text-xs text-[#7f765f] mt-0.5">
                      Muro limpio. No requiere lavado especial ni desengrasante previo.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Card: Prescripción de Pintura & Paleta Seleccionada */}
            <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#d6e3ff] flex items-center justify-center text-[#001b3d]">
                    <Palette className="w-5 h-5 text-[#2f5ea1]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#1f1b10]">
                      Sistema de Pintura Pintuco
                    </h3>
                    <p className="text-xs text-[#7f765f]">
                      Línea de máxima lavabilidad y confort ambiental
                    </p>
                  </div>
                </div>
                <span className="text-xs text-[#2f5ea1] font-bold">Línea Premium</span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#7f765f] uppercase font-bold tracking-wider">
                    Producto Base Prescrito
                  </label>
                  <div className="p-3.5 rounded-xl bg-[#f6eddb] border border-[#ebe2cf] flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#1f1b10]">
                        Viniltex Avanzado Antibacterial
                      </span>
                      <span className="text-xs text-[#4d4632]">
                        Base Agua • Acabado Satinado • Máxima Lavabilidad
                      </span>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-[#2f5ea1]" />
                  </div>
                </div>

                {/* Color Swatches Prescribed */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#7f765f] uppercase font-bold tracking-wider">
                    Carta de Color Asignada
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Color 1 */}
                    <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl shadow-xs shrink-0 border border-black/10"
                        style={{ backgroundColor: '#df8c72' }}
                      ></div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[#1f1b10] truncate">
                          Salmón Terracota
                        </span>
                        <span className="text-[11px] text-[#7f765f] font-mono">
                          Cód. 248-A (Muro Acentuado)
                        </span>
                      </div>
                    </div>

                    {/* Color 2 */}
                    <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl shadow-xs shrink-0 border border-black/15"
                        style={{ backgroundColor: '#f7f5ed' }}
                      ></div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[#1f1b10] truncate">
                          Blanco Lienzo
                        </span>
                        <span className="text-[11px] text-[#7f765f] font-mono">
                          Cód. 100-B (Perímetro)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===============================================================
              RIGHT COLUMN: MOTOR DE CÁLCULO & COTIZACIÓN (55% / Span 7)
              =============================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* CARD 1: CALCULADORA ASISTIDA POR IA (DOSIFICACIÓN EXACTA) */}
            <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#ffd100] flex items-center justify-center text-[#0d4788] font-bold">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#1f1b10]">
                      Calculadora Técnica Asistida por IA
                    </h2>
                    <p className="text-xs text-[#7f765f]">
                      Rendimiento volumétrico calibrado según rugosidad y absorción
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-[#f6eddb] px-3 py-1 rounded-lg self-start sm:self-auto border border-[#d1c6ab]/40">
                  <span className="text-xs text-[#7f765f]">Merma IA:</span>
                  <span className="text-xs text-[#1f1b10] font-black">+{mermaPercent}%</span>
                </div>
              </div>

              {/* Calculation Formula Matrix Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-[#fcf3e0] rounded-xl border border-[#ebe2cf] text-center">
                <div className="flex flex-col p-1">
                  <span className="text-[11px] text-[#7f765f]">Área Neta</span>
                  <span className="text-sm font-black text-[#1f1b10]">{projectArea}.0 m²</span>
                </div>
                <div className="flex flex-col p-1 border-l border-[#ebe2cf]">
                  <span className="text-[11px] text-[#7f765f]">Sellador</span>
                  <span className="text-sm font-black text-[#2f5ea1]">1 Mano</span>
                </div>
                <div className="flex flex-col p-1 border-l border-[#ebe2cf]">
                  <span className="text-[11px] text-[#7f765f]">Viniltex</span>
                  <span className="text-sm font-black text-[#2f5ea1]">2 Manos</span>
                </div>
                <div className="flex flex-col p-1 border-l border-[#ebe2cf]">
                  <span className="text-[11px] text-[#7f765f]">Factor Cobertura</span>
                  <span className="text-sm font-black text-[#1f1b10]">94.2%</span>
                </div>
              </div>

              {/* Dosification Output Grid */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] text-[#7f765f] uppercase font-bold tracking-wider">
                  Dosificación de Producto Requerida
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Item 1 Dosificación */}
                  <div className="p-3.5 rounded-xl bg-[#f6eddb] border border-[#ebe2cf] flex flex-col justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#7f765f]">Muro Acentuado (26.4 m²)</span>
                      <span className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                        Viniltex Terracota
                      </span>
                      <span className="text-xs text-[#4d4632]">1.5 Galones requeridos</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#ebe2cf]">
                      <span className="text-xs font-bold text-[#2f5ea1]">1 Gal + 2 Cuartos</span>
                      <CheckCircle2 className="w-4 h-4 text-[#725c00]" />
                    </div>
                  </div>

                  {/* Item 2 Dosificación */}
                  <div className="p-3.5 rounded-xl bg-[#f6eddb] border border-[#ebe2cf] flex flex-col justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#7f765f]">Perímetro Blanco (18.6 m²)</span>
                      <span className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                        Viniltex Blanco Lienzo
                      </span>
                      <span className="text-xs text-[#4d4632]">0.9 Galones requeridos</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#ebe2cf]">
                      <span className="text-xs font-bold text-[#2f5ea1]">1 Galón</span>
                      <CheckCircle2 className="w-4 h-4 text-[#725c00]" />
                    </div>
                  </div>

                  {/* Item 3 Dosificación */}
                  <div className="p-3.5 rounded-xl bg-[#f6eddb] border border-[#ebe2cf] flex flex-col justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-[#7f765f]">Acondicionamiento (45 m²)</span>
                      <span className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                        Sellador Acrílico 501
                      </span>
                      <span className="text-xs text-[#4d4632]">Rendimiento: 42 m²/gal</span>
                    </div>
                    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#ebe2cf]">
                      <span className="text-xs font-bold text-[#2f5ea1]">1 Galón</span>
                      <CheckCircle2 className="w-4 h-4 text-[#725c00]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Adjusters Slider Section */}
              <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Sliders className="w-5 h-5 text-[#2f5ea1]" />
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                      Ajuste de Merma Manual
                    </span>
                    <span className="text-xs text-[#7f765f]">
                      Calibración por experiencia de campo
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-64">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={mermaPercent}
                    onChange={(e) => setMermaPercent(Number(e.target.value))}
                    className="w-full accent-[#725c00] cursor-pointer"
                  />
                  <span className="text-sm font-black text-[#1f1b10] min-w-[36px] text-right">
                    {mermaPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 2: GENERACIÓN DE PROPUESTA TÉCNICO-COMERCIAL & COTIZACIÓN */}
            <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#f0e7d5] flex items-center justify-center text-[#1f1b10]">
                    <Receipt className="w-5 h-5 text-[#2f5ea1]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-[#1f1b10]">
                      Propuesta Técnico-Comercial
                    </h2>
                    <p className="text-xs text-[#7f765f]">
                      Valores expresados en COP con lista oficial de precios Pintuco 2024
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded bg-[#f0e7d5] font-mono text-xs text-[#7f765f] font-bold">
                  REF-COT-8924
                </span>
              </div>

              {/* Quotation Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-[#1f1b10]">
                  <thead>
                    <tr className="bg-[#f0e7d5] text-[#1f1b10] text-[11px] uppercase tracking-wider font-bold">
                      <th className="py-2.5 px-3 rounded-l-lg">Ítem / Referencia</th>
                      <th className="py-2.5 px-2">Presentación</th>
                      <th className="py-2.5 px-2 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Unitario</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebe2cf]/50">
                    {/* Row 1 */}
                    <tr className="hover:bg-[#f6eddb]/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1f1b10]">
                            Viniltex Avanzado Antibacterial
                          </span>
                          <span className="text-[11px] text-[#7f765f]">
                            Salmón Terracota #248-A • Cód. 1024589
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-[#4d4632]">Galón</td>
                      <td className="py-2.5 px-2 text-center font-bold">1</td>
                      <td className="py-2.5 px-3 text-right text-xs font-mono text-[#4d4632]">
                        $115.900
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1f1b10]">
                        $115.900
                      </td>
                    </tr>
                    {/* Row 2 */}
                    <tr className="hover:bg-[#f6eddb]/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1f1b10]">
                            Viniltex Avanzado Antibacterial
                          </span>
                          <span className="text-[11px] text-[#7f765f]">
                            Salmón Terracota #248-A • Cód. 1024590
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-[#4d4632]">Cuarto (1/4 Gal)</td>
                      <td className="py-2.5 px-2 text-center font-bold">2</td>
                      <td className="py-2.5 px-3 text-right text-xs font-mono text-[#4d4632]">
                        $34.000
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1f1b10]">
                        $68.000
                      </td>
                    </tr>
                    {/* Row 3 */}
                    <tr className="hover:bg-[#f6eddb]/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1f1b10]">
                            Viniltex Avanzado Antibacterial
                          </span>
                          <span className="text-[11px] text-[#7f765f]">
                            Blanco Lienzo #100-B • Cód. 1024501
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-[#4d4632]">Galón</td>
                      <td className="py-2.5 px-2 text-center font-bold">1</td>
                      <td className="py-2.5 px-3 text-right text-xs font-mono text-[#4d4632]">
                        $112.900
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1f1b10]">
                        $112.900
                      </td>
                    </tr>
                    {/* Row 4 */}
                    <tr className="hover:bg-[#f6eddb]/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1f1b10]">
                            Sellador Acrílico Antihumedad 501
                          </span>
                          <span className="text-[11px] text-[#7f765f]">
                            Base Acrílica Sellante • Cód. 1018944
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-[#4d4632]">Galón</td>
                      <td className="py-2.5 px-2 text-center font-bold">1</td>
                      <td className="py-2.5 px-3 text-right text-xs font-mono text-[#4d4632]">
                        $74.500
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1f1b10]">
                        $74.500
                      </td>
                    </tr>
                    {/* Row 5 */}
                    <tr className="hover:bg-[#f6eddb]/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#1f1b10]">
                            Kit de Aplicación & Resane Pro
                          </span>
                          <span className="text-[11px] text-[#7f765f]">
                            Rodillo Felpa 9" + Cinta Azul 1.5" + Masilla 1kg
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-[#4d4632]">Kit Completo</td>
                      <td className="py-2.5 px-2 text-center font-bold">1</td>
                      <td className="py-2.5 px-3 text-right text-xs font-mono text-[#4d4632]">
                        $48.500
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#1f1b10]">
                        $48.500
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Ledger */}
              <div className="bg-[#fcf3e0] p-4 rounded-xl border border-[#ebe2cf] flex flex-col gap-2 ml-auto w-full md:w-80">
                <div className="flex justify-between items-center text-xs text-[#4d4632]">
                  <span>Subtotal Productos:</span>
                  <span className="font-mono text-[#1f1b10] font-bold">
                    {formatCOP(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#ba1a1a] font-medium">
                  <span className="flex items-center gap-1">
                    <span>Descuento Asesor (-10%)</span>
                  </span>
                  <span className="font-mono">-{formatCOP(discountAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-[#4d4632]">
                  <span>IVA (19%):</span>
                  <span className="font-mono text-[#1f1b10] font-bold">
                    {formatCOP(ivaAmount)}
                  </span>
                </div>
                <div className="h-px bg-[#d1c6ab] my-0.5"></div>
                <div className="flex justify-between items-center text-[#1f1b10]">
                  <span className="text-base font-black">TOTAL:</span>
                  <span className="text-xl font-black text-[#2f5ea1] font-mono">
                    {formatCOP(grandTotal)}
                  </span>
                </div>
                <span className="text-[10px] text-[#7f765f] text-right">
                  Precios netos en Pesos Colombianos (COP)
                </span>
              </div>

              {/* Technical Notes Textarea Pre-filled by AI */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1f1b10] flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#725c00]" />
                    <span>Concepto Técnico & Recomendaciones de Aplicación</span>
                  </label>
                  <span className="text-[11px] text-[#2f5ea1] font-bold">
                    Generado por IA • Editable
                  </span>
                </div>
                <textarea
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  className="w-full p-3.5 bg-[#f6eddb] border border-[#ebe2cf] rounded-xl text-xs sm:text-sm text-[#1f1b10] focus:outline-none focus:ring-2 focus:ring-[#2f5ea1] resize-none leading-relaxed"
                  rows={3}
                />
              </div>

              {/* Shipping Logistics Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#f6eddb] border border-[#ebe2cf] rounded-xl">
                <div className="flex items-center gap-3">
                  <Truck className="w-6 h-6 text-[#2f5ea1] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1f1b10]">
                      Envío a Domicilio (Bogotá)
                    </span>
                    <span className="text-[11px] text-[#2f5ea1] font-bold">
                      Gratis (Compra superior a $200.000)
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-start sm:justify-end gap-2">
                  <span className="text-xs text-[#7f765f]">Fecha Estimada:</span>
                  <span className="px-3 py-1 rounded-lg bg-white border border-[#ebe2cf] text-xs font-bold text-[#1f1b10]">
                    24 de Mayo, 2024
                  </span>
                </div>
              </div>

              {/* Final Commercial Dispatch Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSapModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#f6eddb] hover:bg-[#f0e7d5] text-[#1f1b10] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-[#d1c6ab]/40 transition-colors cursor-pointer"
                  id="btn-generate-sap"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#2f5ea1]" />
                  <span>Generar Orden SAP</span>
                </button>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <a
                    href={`https://wa.me/573124589201?text=Hola%20${encodeURIComponent(
                      clientName
                    )},%20te%20comparto%20el%20diagnostico%20oficial%20Pintuco%20${projectCode}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#25D366] text-white hover:bg-[#20ba59] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Cliente</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      triggerToast('Cotización oficial REF-COT-8924 enviada al cliente por correo');
                    }}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#2f5ea1] text-white hover:bg-[#264b82] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                    id="btn-send-official-quote"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Cotización Oficial</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          PINTUCO PRO INTERNAL FOOTER
          =================================================================== */}
      <footer className="w-full bg-[#fcf3e0] border-t border-[#ebe2cf] mt-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-[#1f1b10]">PINTUCO</span>
              <span className="text-xs text-[#7f765f]">
                | Red Interna de Asistencia Técnica
              </span>
            </div>
            <p className="text-xs text-[#4d4632] text-center md:text-left">
              Plataforma corporativa exclusiva para consultores y asesores de recubrimientos
              industriales y arquitectónicos.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#4d4632] font-semibold">
            <a href="#" className="hover:text-[#1f1b10] transition-colors">
              Mesa de Ayuda TI Interna
            </a>
            <a href="#" className="hover:text-[#1f1b10] transition-colors">
              Políticas de Garantías y Laboratorio
            </a>
            <a href="#" className="hover:text-[#1f1b10] transition-colors">
              Fichas de Seguridad (MSDS)
            </a>
          </div>

          <div className="text-xs text-[#7f765f] text-center md:text-right">
            © 2024 Pintuco S.A. Todos los derechos reservados. Uso estrictamente confidencial.
          </div>
        </div>
      </footer>

      {/* ===================================================================
          MODALS: PDF PREVIEW, SAP ORDER & APPROVAL
          =================================================================== */}
      {/* 1. PDF Preview Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#ebe2cf]">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd100] text-[#0d4788] flex items-center justify-center font-black">
                  PDF
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1f1b10]">
                    Previsualización: Propuesta Técnico-Comercial Oficial
                  </h3>
                  <p className="text-xs text-[#7f765f]">Documento Certificado Pintuco Colombia S.A.S.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="w-9 h-9 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Simulated PDF sheet */}
            <div className="bg-[#fcf3e0] p-6 rounded-2xl border border-[#d1c6ab] text-xs sm:text-sm text-[#1f1b10] space-y-4">
              <div className="flex justify-between items-start border-b border-[#d1c6ab] pb-4">
                <div>
                  <span className="text-xl font-black text-[#725c00]">PINTUCO COLOMBIA</span>
                  <p className="text-[11px] text-[#7f765f]">NIT 890.900.123-1 • Rionegro, Antioquia</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-[#2f5ea1]">REF-COT-8924</span>
                  <p className="text-[11px] text-[#7f765f]">Emisión: 12 Mayo 2024</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-[#7f765f] uppercase font-bold block">Cliente:</span>
                  <strong className="text-sm">{clientName}</strong>
                  <p className="text-xs text-[#4d4632]">{clientAddress}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-[#7f765f] uppercase font-bold block">Asesor Asignado:</span>
                  <strong className="text-sm">{currentUser?.fullName || 'Ing. Carlos Ruiz'}</strong>
                  <p className="text-xs text-[#4d4632]">Consultor Técnico Senior Pintuco</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white border border-[#ebe2cf]">
                <strong className="text-xs text-[#725c00] block mb-1">Concepto Técnico Asesor:</strong>
                <p className="text-xs text-[#4d4632] italic">{technicalNotes}</p>
              </div>

              <div className="flex justify-between items-center pt-2 font-bold text-base border-t border-[#d1c6ab]">
                <span>Total Cotizado (con IVA):</span>
                <span className="text-xl text-[#2f5ea1] font-mono">{formatCOP(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="px-5 py-2.5 rounded-full border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb]"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPdfModal(false);
                  triggerToast('Descarga del PDF oficial iniciada');
                }}
                className="px-6 py-2.5 rounded-full bg-[#ffd100] text-[#0d4788] text-xs font-black hover:bg-[#ffc800] transition-colors flex items-center gap-2"
              >
                <FileDown className="w-4 h-4" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. SAP Integration Modal */}
      {showSapModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf]">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2f5ea1] text-white flex items-center justify-center font-bold">
                  SAP
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1f1b10]">Integración SAP S/4HANA</h3>
                  <p className="text-xs text-[#7f765f]">Pintuco Colombia ERP Connector</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSapModal(false)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#4d4632] mb-4 leading-relaxed">
              Se creará una <strong>Orden de Pedido de Venta (VA01)</strong> en el sistema central de
              Pintuco con reserva de inventario en la Planta Rionegro.
            </p>

            <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] space-y-2 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-[#7f765f]">Organización de Ventas:</span>
                <strong className="font-mono">CO01 (Pintuco Col)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7f765f]">Canal de Distribución:</span>
                <strong className="font-mono">10 (Directo / Proyectos)</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7f765f]">Valor Neto Pedido:</span>
                <strong className="font-mono text-[#2f5ea1]">{formatCOP(grandTotal)}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSapModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSapModal(false);
                  triggerToast('Orden SAP #450098231 creada y sincronizada con éxito');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#2f5ea1] text-white text-xs font-bold hover:bg-[#264b82] transition-colors"
              >
                Confirmar Orden SAP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Approve & Send Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf]">
            <div className="w-12 h-12 rounded-2xl bg-[#d6e3ff] text-[#2f5ea1] flex items-center justify-center mb-4">
              <Send className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-[#1f1b10] mb-2">
              ¿Aprobar y Notificar al Cliente?
            </h3>

            <p className="text-xs text-[#4d4632] leading-relaxed mb-5">
              Al confirmar, el cliente <strong>{clientName}</strong> recibirá por correo y en su
              portal de seguimiento el expediente técnico validado, la fórmula de color y la
              cotización oficial por un total de <strong>{formatCOP(grandTotal)}</strong>.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb]"
              >
                Seguir Editando
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowApproveModal(false);
                  triggerToast('¡Proyecto aprobado y notificado al cliente exitosamente!');
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#ffd100] text-[#0d4788] text-xs font-black hover:bg-[#ffc800] transition-colors"
              >
                Aprobar y Enviar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
