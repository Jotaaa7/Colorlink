import React, { useState } from 'react';
import { UserProfile, ProjectRequest, QuotationItem } from '../types';
import { PintucoCatalogItem } from '../data/pintucoProducts';
import { AdvisorSidebar, AdvisorNavTab } from './advisor/AdvisorSidebar';
import { AdvisorRequestsView } from './advisor/AdvisorRequestsView';
import { AdvisorCatalogView } from './advisor/AdvisorCatalogView';
import { AdvisorInventoryView } from './advisor/AdvisorInventoryView';
import { AdvisorHistoryView } from './advisor/AdvisorHistoryView';
import { AdvisorStatusModal, ValidProjectStatus } from './advisor/AdvisorStatusModal';
import { getProjectPhaseLockInfo } from '../lib/projectStatusRules';
import { sendProjectStatusNotification } from '../services/renderDbService';
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
  ChevronDown,
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
  SlidersHorizontal,
  Receipt,
  Truck,
  MessageCircle,
  FileSpreadsheet,
  Check,
  X,
  Plus,
  Minus,
  Trash2,
  Printer,
  ArrowRight,
  HelpCircle,
  Info,
  LogOut,
  Layers,
  Menu,
  Clock,
  ExternalLink,
  Factory,
  RefreshCw,
  Warehouse,
  FileText,
} from 'lucide-react';

interface AdvisorEvaluationScreenProps {
  currentUser: UserProfile | null;
  request: ProjectRequest | null;
  onSwitchToAdvisorAccount: () => void;
  onOpenLogin: () => void;
  onNavigateHome: () => void;
  onNavigateToInventory?: () => void;
  onUpdateProject?: (updatedRequest: ProjectRequest) => void;
}

export const AdvisorEvaluationScreen: React.FC<AdvisorEvaluationScreenProps> = ({
  currentUser,
  request,
  onSwitchToAdvisorAccount,
  onOpenLogin,
  onNavigateHome,
  onNavigateToInventory,
  onUpdateProject,
}) => {
  // Check authorization
  const isAuthorized =
    currentUser &&
    (currentUser.role === 'Especialista Técnico Pintuco' ||
      currentUser.role === 'Asesor Comercial / Técnico' ||
      currentUser.role === 'Administrador Pintuco');

  // Sidebar navigation and layout state
  const [activeAdvisorNav, setActiveAdvisorNav] = useState<AdvisorNavTab>('diagnostico');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Active project under diagnostic inspection
  const [activeRequest, setActiveRequest] = useState<ProjectRequest | null>(request);
  const lockInfo = getProjectPhaseLockInfo(activeRequest?.status);

  // Interactive diagnostic state
  const [mermaPercent, setMermaPercent] = useState<number>(8);
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

  // Interactive quotation line items state
  const defaultItems: QuotationItem[] = [
    {
      sku: '1024589',
      name: 'Viniltex Avanzado Antibacterial (Salmón Terracota #248-A)',
      type: 'Pintura Acabado',
      unit: 'Galón',
      quantity: 1,
      unitPriceCOP: 115900,
      totalCOP: 115900,
      hasColors: true,
      selectedColorName: 'Salmón Terracota',
      selectedColorHex: '#df8c72',
      selectedColorCode: '248-A',
    },
    {
      sku: '1024590',
      name: 'Viniltex Avanzado Antibacterial (Salmón Terracota #248-A)',
      type: 'Pintura Acabado',
      unit: 'Cuarto (1/4 Gal)',
      quantity: 2,
      unitPriceCOP: 34000,
      totalCOP: 68000,
      hasColors: true,
      selectedColorName: 'Salmón Terracota',
      selectedColorHex: '#df8c72',
      selectedColorCode: '248-A',
    },
    {
      sku: '1024501',
      name: 'Viniltex Avanzado Antibacterial (Blanco Lienzo #100-B)',
      type: 'Pintura Acabado',
      unit: 'Galón',
      quantity: 1,
      unitPriceCOP: 112900,
      totalCOP: 112900,
      hasColors: true,
      selectedColorName: 'Blanco Lienzo',
      selectedColorHex: '#f7f5ed',
      selectedColorCode: '100-B',
    },
    {
      sku: '1018944',
      name: 'Sellador Acrílico Antihumedad 501',
      type: 'Imprimante',
      unit: 'Galón',
      quantity: 1,
      unitPriceCOP: 74500,
      totalCOP: 74500,
      hasColors: false,
    },
    {
      sku: 'ACC-KIT-PRO',
      name: 'Kit de Aplicación & Resane Pro (Rodillo + Cinta + Masilla)',
      type: 'Herramientas',
      unit: 'Kit Completo',
      quantity: 1,
      unitPriceCOP: 48500,
      totalCOP: 48500,
      hasColors: false,
    },
  ];

  const [quoteItems, setQuoteItems] = useState<QuotationItem[]>(() => {
    if (activeRequest?.quotation?.items && activeRequest.quotation.items.length > 0) {
      return activeRequest.quotation.items;
    }
    return defaultItems;
  });

  // Modals state
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showSapModal, setShowSapModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => {
      setNotificationToast(null);
    }, 4000);
  };

  const handleSaveProjectStatus = (
    newStatus: ValidProjectStatus,
    advisorNote?: string,
    trackingNumber?: string
  ) => {
    if (!activeRequest) return;
    const updatedRequest: ProjectRequest = {
      ...activeRequest,
      status: newStatus,
      technicalReviewNotes: advisorNote || activeRequest.technicalReviewNotes,
      trackingNumber: trackingNumber || activeRequest.trackingNumber,
      ...(newStatus === 'Aprobada QA' || newStatus === 'Inventario Asignado'
        ? { approvedAt: activeRequest.approvedAt || new Date().toISOString() }
        : {}),
      ...(newStatus === 'Completada' ? { completedAt: new Date().toISOString() } : {}),
    };
    const previousStatus = activeRequest.status;
    setActiveRequest(updatedRequest);
    if (onUpdateProject) {
      onUpdateProject(updatedRequest);
    }
    // Asynchronously dispatch email notification to the customer
    sendProjectStatusNotification(updatedRequest, newStatus, previousStatus).then((res) => {
      if (res.success && res.result?.success) {
        triggerToast(
          `Estado de ${projectCode} actualizado a "${newStatus}" • Correo enviado al cliente (${res.result.provider || 'SMTP'})`
        );
      }
    });
    triggerToast(`Estado del proyecto ${projectCode} actualizado a: "${newStatus}" exitosamente`);
  };

  // Helper for status badge, colors and progress
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'Completada':
        return {
          phaseLabel: 'Fase 5 de 5',
          phaseName: 'Entregado en Obra',
          badgeBg: 'bg-[#dcfce7] text-[#166534] border-[#86efac]',
          icon: Truck,
          stepNumber: 5,
          percent: 100,
        };
      case 'Aprobada QA':
        return {
          phaseLabel: 'Fase 4 de 5',
          phaseName: 'Calidad Certificada QA',
          badgeBg: 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]',
          icon: ShieldCheck,
          stepNumber: 4,
          percent: 90,
        };
      case 'En Producción':
        return {
          phaseLabel: 'Fase 4 de 5',
          phaseName: 'En Fabricación y Mezcla',
          badgeBg: 'bg-[#e1edff] text-[#0d4788] border-[#bfdbfe]',
          icon: Factory,
          stepNumber: 4,
          percent: 80,
        };
      case 'Inventario Asignado':
        return {
          phaseLabel: 'Fase 4 de 5',
          phaseName: 'Lote Bloqueado SAP',
          badgeBg: 'bg-[#e6f4ea] text-[#137333] border-[#bbf7d0]',
          icon: Warehouse,
          stepNumber: 4,
          percent: 70,
        };
      case 'Cotizada':
        return {
          phaseLabel: 'Fase 3 de 5',
          phaseName: 'Cotización Oficial Emitida',
          badgeBg: 'bg-[#ffe07f] text-[#231b00] border-[#fde047]',
          icon: FileText,
          stepNumber: 3,
          percent: 55,
        };
      case 'Analizada por IA':
        return {
          phaseLabel: 'Fase 2 de 5',
          phaseName: 'Diagnóstico IA Completado',
          badgeBg: 'bg-[#d6e3ff] text-[#001b3d] border-[#bfdbfe]',
          icon: Sparkles,
          stepNumber: 2,
          percent: 35,
        };
      default:
        return {
          phaseLabel: 'Fase 1 de 5',
          phaseName: 'Solicitud Recibida',
          badgeBg: 'bg-[#f6eddb] text-[#725c00] border-[#d1c6ab]',
          icon: Clock,
          stepNumber: 1,
          percent: 20,
        };
    }
  };

  // Quantity adjusting handlers
  const handleUpdateItemQty = (index: number, delta: number) => {
    if (!lockInfo.canEditQuantities) {
      triggerToast(
        `Modificación bloqueada: No se pueden alterar cantidades en fase "${activeRequest?.status}" (${lockInfo.badgeLabel}).`
      );
      return;
    }
    setQuoteItems((prev) => {
      const copy = [...prev];
      const item = copy[index];
      const newQty = Math.max(1, item.quantity + delta);
      copy[index] = {
        ...item,
        quantity: newQty,
        totalCOP: Math.round(newQty * item.unitPriceCOP),
      };
      return copy;
    });
  };

  const handleDeleteItem = (index: number) => {
    if (!lockInfo.canRemoveProducts) {
      triggerToast(
        `Eliminación bloqueada: No se pueden quitar productos en fase "${activeRequest?.status}" (${lockInfo.badgeLabel}).`
      );
      return;
    }
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
    triggerToast('Ítem eliminado de la propuesta');
  };

  const handleAddProductToQuote = (prod: PintucoCatalogItem) => {
    if (!lockInfo.canAddProducts) {
      triggerToast(
        `Acción bloqueada: No se pueden agregar productos a un proyecto en fase "${activeRequest?.status}" (${lockInfo.badgeLabel}).`
      );
      return;
    }
    const newItem: QuotationItem = {
      sku: prod.sku,
      name: prod.name,
      type: prod.category,
      unit: 'Galón',
      quantity: 1,
      unitPriceCOP: prod.priceCOP,
      totalCOP: prod.priceCOP,
      hasColors: prod.hasColors,
    };
    setQuoteItems((prev) => [newItem, ...prev]);
    setActiveAdvisorNav('diagnostico');
    triggerToast(`"${prod.name}" añadido a la cotización activa`);
  };

  const handleSelectRequestForDiagnosis = (selectedReq: ProjectRequest) => {
    setActiveRequest(selectedReq);
    if (selectedReq.quotation?.items && selectedReq.quotation.items.length > 0) {
      setQuoteItems(selectedReq.quotation.items);
    }
    setActiveAdvisorNav('diagnostico');
  };

  // Dynamic Pricing calculations
  const subtotal = quoteItems.reduce((acc, curr) => acc + curr.totalCOP, 0);
  const discountRate = 0.1; // 10% asesor standard discount
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
  const clientName = activeRequest?.client?.fullName || 'Andrés Cepeda';
  const clientAddress = activeRequest?.address || 'Bogotá, Calle 127 # 19-45';
  const projectCode = activeRequest?.id || 'PTC-2024-8924';
  const projectArea = activeRequest?.areaM2 || 45;

  // =========================================================================
  // 1. RESTRICTED ACCESS SCREEN (If user is NOT an Advisor or Admin)
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="min-h-[80vh] bg-[#fff8f0] flex items-center justify-center p-4 md:p-8">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-[#ebe2cf] p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#ffd100]/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col items-center text-center">
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

            <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onSwitchToAdvisorAccount}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="btn-unlock-advisor-demo"
              >
                <UserCheck className="w-5 h-5 text-[#0d4788]" />
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
              className="mt-6 text-xs font-bold text-[#7f765f] hover:text-[#1f1b10] transition-colors underline decoration-dotted cursor-pointer"
            >
              Volver al Portal de Cliente y Solicitudes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active view title mapping
  const getNavTitle = (tab: AdvisorNavTab) => {
    switch (tab) {
      case 'diagnostico':
        return 'Diagnóstico & Evaluación IA';
      case 'solicitudes':
        return 'Solicitudes Pendientes';
      case 'inventario':
        return 'Inventario Multisede & Bloqueo SAP';
      case 'catalogo':
        return 'Catálogo Técnico Pintuco';
      case 'historial':
        return 'Historial de Cotizaciones & Órdenes';
    }
  };

  // =========================================================================
  // 2. AUTHORIZED SCREEN: PINTUCO PRO - WITH SIDEBAR NAVIGATION
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#fff8f0] text-[#1f1b10] font-sans antialiased flex flex-col">
      {/* Toast notification */}
      {notificationToast && (
        <div className="fixed top-24 right-6 z-50 bg-[#1f1b10] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#ffd100] animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#ffd100] shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{notificationToast}</span>
        </div>
      )}

      {/* ===================================================================
          SIDEBAR (BARRA LATERAL) COMPONENT
          =================================================================== */}
      <AdvisorSidebar
        activeNav={activeAdvisorNav}
        onSelectNav={(tab) => {
          setActiveAdvisorNav(tab);
          triggerToast(`Sección "${getNavTitle(tab)}" cargada correctamente`);
        }}
        currentUser={currentUser}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNavigateHome={onNavigateHome}
        onOpenLogin={onOpenLogin}
        isOpenMobile={isOpenMobileSidebar}
        onCloseMobile={() => setIsOpenMobileSidebar(false)}
        pendingCount={4}
      />

      {/* ===================================================================
          MAIN CONTENT AREA (SHIFTS WITH SIDEBAR WIDTH)
          =================================================================== */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-h-screen ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        }`}
      >
        {/* Top Header Command Bar */}
        <header className="sticky top-0 z-30 bg-[#fff8f0]/95 backdrop-blur-md border-b border-[#ebe2cf] shadow-2xs">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Left: Mobile hamburger & breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpenMobileSidebar(true)}
                className="lg:hidden p-2 rounded-xl bg-white border border-[#ebe2cf] text-[#4d4632] hover:bg-[#f6eddb] transition-colors"
                title="Abrir menú lateral"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#7f765f] hidden sm:inline">Portal Asesor</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#d1c6ab] hidden sm:inline" />
                <span className="font-bold text-[#1f1b10] bg-[#f6eddb] px-2.5 py-1 rounded-lg border border-[#ebe2cf]">
                  {getNavTitle(activeAdvisorNav)}
                </span>
                {activeRequest && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-[#d1c6ab] hidden md:inline" />
                    <span className="font-mono text-[#2f5ea1] font-bold hidden md:inline">
                      {projectCode}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Quick Global Search, System Status & Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden xl:flex items-center gap-1.5 px-3 py-1 bg-[#fcf3e0] rounded-full border border-[#ebe2cf]">
                <span className="w-2 h-2 rounded-full bg-[#2f5ea1] animate-pulse"></span>
                <span className="text-[11px] font-bold text-[#4d4632]">
                  Motor IA v4.2 • SAP S/4HANA
                </span>
              </div>

              {/* Direct Status Control Button in Header */}
              <button
                type="button"
                onClick={() => setShowStatusModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] transition-all text-xs font-black shadow-2xs hover:shadow-xs border border-[#e5bc00] cursor-pointer"
                title="Haz clic para cambiar el estado de este proyecto"
                id="btn-header-change-status"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0d4788]" />
                <span className="hidden sm:inline">Estado:</span>
                <span className="underline decoration-dotted">{activeRequest?.status || 'Cotizada'}</span>
                <ChevronDown className="w-3 h-3 text-[#0d4788]" />
              </button>

              {/* Action Buttons in Header */}
              <button
                type="button"
                onClick={() => triggerToast('Borrador de expediente guardado en el servidor')}
                className="hidden sm:flex px-3.5 py-2 rounded-xl bg-white text-[#1f1b10] hover:bg-[#f6eddb] transition-colors text-xs font-bold items-center gap-1.5 border border-[#ebe2cf] cursor-pointer"
                id="btn-save-draft"
              >
                <Save className="w-4 h-4 text-[#7f765f]" />
                <span>Guardar</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[#f0e7d5] text-[#2f5ea1] hover:bg-[#ebe2cf] transition-colors text-xs font-bold flex items-center gap-1.5 border border-[#d1c6ab]/40 cursor-pointer"
                id="btn-preview-pdf"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApproveModal(true)}
                className="px-4 py-2 rounded-xl bg-[#ffd100] text-[#0d4788] hover:bg-[#ffc800] transition-all shadow-xs text-xs font-black flex items-center gap-1.5 cursor-pointer"
                id="btn-approve-send"
              >
                <Send className="w-4 h-4" />
                <span>Aprobar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Body Content according to active sidebar tab */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1400px] mx-auto">
            {/* VIEW 1: DIAGNÓSTICO & EVALUACIÓN IA */}
            {activeAdvisorNav === 'diagnostico' && (
              <div className="space-y-6">
                {/* Active Project Breadcrumb Summary Strip with Status Management */}
                {(() => {
                  const statusInfo = getStatusDetails(activeRequest?.status || 'Cotizada');
                  const StatusIcon = statusInfo.icon;

                  const milestoneSteps = [
                    { step: 1, label: '1. Solicitud', keyStatus: 'Registrada' },
                    { step: 2, label: '2. Diagnóstico IA', keyStatus: 'Analizada por IA' },
                    { step: 3, label: '3. Cotizada', keyStatus: 'Cotizada' },
                    { step: 4, label: '4. Asignada / Fab', keyStatus: 'Inventario Asignado' },
                    { step: 5, label: '5. Entrega', keyStatus: 'Completada' },
                  ];

                  return (
                    <div className="bg-[#fcf3e0] rounded-2xl p-5 border border-[#ebe2cf] space-y-4 shadow-xs">
                      {/* Top Row: Title, Metadata, Current Status Badge & Change Button */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold bg-[#f0e7d5] px-2.5 py-0.5 rounded border border-[#d1c6ab]/50">
                              {projectCode}
                            </span>

                            {/* Current Status Pill with click to change */}
                            <div
                              onClick={() => setShowStatusModal(true)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border cursor-pointer hover:shadow-xs transition-all ${statusInfo.badgeBg}`}
                              title="Haz clic para cambiar el estado"
                            >
                              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{activeRequest?.status || 'Cotizada'}</span>
                              <span className="text-[10px] opacity-75 font-semibold">
                                • {statusInfo.phaseLabel}
                              </span>
                            </div>
                          </div>

                          <h1 className="text-xl sm:text-2xl font-black text-[#1f1b10] leading-tight">
                            Evaluación Técnica de Sustrato & Prescripción
                          </h1>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4d4632]">
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[#2f5ea1]" />
                              <strong>Cliente:</strong> {clientName}
                            </span>
                            <span>•</span>
                            <span>📍 {clientAddress}</span>
                            <span>•</span>
                            <span><strong>Área:</strong> {projectArea} m²</span>
                            {activeRequest?.technicalReviewNotes && (
                              <>
                                <span>•</span>
                                <span className="text-[#725c00] italic">
                                  Nota: "{activeRequest.technicalReviewNotes.slice(0, 45)}..."
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Status Change CTA Buttons */}
                        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                          <button
                            type="button"
                            onClick={() => setShowStatusModal(true)}
                            className="px-4 py-2.5 rounded-xl bg-[#0d4788] hover:bg-[#093566] text-white text-xs font-black shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                            id="btn-banner-change-status"
                            title="Abrir panel para cambiar la etapa o estado del proyecto"
                          >
                            <SlidersHorizontal className="w-4 h-4 text-[#ffd100]" />
                            <span>Cambiar Estado del Proyecto</span>
                            <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveAdvisorNav('solicitudes')}
                            className="px-3.5 py-2.5 rounded-xl bg-white border border-[#ebe2cf] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb] transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Layers className="w-4 h-4 text-[#725c00]" />
                            <span>Ver Otros Radicados</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive Visual Stepper: 5 Milestone Phases */}
                      <div className="pt-3 border-t border-[#ebe2cf]/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#7f765f]">
                          <span>Flujo Operativo del Proyecto:</span>
                          <span className="text-[#0d4788] font-black">
                            {statusInfo.phaseLabel} ({statusInfo.percent}% de avance)
                          </span>
                        </div>

                        {/* Progress Bar Track */}
                        <div className="w-full bg-[#ebe2cf] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#2f5ea1] h-full rounded-full transition-all duration-500"
                            style={{ width: `${statusInfo.percent}%` }}
                          />
                        </div>

                        {/* 5 Milestone Step Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1">
                          {milestoneSteps.map((m) => {
                            const isPassed = statusInfo.stepNumber >= m.step;
                            const isCurrent = statusInfo.stepNumber === m.step;

                            return (
                              <button
                                key={m.step}
                                type="button"
                                onClick={() => setShowStatusModal(true)}
                                className={`px-2 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-center cursor-pointer border ${
                                  isCurrent
                                    ? 'bg-[#ffd100] text-[#0d4788] border-[#e5bc00] shadow-xs'
                                    : isPassed
                                    ? 'bg-white text-[#137333] border-[#86efac]'
                                    : 'bg-[#f6eddb]/60 text-[#7f765f] border-transparent hover:bg-white'
                                }`}
                                title={`Haz clic para cambiar a etapa ${m.label}`}
                              >
                                {isPassed ? (
                                  <Check className="w-3 h-3 text-[#137333] shrink-0 stroke-[3]" />
                                ) : (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#d1c6ab] shrink-0" />
                                )}
                                <span className="truncate">{m.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Workspace 2-Column Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: VISIÓN DE SUSTRATO & PATOLOGÍAS (Span 5) */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Card: Photographic Scan & Vision AI */}
                    <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-5 sm:p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#ffe07f] flex items-center justify-center text-[#231b00] font-bold">
                            <ScanLine className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-base sm:text-lg font-black text-[#1f1b10] leading-tight">
                              Escaneo Digital de Sustrato
                            </h2>
                            <p className="text-xs text-[#7f765f]">
                              Visión artificial calibrada sobre muro analizado
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#d6e3ff] text-[#001b3d] text-xs font-black">
                          IA Confianza: 98.4%
                        </span>
                      </div>

                      {/* Interactive Photographic Overlay Container */}
                      <div className="relative w-full rounded-xl overflow-hidden bg-[#1f1b10] aspect-[4/3] group shadow-inner">
                        <img
                          src={
                            activeRequest?.photoUrl ||
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuB0NI0657yWS_vLxwCNyXu-WRx786-wyS41v-znOJAeyE8I7_QyGJGIoty2iMmo8Xbn5LVvX-ezlfzkJmPsckEwn3arbF9VxlsRJyGoFS0JTDJFdk9iRUnah70abm64q9UaPC-hkI3rbNIVpoCNuxrnCAml9xVdXj2lixNjkVzID6n97oxJN42M0zLwboPrzSMTGWCJBQZAWDE0GTwHOD5eaa7il_izE1nkUOa2UUuyAA-AJR0Hz6h-Pw'
                          }
                          alt="Surface scan"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

                        {/* Bounding Box 1 */}
                        <div className="absolute top-[18%] left-[22%] w-[48%] h-[56%] border-2 border-dashed border-[#ffd100] rounded-xl pointer-events-none flex flex-col justify-between p-2 bg-[#ffd100]/10 backdrop-blur-[1px]">
                          <div className="self-start px-2 py-0.5 rounded bg-[#ffd100] text-[#0d4788] text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c00014] animate-ping"></span>
                            <span>Muro Principal A-1</span>
                          </div>
                          <div className="self-end px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                            Área: {Math.round(projectArea * 0.58)} m²
                          </div>
                        </div>

                        {/* Bounding Box 2 */}
                        <div className="absolute top-[28%] right-[4%] w-[24%] h-[54%] border-2 border-dotted border-[#2f5ea1] rounded-xl pointer-events-none flex flex-col justify-between p-2 bg-[#2f5ea1]/10">
                          <div className="self-start px-2 py-0.5 rounded bg-[#2f5ea1] text-white text-[10px] font-bold uppercase">
                            Perímetro B
                          </div>
                          <div className="self-end px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-bold">
                            Área: {Math.round(projectArea * 0.42)} m²
                          </div>
                        </div>

                        {/* AI HUD Sensor Reading */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/95 backdrop-blur-md text-[#1f1b10] shadow-md border border-white/40">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-[#2f5ea1] animate-pulse"></div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-[#7f765f] leading-tight">
                                Superficie Total
                              </span>
                              <span className="text-xs font-bold text-[#1f1b10]">
                                {projectArea}.00 m² (±0.2%)
                              </span>
                            </div>
                          </div>
                          <div className="h-6 w-px bg-[#d1c6ab]"></div>
                          <div className="flex flex-col text-right">
                            <span className="text-[10px] text-[#7f765f] leading-tight">
                              Higrometría
                            </span>
                            <span className="text-xs font-bold text-[#2f5ea1]">4.2% Humedad</span>
                          </div>
                        </div>
                      </div>

                      {/* Micro Sensors Reading */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="p-3 rounded-xl bg-[#f6eddb] border border-[#ebe2cf] flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#7f765f] font-semibold">Porosidad Muro</span>
                            <GripHorizontal className="w-4 h-4 text-[#725c00]" />
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-[#1f1b10]">38%</span>
                            <span className="text-xs text-[#4d4632]">Media-Alta</span>
                          </div>
                          <span className="text-[10px] text-[#4d4632]">Requiere sellado previo</span>
                        </div>

                        <div className="p-3 rounded-xl bg-[#f6eddb] border border-[#ebe2cf] flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#7f765f] font-semibold">Nivel Humedad</span>
                            <Droplets className="w-4 h-4 text-[#2f5ea1]" />
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-black text-[#2f5ea1]">4.2%</span>
                            <span className="text-xs text-[#7f765f]">Óptimo (&lt;6%)</span>
                          </div>
                          <span className="text-[10px] text-[#2f5ea1] font-bold">Apto para pintar</span>
                        </div>
                      </div>
                    </div>

                    {/* Card: Patologías y Hallazgos */}
                    <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-5 sm:p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#f0e7d5] flex items-center justify-center text-[#1f1b10] font-bold">
                            <CheckSquare className="w-5 h-5 text-[#2f5ea1]" />
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-[#1f1b10]">
                              Validación de Patologías
                            </h3>
                            <p className="text-xs text-[#7f765f]">
                              Confirma las alertas detectadas para la prescripción
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-start gap-3 p-3 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] hover:bg-[#f6eddb] transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pathologies.sellador}
                            onChange={(e) =>
                              setPathologies((prev) => ({ ...prev, sellador: e.target.checked }))
                            }
                            className="mt-1 w-4 h-4 accent-[#725c00] rounded cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#1f1b10]">
                              Sellador Antihumedad 501 Requerido
                            </span>
                            <span className="text-[11px] text-[#4d4632]">
                              Estuco con alcalinidad residual. Se prescribe 1 mano fijadora.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] hover:bg-[#f6eddb] transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pathologies.microfisuras}
                            onChange={(e) =>
                              setPathologies((prev) => ({ ...prev, microfisuras: e.target.checked }))
                            }
                            className="mt-1 w-4 h-4 accent-[#725c00] rounded cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#1f1b10]">
                              Microfisuras no estructurales (&lt; 0.5mm)
                            </span>
                            <span className="text-[11px] text-[#4d4632]">
                              Requiere puenteo con Masilla Acrílica Pintuco.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-3 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] hover:bg-[#f6eddb] transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pathologies.grasa}
                            onChange={(e) =>
                              setPathologies((prev) => ({ ...prev, grasa: e.target.checked }))
                            }
                            className="mt-1 w-4 h-4 accent-[#725c00] rounded cursor-pointer"
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[#1f1b10]">
                              Grasa o contaminantes superficiales
                            </span>
                            <span className="text-[11px] text-[#4d4632]">
                              Aplicar desengrasante cítrico antes de imprimar.
                            </span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: PROPUESTA COMERCIAL & DOSIFICACIÓN (Span 7) */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Card: Calculadora Técnica y Merma */}
                    <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-5 sm:p-6 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#ffd100] flex items-center justify-center text-[#0d4788] font-bold">
                            <Calculator className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-base sm:text-lg font-black text-[#1f1b10]">
                              Calculadora Técnica Asistida
                            </h2>
                            <p className="text-xs text-[#7f765f]">
                              Rendimiento volumétrico calibrado según rugosidad
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 bg-[#f6eddb] px-3 py-1 rounded-lg border border-[#d1c6ab]/40">
                          <span className="text-xs text-[#7f765f]">Merma:</span>
                          <span className="text-xs text-[#1f1b10] font-black">+{mermaPercent}%</span>
                        </div>
                      </div>

                      {/* Merma Slider Bar */}
                      <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 w-full sm:w-auto">
                          <Sliders className="w-4 h-4 text-[#2f5ea1]" />
                          <span className="text-xs font-bold text-[#1f1b10]">
                            Calibración de Merma de Aplicación:
                          </span>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-60">
                          <input
                            type="range"
                            min="2"
                            max="20"
                            value={mermaPercent}
                            onChange={(e) => setMermaPercent(Number(e.target.value))}
                            className="w-full accent-[#725c00] cursor-pointer"
                          />
                          <span className="text-xs font-black text-[#1f1b10] w-10 text-right">
                            {mermaPercent}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card: Tabla de Cotización Interactiva */}
                    <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-5 sm:p-6 flex flex-col gap-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#f0e7d5] flex items-center justify-center text-[#1f1b10]">
                            <Receipt className="w-5 h-5 text-[#2f5ea1]" />
                          </div>
                          <div>
                            <h2 className="text-base sm:text-lg font-black text-[#1f1b10]">
                              Propuesta Técnico-Comercial Oficial
                            </h2>
                            <p className="text-xs text-[#7f765f]">
                              Valores oficiales Pintuco con IVA y descuento asesor
                            </p>
                          </div>
                        </div>

                        {lockInfo.canAddProducts ? (
                          <button
                            type="button"
                            onClick={() => setActiveAdvisorNav('catalogo')}
                            className="px-3 py-1.5 rounded-xl bg-[#ffd100] text-[#0d4788] text-xs font-black hover:bg-[#ffc800] transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar Producto</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-3 py-1.5 rounded-xl bg-[#ebe2cf] text-[#7f765f] text-xs font-bold flex items-center gap-1.5 border border-[#d1c6ab]/70 cursor-not-allowed opacity-80"
                            title={lockInfo.reason}
                          >
                            <Lock className="w-3.5 h-3.5 text-[#7f765f]" />
                            <span>Agregar Producto (Bloqueado)</span>
                          </button>
                        )}
                      </div>

                      {/* Locked Phase Alert Banner for Advisors */}
                      {!lockInfo.canAddProducts && (
                        <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab] flex items-start gap-3 text-xs text-[#4d4632]">
                          <Lock className="w-4 h-4 text-[#725c00] shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-[#1f1b10] block font-bold">
                              Formulación técnica bloqueada ({lockInfo.badgeLabel}):
                            </strong>
                            <span>{lockInfo.reason}</span>
                          </div>
                        </div>
                      )}

                      {/* Items Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-[#1f1b10]">
                          <thead>
                            <tr className="bg-[#f0e7d5] text-[#1f1b10] text-[11px] uppercase tracking-wider font-bold">
                              <th className="py-2.5 px-3 rounded-l-lg">Producto / Referencia</th>
                              <th className="py-2.5 px-2">Presentación</th>
                              <th className="py-2.5 px-2 text-center">Cantidad</th>
                              <th className="py-2.5 px-3 text-right">Unitario</th>
                              <th className="py-2.5 px-3 text-right">Total</th>
                              <th className="py-2.5 px-2 text-center rounded-r-lg">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ebe2cf]/50">
                            {quoteItems.map((item, idx) => (
                              <tr key={`${item.sku}-${idx}`} className="hover:bg-[#f6eddb]/40 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-2">
                                    {item.selectedColorHex && (
                                      <span
                                        className="w-3.5 h-3.5 rounded-md border border-black/20 shrink-0"
                                        style={{ backgroundColor: item.selectedColorHex }}
                                      />
                                    )}
                                    <div className="flex flex-col">
                                      <span className="font-bold text-[#1f1b10]">{item.name}</span>
                                      <span className="text-[10px] text-[#7f765f] font-mono">
                                        SKU: {item.sku}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-[#4d4632]">{item.unit}</td>
                                <td className="py-2.5 px-2 text-center">
                                  <div className="inline-flex items-center gap-1 bg-[#fcf3e0] px-2 py-0.5 rounded-lg border border-[#ebe2cf]">
                                    <button
                                      type="button"
                                      disabled={!lockInfo.canEditQuantities}
                                      onClick={() => handleUpdateItemQty(idx, -1)}
                                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                        lockInfo.canEditQuantities
                                          ? 'text-[#7f765f] hover:text-[#1f1b10] hover:bg-[#ebe2cf] cursor-pointer'
                                          : 'text-[#a89f8b] cursor-not-allowed opacity-40'
                                      }`}
                                      title={lockInfo.canEditQuantities ? 'Reducir' : lockInfo.shortWarning}
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="font-bold text-xs min-w-[18px]">{item.quantity}</span>
                                    <button
                                      type="button"
                                      disabled={!lockInfo.canEditQuantities}
                                      onClick={() => handleUpdateItemQty(idx, 1)}
                                      className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                                        lockInfo.canEditQuantities
                                          ? 'text-[#7f765f] hover:text-[#1f1b10] hover:bg-[#ebe2cf] cursor-pointer'
                                          : 'text-[#a89f8b] cursor-not-allowed opacity-40'
                                      }`}
                                      title={lockInfo.canEditQuantities ? 'Aumentar' : lockInfo.shortWarning}
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono text-[#4d4632]">
                                  {formatCOP(item.unitPriceCOP)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-[#1f1b10]">
                                  {formatCOP(item.totalCOP)}
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  {lockInfo.canRemoveProducts ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteItem(idx)}
                                      className="p-1 rounded text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors cursor-pointer"
                                      title="Quitar producto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <span
                                      className="p-1 text-[#a89f8b] inline-flex items-center justify-center cursor-not-allowed opacity-40"
                                      title={`Bloqueado en fase ${activeRequest?.status}`}
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totals Ledger */}
                      <div className="bg-[#fcf3e0] p-4 rounded-xl border border-[#ebe2cf] flex flex-col gap-2 ml-auto w-full sm:w-80">
                        <div className="flex justify-between items-center text-xs text-[#4d4632]">
                          <span>Subtotal Productos:</span>
                          <span className="font-mono text-[#1f1b10] font-bold">
                            {formatCOP(subtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-[#ba1a1a] font-medium">
                          <span>Descuento Asesor (-10%):</span>
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
                      </div>

                      {/* Technical Notes Textarea */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#1f1b10] flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-[#725c00]" />
                            Concepto Técnico & Recomendaciones de Aplicación
                          </span>
                          <span className="text-[11px] text-[#2f5ea1] font-bold">Editable</span>
                        </label>
                        <textarea
                          value={technicalNotes}
                          onChange={(e) => setTechnicalNotes(e.target.value)}
                          className="w-full p-3 bg-[#f6eddb] border border-[#ebe2cf] rounded-xl text-xs sm:text-sm text-[#1f1b10] focus:outline-none focus:ring-2 focus:ring-[#2f5ea1] resize-none leading-relaxed"
                          rows={3}
                        />
                      </div>

                      {/* Bottom Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowSapModal(true)}
                          className="px-4 py-2.5 rounded-xl bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] text-xs font-bold flex items-center gap-2 border border-[#d1c6ab]/40 transition-colors cursor-pointer"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-[#2f5ea1]" />
                          <span>Generar Orden SAP</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <a
                            href={`https://wa.me/573124589201?text=Hola%20${encodeURIComponent(
                              clientName
                            )},%20te%20comparto%20el%20diagnostico%20oficial%20Pintuco%20${projectCode}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2.5 rounded-xl bg-[#25D366] text-white hover:bg-[#20ba59] text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setShowApproveModal(true)}
                            className="px-5 py-2.5 rounded-xl bg-[#ffd100] text-[#0d4788] hover:bg-[#ffc800] text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            <span>Aprobar y Notificar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: SOLICITUDES PENDIENTES */}
            {activeAdvisorNav === 'solicitudes' && (
              <AdvisorRequestsView
                currentRequest={activeRequest}
                onSelectRequestForDiagnosis={handleSelectRequestForDiagnosis}
                onUpdateProject={onUpdateProject}
                onShowToast={triggerToast}
              />
            )}

            {/* VIEW 3: INVENTARIO & STOCK MULTISEDE */}
            {activeAdvisorNav === 'inventario' && (
              <AdvisorInventoryView
                request={activeRequest}
                onNavigateToFullInventory={onNavigateToInventory}
                onShowToast={triggerToast}
                onUpdateProject={onUpdateProject}
              />
            )}

            {/* VIEW 4: CATÁLOGO TÉCNICO PINTUCO */}
            {activeAdvisorNav === 'catalogo' && (
              <AdvisorCatalogView
                onAddProductToQuote={handleAddProductToQuote}
                onShowToast={triggerToast}
                activeProjectStatus={activeRequest?.status}
                activeProjectCode={projectCode}
              />
            )}

            {/* VIEW 5: HISTORIAL DE COTIZACIONES */}
            {activeAdvisorNav === 'historial' && (
              <AdvisorHistoryView
                request={activeRequest}
                onOpenPdfModal={() => setShowPdfModal(true)}
                onShowToast={triggerToast}
              />
            )}
          </div>
        </main>
      </div>

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
                  <span className="font-mono font-bold text-[#2f5ea1]">{projectCode}</span>
                  <p className="text-[11px] text-[#7f765f]">Emisión: {new Date().toLocaleDateString('es-CO')}</p>
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

              {/* Items List in PDF */}
              <div className="bg-white p-3 rounded-xl border border-[#ebe2cf]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#ebe2cf] text-[#7f765f] uppercase text-[10px]">
                      <th className="py-1 text-left">Ítem</th>
                      <th className="py-1 text-center">Cant.</th>
                      <th className="py-1 text-right">Unitario</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebe2cf]/50">
                    {quoteItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 font-medium">{item.name}</td>
                        <td className="py-1.5 text-center">{item.quantity}</td>
                        <td className="py-1.5 text-right font-mono">{formatCOP(item.unitPriceCOP)}</td>
                        <td className="py-1.5 text-right font-mono font-bold">{formatCOP(item.totalCOP)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  if (activeRequest && onUpdateProject) {
                    onUpdateProject({
                      ...activeRequest,
                      status: 'Inventario Asignado',
                      technicalReviewNotes: technicalNotes,
                    });
                  }
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
                  if (activeRequest && onUpdateProject) {
                    onUpdateProject({
                      ...activeRequest,
                      status: 'Inventario Asignado',
                      technicalReviewNotes: technicalNotes,
                    });
                  }
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

      {/* 4. Advisor Project Status Management Modal */}
      <AdvisorStatusModal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        request={activeRequest}
        onSaveStatus={handleSaveProjectStatus}
      />
    </div>
  );
};
