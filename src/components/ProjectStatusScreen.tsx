import React, { useState, useEffect } from 'react';
import { ProjectRequest, QuotationItem } from '../types';
import { ColorSelectorModal, ColorSelectionResult } from './ColorSelectorModal';
import { AddProductModal } from './AddProductModal';
import { getProjectPhaseLockInfo } from '../lib/projectStatusRules';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Headphones,
  Check,
  FlaskConical,
  ScanLine,
  ZoomIn,
  Package,
  Layers,
  Sparkles,
  Phone,
  MessageCircle,
  ShieldCheck,
  Truck,
  CheckCircle2,
  ChevronRight,
  X,
  Star,
  Download,
  AlertCircle,
  Palette,
  Disc,
  Plus,
  Trash2,
  PackagePlus,
  Edit3,
  Lock,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

interface ProjectStatusScreenProps {
  request: ProjectRequest | null;
  onNavigateToRequest: () => void;
  onNavigateToEcosystem: () => void;
  onOpenSupport: () => void;
  onNavigateToAdvisorPortal?: () => void;
  onUpdateProject?: (updatedRequest: ProjectRequest) => void;
  onNavigateToStore?: () => void;
}

export const ProjectStatusScreen: React.FC<ProjectStatusScreenProps> = ({
  request,
  onNavigateToRequest,
  onNavigateToEcosystem,
  onOpenSupport,
  onNavigateToAdvisorPortal,
  onUpdateProject,
  onNavigateToStore,
}) => {
  // Photos Gallery state - incorporates user project photo if uploaded
  const photos = [
    {
      id: 0,
      title: request?.surfaceType ? `Superficie: ${request.surfaceType}` : 'Espacio Principal Sala & Comedor',
      label: 'Inspección Digital de Superficie',
      url:
        request?.photoUrl ||
        'https://lh3.googleusercontent.com/aida/AEtjO1XGulv6BFlNCMVJ-v9Vr6kAcMtzVmUpR20kPQTBrpA2R8HZ9CvuLlA2QwBBX_ihb-pTiv3t4AomJe72yWvfNl6HAO-m9_--tqsoCK9UD8RybLXwjwNZc0TyipvKqr_fViDF28Li-Lez-BBOYw51oOoPeam4O-_vILrAPTrxrFaBmqkdMlVcu8GWo3W5i0zSQozSDfymMslLw4Ms5R2JwY7w0fnYcG2v9js2V5O3AMBHKba7LDU-Zh9XSRRl',
      caption:
        request?.diagnosis?.diagnosticSummary ||
        'Evaluación técnica: Muros secos sin eflorescencia. Apto para sistema de recubrimientos Pintuco.',
    },
    {
      id: 1,
      title: 'Textura Base',
      label: '1. Textura Base',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAheXBiJJ4xhYV3Z5tsO_dlO7bMJtOzwViw5qg6nLbFQvfJbKSjpEvn0G9WBHrl-0wUf5ThzcofpNNKXFHVHHZMmAobTU51Of0ZnHtGHNZ5oFtt7ucSVruTp8hSIKz4DTHEo6AEACPqXitJynDflNGuMay6LAtstY49xz6ylFdzBSjTbcsaKKywgbfr37C9-WSPGaiEF3d5yFmB01tx_5_5aEiyiaUIyAEIZsIYgbe0Lj_6lnpIg4cR4g',
      caption: 'Detalle macro de porosidad de revoque seco. Índice de absorción nivel 2 (moderado).',
    },
    {
      id: 2,
      title: 'Calibración Color',
      label: '2. Calibración Color',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCdXgBhm2w_EMg5MzqHS1o8jVdgmfF7KmsDm6BTBIqulag2XkoOCuCatihXherprhq7U4WQ4Y2Wk5rAYnjxLCozjza5BJ5LAmLZrXYPv4fdYPtq3ff7x63jjWa496VgOs4is-Q9dWGspAuw8WCUIGUZPNwjXq4VEV81QVt1_rAucjPklkbR2po6nhfOeYt1shL3PAJ6xDh3yQsUaRmO4YSQE5ZGmTq4_ErmMl9iwCEdJ8mQAad9E2b1mQ',
      caption: `Pruebas de tono y calibración espectrofotométrica según cartas de color Pintuco: ${request?.colorFamily || 'Arena Cálido'}.`,
    },
    {
      id: 3,
      title: 'Perímetro Total',
      label: '3. Perímetro Total',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMQ9cZmvQGEnFasKkYdMkA0-lkX4UhgoW8junLqn8HnbfIPxQ4RIDipxYlUWIxn3UzAnlnksoCpeNRTRLh8s8_oXnbY1tQqeIg0nxkCOayLAcW7V6ExYmrpKknveqZ4utpB_MXhaorN_jZYkCXaBw7FdOezU1IfQpyVpQV1-e1XkmRnHiLGLRYAiNFYcOZIFIkF-DRa99XLa8YJibqxsiKfyZhQ3ZigF3N4VjHl3LPoYlpB7r2U5sVuw',
      caption: `Levantamiento perimetral con descuento de vanos, puertas y ventanería: ${request?.areaM2 || 45} m² netos.`,
    },
  ];

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showFullExpedienteModal, setShowFullExpedienteModal] = useState(false);
  const [showFichaTecnicaModal, setShowFichaTecnicaModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Products and Color State
  const defaultItems: QuotationItem[] = [
    {
      sku: 'PT-VX-1010',
      name: 'Viniltex® Avanzado Antibacterial (Tono Salmón Terracota)',
      type: 'Pintura Acabado',
      unit: 'Caneca (5 Gal) x 2 + Galón x 1',
      quantity: 11,
      unitPriceCOP: 94500,
      totalCOP: 1039500,
      hasColors: true,
      selectedColorMode: 'suggestion',
      selectedColorName: 'Salmón Terracota',
      selectedColorHex: '#E28468',
      selectedColorCode: 'PT-248-A',
      finishPreference: 'Mate',
    },
    {
      sku: 'PT-SM-2005',
      name: 'Sellomax® Imprimante y Sellador Acrílico',
      type: 'Imprimante',
      unit: 'Caneca (5 Gal)',
      quantity: 5,
      unitPriceCOP: 62000,
      totalCOP: 310000,
      hasColors: false,
    },
    {
      sku: 'ACC-KIT-PRO',
      name: 'Kit Profesional de Aplicación Pintuco (2 Rodillos + 2 Brochas + Bandeja)',
      type: 'Herramientas',
      unit: 'Kit',
      quantity: 2,
      unitPriceCOP: 48000,
      totalCOP: 96000,
      hasColors: false,
    },
  ];

  const [projectItems, setProjectItems] = useState<QuotationItem[]>(
    request?.quotation?.items && request.quotation.items.length > 0
      ? request.quotation.items
      : defaultItems
  );

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [colorModalTargetIndex, setColorModalTargetIndex] = useState<number | null>(null);

  // Sync when request changes
  useEffect(() => {
    if (request?.quotation?.items && request.quotation.items.length > 0) {
      setProjectItems(request.quotation.items);
    }
  }, [request?.quotation?.items]);

  // Sync project update helper
  const syncProjectUpdate = (newItems: QuotationItem[]) => {
    if (!request) return;
    const subtotal = newItems.reduce((acc, it) => acc + (it.totalCOP || 0), 0);
    const discount = Math.round(subtotal * 0.05);
    const tax = Math.round((subtotal - discount) * 0.19);
    const labor = request.quotation?.laborEstimateCOP || Math.round((request.areaM2 || 45) * 6500);
    const total = subtotal - discount + tax + labor;

    const updatedRequest: ProjectRequest = {
      ...request,
      quotation: {
        quoteNumber: request.quotation?.quoteNumber || `COT-PT-${new Date().getFullYear()}-01`,
        date: request.quotation?.date || new Date().toLocaleDateString('es-CO'),
        validUntil: request.quotation?.validUntil || '15 días',
        items: newItems,
        subtotalCOP: subtotal,
        discountCOP: discount,
        taxCOP: tax,
        laborEstimateCOP: labor,
        logisticsCOP: 0,
        totalCOP: total,
        paymentTerms: request.quotation?.paymentTerms || 'Crédito Corporativo 30 días / PSE',
        estimatedLeadDays: request.quotation?.estimatedLeadDays || 2,
      },
    };

    if (onUpdateProject) {
      onUpdateProject(updatedRequest);
    }
  };

  // Derived project values or fallbacks matching mockup
  const projectCode = request?.id || 'PTC-2024-8924';
  const projectCity = request?.city ? `${request.city}, Colombia` : 'Bogotá, D.C.';
  const projectAddress = request?.address || 'Calle 127 # 19-45, Apto 402, Bogotá';
  const projectArea = request?.areaM2 || 45;
  const currentStatus = request?.status || 'Cotizada';
  const lockInfo = getProjectPhaseLockInfo(currentStatus);

  // Add product handler (strictly blocked in production/logistics/completed phases)
  const handleAddProduct = (newItem: QuotationItem) => {
    if (!lockInfo.canAddProducts) return;
    const updated = [...projectItems, newItem];
    setProjectItems(updated);
    syncProjectUpdate(updated);
  };

  // Remove product handler
  const handleRemoveProduct = (indexToRemove: number) => {
    if (!lockInfo.canRemoveProducts) return;
    const updated = projectItems.filter((_, idx) => idx !== indexToRemove);
    setProjectItems(updated);
    syncProjectUpdate(updated);
  };

  // Apply color selection handler
  const handleApplyColorSelection = (result: ColorSelectionResult) => {
    if (!lockInfo.canChangeColors) return;
    if (colorModalTargetIndex === null) return;
    const targetItem = projectItems[colorModalTargetIndex];
    if (!targetItem) return;

    // Clean base name
    const baseName = targetItem.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const newName = `${baseName} (${result.name})`;

    const updated = [...projectItems];
    updated[colorModalTargetIndex] = {
      ...targetItem,
      name: newName,
      hasColors: true,
      selectedColorMode: result.mode,
      selectedColorName: result.name,
      selectedColorHex: result.hex,
      selectedColorCode: result.code,
    };

    setProjectItems(updated);
    syncProjectUpdate(updated);
    setColorModalTargetIndex(null);
  };

  // Format COP Currency
  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const createdAtFormatted = request?.createdAt
    ? new Date(request.createdAt).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '12 May 2024';

  const requiredDateFormatted = request?.requiredDate
    ? new Date(request.requiredDate).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '28 May 2024';

  const projectTitle = request?.surfaceType
    ? `Diagnóstico Técnico y Suministro de Recubrimientos para ${request.surfaceType} - ${request.city}`
    : 'Diagnóstico Técnico y Suministro de Recubrimientos - Sala Principal y Comedor';

  // Lifecycle stage mapping
  let currentPhaseNumber = 3;
  let progressPercent = 65;
  let phaseStatusBadge = 'Cotizada • Fase 3 de 5';
  let phaseBadgeClass = 'bg-[#ffd100]/30 text-[#725c00]';
  let phaseDescription =
    'Cotización oficial y especificación técnica aprobadas. Paleta y materiales listos para autorizar producción o ajustar.';

  switch (currentStatus) {
    case 'Registrada':
      currentPhaseNumber = 1;
      progressPercent = 20;
      phaseStatusBadge = 'Recibida • Fase 1 de 5';
      phaseBadgeClass = 'bg-[#fcf3e0] text-[#725c00]';
      phaseDescription =
        'Solicitud recibida correctamente en el ecosistema Pintuco ColorLink. Esperando análisis de sustrato y formulación.';
      break;
    case 'Analizada por IA':
      currentPhaseNumber = 2;
      progressPercent = 40;
      phaseStatusBadge = 'Diagnosticada • Fase 2 de 5';
      phaseBadgeClass = 'bg-[#d6e3ff] text-[#001b3d]';
      phaseDescription =
        'Diagnóstico computacional de sustrato y textura completado con IA Gemini. Cálculo de manos y rendimiento listo.';
      break;
    case 'Cotizada':
      currentPhaseNumber = 3;
      progressPercent = 65;
      phaseStatusBadge = 'Cotizada • Fase 3 de 5';
      phaseBadgeClass = 'bg-[#ffd100]/30 text-[#725c00]';
      phaseDescription =
        'Formulación y cotización comercial vigentes. Puedes modificar colores con la rueda o agregar insumos antes de aprobar.';
      break;
    case 'Inventario Asignado':
      currentPhaseNumber = 4;
      progressPercent = 75;
      phaseStatusBadge = 'Stock Reservado • Fase 4 de 5';
      phaseBadgeClass = 'bg-[#dcfce7] text-[#166534]';
      phaseDescription =
        'Lote bloqueado en SAP R/3 en el Centro de Distribución. Listo para dispensado tintométrico y mezcla en planta.';
      break;
    case 'En Producción':
      currentPhaseNumber = 4;
      progressPercent = 85;
      phaseStatusBadge = 'En Fabricación • Fase 4 de 5';
      phaseBadgeClass = 'bg-[#dbeafe] text-[#1e40af]';
      phaseDescription =
        'Proceso de tinturado computarizado Giotto y envasado en curso. Ensayos de viscosidad y espesor de película en ejecución.';
      break;
    case 'Aprobada QA':
      currentPhaseNumber = 4;
      progressPercent = 92;
      phaseStatusBadge = 'Calidad Certificada • Fase 4 de 5';
      phaseBadgeClass = 'bg-[#ecfdf5] text-[#047857]';
      phaseDescription =
        'Lote aprobado bajo normas ISO 9001 / ASTM con Delta E < 0.5. Precintos de seguridad colocados para despacho.';
      break;
    case 'Completada':
      currentPhaseNumber = 5;
      progressPercent = 100;
      phaseStatusBadge = 'Entregado en Obra • Fase 5 de 5';
      phaseBadgeClass = 'bg-emerald-100 text-emerald-900 border border-emerald-400 font-bold';
      phaseDescription = `¡Pedido entregado con éxito en ${projectAddress}! Remisión firmada a satisfacción y Garantía Pintuco de 5 años activa.`;
      break;
  }

  // Handle advancement of the project lifecycle along the route
  const handleAdvanceStatus = (newStatus: ProjectRequest['status']) => {
    if (!request) return;
    const now = new Date();
    const updated: ProjectRequest = {
      ...request,
      status: newStatus,
      trackingNumber:
        newStatus === 'Completada'
          ? request.trackingNumber || `PTC-TRK-${Math.floor(100000 + Math.random() * 900000)}`
          : request.trackingNumber,
      assignedCarrier:
        newStatus === 'Completada'
          ? request.assignedCarrier || 'Flota Logística Pintuco Express'
          : request.assignedCarrier,
      deliveryDate:
        newStatus === 'Completada'
          ? request.deliveryDate || now.toLocaleDateString('es-CO')
          : request.deliveryDate,
      approvedAt:
        newStatus === 'Inventario Asignado' || newStatus === 'En Producción'
          ? request.approvedAt || now.toISOString()
          : request.approvedAt,
      completedAt:
        newStatus === 'Completada'
          ? request.completedAt || now.toISOString()
          : request.completedAt,
    };

    if (onUpdateProject) {
      onUpdateProject(updated);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      {/* Top Highlight Bar / Breadcrumb Micro-layer */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#4d4632]">
          <button
            onClick={onNavigateToRequest}
            className="hover:text-[#725c00] cursor-pointer transition-colors"
          >
            Inicio
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#7f765f]" />
          <button
            onClick={onNavigateToEcosystem}
            className="hover:text-[#725c00] cursor-pointer transition-colors"
          >
            Mis Servicios
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#7f765f]" />
          <span className="text-[#725c00] font-bold">Seguimiento de Proyecto</span>
        </div>

        <div className="flex items-center gap-2 bg-[#f0e7d5] px-3 py-1.5 rounded-full border border-[#d1c6ab]/40">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ffd100] animate-pulse"></span>
          <span className="text-[11px] text-[#1f1b10] font-bold tracking-wider uppercase">
            Actualizado en tiempo real
          </span>
        </div>
      </div>

      {/* Project Header Section */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 md:p-8 mb-8 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-[#ffd100]/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <span className="bg-[#ffd100] text-[#6f5a00] text-xs px-3.5 py-1 rounded-full font-bold tracking-wide shadow-2xs">
                {projectCode}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 ${phaseBadgeClass}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {phaseStatusBadge}
              </span>
              <span className="text-xs text-[#4d4632] bg-[#f6eddb] px-3 py-1 rounded-full font-medium">
                Garantía 5 Años Pintuco®
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1f1b10] tracking-tight leading-tight">
              {projectTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[#4d4632] text-xs sm:text-sm pt-1 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2f5ea1]" />
                <span>
                  Solicitud: <strong className="text-[#1f1b10] font-bold">{createdAtFormatted}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#edc200]" />
                <span>
                  {currentStatus === 'Completada' ? 'Entregado en Obra: ' : 'Finalización estimada: '}
                  <strong className="text-[#1f1b10] font-bold">
                    {currentStatus === 'Completada' ? (request?.deliveryDate || 'Hoy') : requiredDateFormatted}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#2f5ea1]" />
                <span>{projectCity}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap lg:flex-col sm:flex-row gap-3 min-w-[240px] shrink-0 justify-start lg:justify-end">
            <button
              type="button"
              onClick={onOpenSupport}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#ffd100] text-[#6f5a00] hover:bg-[#ffc800] font-bold text-sm px-5 py-3 rounded-xl shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              id="btn-contact-expert"
            >
              <Headphones className="w-4 h-4" />
              <span>Contactar Experto</span>
            </button>
            <button
              type="button"
              onClick={() => setShowFichaTecnicaModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#f6eddb] text-[#1f1b10] hover:bg-[#f0e7d5] font-bold text-sm px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer border border-[#d1c6ab]/40"
              id="btn-spec-sheet"
            >
              <FileText className="w-4 h-4 text-[#2f5ea1]" />
              <span>Ficha Técnica de Producto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Lifecycle Route Controller Banner */}
      <div className="bg-gradient-to-r from-[#fcf3e0] via-[#fff8f0] to-[#f6eddb] rounded-2xl p-6 border-2 border-[#ffd100] shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-black text-[#725c00] uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#ffd100] fill-[#ffd100]" />
              <span>Gestión de Ruta Integral (Creación → Entrega)</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#1f1b10]">
              {currentStatus === 'Registrada' && 'Paso 1: Solicitud Recibida - Generando Formulación'}
              {currentStatus === 'Analizada por IA' && 'Paso 2: Diagnóstico IA Listo - Emitiendo Cotización'}
              {currentStatus === 'Cotizada' && 'Paso 3: Cotización & Color - ¿Listo para autorizar producción?'}
              {currentStatus === 'Inventario Asignado' && 'Paso 4A: Stock Bloqueado en SAP - Iniciar Tinturado'}
              {currentStatus === 'En Producción' && 'Paso 4B: Tinturado en Planta - Ensayos de Laboratorio QA'}
              {currentStatus === 'Aprobada QA' && 'Paso 4C: Calidad Certificada ISO 9001 - Listo para Despacho'}
              {currentStatus === 'Completada' && 'Paso 5: ¡Proyecto Entregado con Éxito en Obra!'}
            </h3>
            <p className="text-xs sm:text-sm text-[#4d4632]">
              {currentStatus === 'Cotizada' &&
                'Revisa los insumos abajo. Puedes ajustar el tono mediante la rueda de color o agregar nuevos productos antes de autorizar el pedido.'}
              {currentStatus === 'Inventario Asignado' &&
                'Las bases tintométricas están apartadas en el CEDI. Al dar inicio, la planta comenzará la dosificación Giotto.'}
              {currentStatus === 'En Producción' &&
                'Las pinturas se encuentran en calibración colorimétrica y prueba de adherencia. Al verificar parámetros puedes aprobar el lote.'}
              {currentStatus === 'Aprobada QA' &&
                'El lote cumple con Delta E < 0.5 y pruebas ASTM. Procede a despachar con la flota logística de Pintuco.'}
              {currentStatus === 'Completada' &&
                `Transporte finalizado con guía ${request?.trackingNumber || 'PTC-TRK-892401'}. El certificado de garantía de 5 años está emitido.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {currentStatus === 'Cotizada' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('Inventario Asignado')}
                className="px-6 py-3.5 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                id="btn-advance-to-production"
              >
                <CheckCircle2 className="w-5 h-5 text-[#0d4788]" />
                <span>Aprobar Cotización y Reservar Stock</span>
              </button>
            )}

            {currentStatus === 'Inventario Asignado' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('En Producción')}
                className="px-6 py-3.5 rounded-xl bg-[#2f5ea1] hover:bg-[#254b80] text-white text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                id="btn-advance-to-tinting"
              >
                <FlaskConical className="w-5 h-5 text-[#ffd100]" />
                <span>Iniciar Tinturado & Fabricación</span>
              </button>
            )}

            {currentStatus === 'En Producción' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('Aprobada QA')}
                className="px-6 py-3.5 rounded-xl bg-[#00875a] hover:bg-[#006644] text-white text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                id="btn-advance-to-qa"
              >
                <ShieldCheck className="w-5 h-5 text-white" />
                <span>Certificar Calidad Lote (QA ISO 9001)</span>
              </button>
            )}

            {currentStatus === 'Aprobada QA' && (
              <button
                type="button"
                onClick={() => handleAdvanceStatus('Completada')}
                className="px-6 py-3.5 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                id="btn-advance-to-delivery"
              >
                <Truck className="w-5 h-5 text-[#0d4788]" />
                <span>Despachar y Confirmar Entrega en Obra</span>
              </button>
            )}

            {currentStatus === 'Completada' && (
              <button
                type="button"
                onClick={() => setShowCertificateModal(true)}
                className="px-6 py-3.5 rounded-xl bg-[#2f5ea1] hover:bg-[#254b80] text-white text-sm font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                id="btn-view-certificate"
              >
                <ShieldCheck className="w-5 h-5 text-[#ffd100]" />
                <span>Ver Certificado de Garantía 5 Años</span>
              </button>
            )}
          </div>
        </div>

        {/* Phase Simulator Controls for Full Route Testing */}
        <div className="mt-5 pt-4 border-t border-[#d1c6ab]/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="font-bold text-[#725c00] flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5" />
            <span>Simulador de Estados de la Ruta:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { label: '1. Registrada', status: 'Registrada' as const },
              { label: '2. Diagnóstico IA', status: 'Analizada por IA' as const },
              { label: '3. Cotizada & Color', status: 'Cotizada' as const },
              { label: '4. En Producción / QA', status: 'En Producción' as const },
              { label: '5. Entregado en Obra', status: 'Completada' as const },
            ].map((st) => (
              <button
                key={st.status}
                type="button"
                onClick={() => handleAdvanceStatus(st.status)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  currentStatus === st.status
                    ? 'bg-[#1f1b10] text-[#ffd100] shadow-xs'
                    : 'bg-white hover:bg-[#f6eddb] text-[#4d4632] border border-[#d1c6ab]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline / Stepper Section - DYNAMIC 5 PHASES */}
      <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 md:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs text-[#2f5ea1] font-bold uppercase tracking-wider">
              Avance Estructurado
            </p>
            <h2 className="text-xl sm:text-2xl text-[#1f1b10] font-black">
              Fases de Transformación Pintuco
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-semibold text-[#4d4632]">
              Progreso General:
            </span>
            <div className="w-36 bg-[#f6eddb] rounded-full h-3 overflow-hidden p-0.5 border border-[#d1c6ab]/30">
              <div
                className="bg-[#ffd100] h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-[#1f1b10]">{progressPercent}%</span>
          </div>
        </div>

        {/* Stepper Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
            {/* Step 1: Solicitud Recibida */}
            <div className="flex md:flex-col items-start gap-4 md:gap-3 p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] transition-all">
              <div className="flex md:flex-col items-center gap-2 w-full">
                <div className="w-10 h-10 rounded-full bg-[#2f5ea1] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                </div>
                <div className="hidden md:block w-full h-1 bg-[#2f5ea1] rounded-full"></div>
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  Fase 1
                </span>
                <h3 className="text-sm font-bold text-[#1f1b10] leading-tight mt-0.5">
                  Solicitud Recibida
                </h3>
                <p className="text-xs text-[#7f765f] mt-1">{createdAtFormatted}</p>
              </div>
            </div>

            {/* Step 2: Análisis de Superficie & IA */}
            <div
              className={`flex md:flex-col items-start gap-4 md:gap-3 p-3.5 rounded-xl transition-all border ${
                currentPhaseNumber >= 2
                  ? 'bg-[#fcf3e0] border-[#ebe2cf]'
                  : 'bg-white border-[#ebe2cf] opacity-75'
              }`}
            >
              <div className="flex md:flex-col items-center gap-2 w-full">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs font-bold ${
                    currentPhaseNumber >= 2 ? 'bg-[#2f5ea1] text-white' : 'bg-[#f6eddb] text-[#7f765f]'
                  }`}
                >
                  {currentPhaseNumber >= 2 ? <Check className="w-5 h-5 text-white stroke-[2.5]" /> : '2'}
                </div>
                <div
                  className={`hidden md:block w-full h-1 rounded-full ${
                    currentPhaseNumber >= 2 ? 'bg-[#2f5ea1]' : 'bg-[#f6eddb]'
                  }`}
                ></div>
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  Fase 2
                </span>
                <h3 className="text-sm font-bold text-[#1f1b10] leading-tight mt-0.5">
                  Análisis de Superficie
                </h3>
                <p className="text-xs text-[#7f765f] mt-1">
                  {currentPhaseNumber >= 2 ? 'IA Gemini Evaluada' : 'Pendiente'}
                </p>
              </div>
            </div>

            {/* Step 3: Diagnóstico & Formulación (Cotizada & Color) */}
            <div
              className={`flex md:flex-col items-start gap-4 md:gap-3 p-3.5 rounded-xl transition-all border ${
                currentPhaseNumber === 3
                  ? 'bg-[#ffd100]/20 ring-2 ring-[#ffd100] border-[#ffd100]/50 shadow-md'
                  : currentPhaseNumber > 3
                  ? 'bg-[#fcf3e0] border-[#ebe2cf]'
                  : 'bg-white border-[#ebe2cf] opacity-75'
              }`}
            >
              <div className="flex md:flex-col items-center gap-2 w-full">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs font-bold ${
                    currentPhaseNumber > 3
                      ? 'bg-[#2f5ea1] text-white'
                      : currentPhaseNumber === 3
                      ? 'bg-[#ffd100] text-[#6f5a00]'
                      : 'bg-[#f6eddb] text-[#7f765f]'
                  }`}
                >
                  {currentPhaseNumber > 3 ? (
                    <Check className="w-5 h-5 text-white stroke-[2.5]" />
                  ) : (
                    <FlaskConical className="w-5 h-5" />
                  )}
                </div>
                <div
                  className={`hidden md:block w-full h-1 rounded-full ${
                    currentPhaseNumber > 3
                      ? 'bg-[#2f5ea1]'
                      : currentPhaseNumber === 3
                      ? 'bg-[#ffd100]'
                      : 'bg-[#f6eddb]'
                  }`}
                ></div>
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  {currentPhaseNumber === 3 ? 'Fase 3 • En curso' : 'Fase 3'}
                </span>
                <h3 className="text-sm font-bold text-[#1f1b10] leading-tight mt-0.5">
                  Cotización & Color
                </h3>
                <p className="text-xs text-[#7f765f] mt-1">
                  {currentPhaseNumber > 3 ? 'Aprobada por cliente' : 'Formulación lista'}
                </p>
              </div>
            </div>

            {/* Step 4: Producción & Tintometría QA */}
            <div
              className={`flex md:flex-col items-start gap-4 md:gap-3 p-3.5 rounded-xl transition-all border ${
                currentPhaseNumber === 4
                  ? 'bg-[#ffd100]/20 ring-2 ring-[#ffd100] border-[#ffd100]/50 shadow-md'
                  : currentPhaseNumber > 4
                  ? 'bg-[#fcf3e0] border-[#ebe2cf]'
                  : 'bg-white border-[#ebe2cf] opacity-75'
              }`}
            >
              <div className="flex md:flex-col items-center gap-2 w-full">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs font-bold ${
                    currentPhaseNumber > 4
                      ? 'bg-[#2f5ea1] text-white'
                      : currentPhaseNumber === 4
                      ? 'bg-[#ffd100] text-[#6f5a00]'
                      : 'bg-[#f6eddb] text-[#7f765f]'
                  }`}
                >
                  {currentPhaseNumber > 4 ? (
                    <Check className="w-5 h-5 text-white stroke-[2.5]" />
                  ) : (
                    <Package className="w-5 h-5" />
                  )}
                </div>
                <div
                  className={`hidden md:block w-full h-1 rounded-full ${
                    currentPhaseNumber > 4
                      ? 'bg-[#2f5ea1]'
                      : currentPhaseNumber === 4
                      ? 'bg-[#ffd100]'
                      : 'bg-[#f6eddb]'
                  }`}
                ></div>
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  {currentPhaseNumber === 4 ? 'Fase 4 • En Planta' : 'Fase 4'}
                </span>
                <h3 className="text-sm font-bold text-[#1f1b10] leading-tight mt-0.5">
                  Producción & QA
                </h3>
                <p className="text-xs text-[#7f765f] mt-1">
                  {currentPhaseNumber > 4
                    ? 'Lote QA Certificado'
                    : currentPhaseNumber === 4
                    ? 'Dispensado Giotto'
                    : 'Est. Tintometría'}
                </p>
              </div>
            </div>

            {/* Step 5: Entrega & Despacho */}
            <div
              className={`flex md:flex-col items-start gap-4 md:gap-3 p-3.5 rounded-xl transition-all border ${
                currentPhaseNumber === 5
                  ? 'bg-emerald-50 ring-2 ring-emerald-500 border-emerald-300 shadow-md'
                  : 'bg-white border-[#ebe2cf] opacity-75'
              }`}
            >
              <div className="flex md:flex-col items-center gap-2 w-full">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs font-bold ${
                    currentPhaseNumber === 5 ? 'bg-emerald-600 text-white' : 'bg-[#f6eddb] text-[#7f765f]'
                  }`}
                >
                  {currentPhaseNumber === 5 ? <Check className="w-5 h-5 text-white stroke-[2.5]" /> : '5'}
                </div>
                <div
                  className={`hidden md:block w-full h-1 rounded-full ${
                    currentPhaseNumber === 5 ? 'bg-emerald-600' : 'bg-[#f6eddb]'
                  }`}
                ></div>
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  {currentPhaseNumber === 5 ? 'Fase 5 • Completada' : 'Fase 5'}
                </span>
                <h3 className="text-sm font-bold text-[#1f1b10] leading-tight mt-0.5">
                  Entrega & Despacho
                </h3>
                <p className="text-xs text-[#7f765f] mt-1">
                  {currentPhaseNumber === 5 ? 'Entregado en Obra' : `Est. ${requiredDateFormatted}`}
                </p>
              </div>
            </div>
          </div>

          {/* Current Phase Context Details */}
          <div className="mt-6 p-4 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab]/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#ffd100]/30 flex items-center justify-center text-[#725c00] shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-[#725c00]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                  Detalle técnico de la fase actual:
                </p>
                <p className="text-xs sm:text-sm text-[#4d4632] leading-relaxed mt-0.5">
                  {phaseDescription}
                </p>
              </div>
            </div>
            <span className="text-xs text-[#2f5ea1] font-bold px-3 py-1.5 bg-white rounded-lg shadow-2xs border border-[#ebe2cf] whitespace-nowrap">
              {currentStatus === 'Completada' ? 'Estado: Finalizado con Éxito' : 'Control Técnico: Activo'}
            </span>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Visual Progress & Specifications vs Team & Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* LEFT COLUMN (Span 7) */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          {/* Photo Progress & Visual Registro */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <ScanLine className="w-6 h-6 text-[#2f5ea1]" />
                <h3 className="text-xl sm:text-2xl font-black text-[#1f1b10]">
                  Diagnóstico Técnico de Sustrato
                </h3>
              </div>
              <span className="text-xs text-[#4d4632] bg-[#f6eddb] px-2.5 py-1 rounded-md font-medium">
                Fotos del Cliente • Sala & Comedor
              </span>
            </div>

            {/* Featured Progress Photo */}
            <div className="relative w-full rounded-2xl overflow-hidden aspect-[16/10] shadow-xs mb-4 group bg-[#1f1b10]">
              <img
                src={photos[selectedPhotoIndex].url}
                alt={photos[selectedPhotoIndex].title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                <div className="pr-4">
                  <span className="text-[11px] uppercase tracking-wider font-bold bg-[#2f5ea1]/90 px-2.5 py-1 rounded-md backdrop-blur-xs inline-block mb-1.5">
                    {photos[selectedPhotoIndex].label}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold drop-shadow leading-snug">
                    {photos[selectedPhotoIndex].caption}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullExpedienteModal(true)}
                  className="p-2 rounded-lg bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white transition-colors shrink-0"
                  title="Ampliar expediente"
                >
                  <ZoomIn className="w-5 h-5 opacity-90" />
                </button>
              </div>
            </div>

            {/* Thumbnails Gallery Strip */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {photos.slice(1).map((item, idx) => {
                const actualIndex = idx + 1;
                const isSelected = selectedPhotoIndex === actualIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedPhotoIndex(actualIndex)}
                    className={`rounded-xl overflow-hidden aspect-video relative group cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'border-[#725c00] ring-2 ring-[#ffd100]'
                        : 'border-transparent hover:opacity-90'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                    <div className="absolute bottom-1.5 left-2 right-1 text-[11px] text-white font-bold drop-shadow truncate">
                      {item.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowFullExpedienteModal(true)}
              className="w-full py-3 bg-[#f6eddb] hover:bg-[#f0e7d5] text-[#1f1b10] text-xs sm:text-sm rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-[#d1c6ab]/40 cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-[#2f5ea1]" />
              <span>Ver expediente completo de diagnóstico técnico (4 fotos)</span>
            </button>
          </div>

          {/* Interactive Products & Materials of the Project */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ebe2cf]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#ffd100]/30 text-[#725c00] flex items-center justify-center font-bold">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black text-[#1f1b10]">
                      Productos & Recubrimientos
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f6eddb] text-[#725c00] text-xs font-bold">
                      {projectItems.length} {projectItems.length === 1 ? 'ítem' : 'ítems'}
                    </span>
                  </div>
                  <p className="text-xs text-[#7f765f]">
                    Materiales certificados Pintuco® asignados a tu obra
                  </p>
                </div>
              </div>

              {/* Add Product Manually Button */}
              {lockInfo.canAddProducts ? (
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] font-black text-xs px-4 py-2.5 rounded-full shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  id="btn-add-product-project-status"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>+ Agregar Producto al Proyecto</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 bg-[#f0e7d5] text-[#7f765f] font-bold text-xs px-4 py-2.5 rounded-full border border-[#d1c6ab] cursor-not-allowed opacity-80"
                  title={lockInfo.reason}
                  id="btn-add-product-project-status"
                >
                  <Lock className="w-4 h-4 text-[#7f765f]" />
                  <span>Agregar Producto (Bloqueado)</span>
                </button>
              )}
            </div>

            {/* Locked Phase Alert Banner */}
            {!lockInfo.canAddProducts && (
              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#4d4632]">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-[#725c00] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#1f1b10] block font-bold">
                      Formulación de productos bloqueada ({lockInfo.badgeLabel}):
                    </strong>
                    <span>{lockInfo.reason}</span>
                  </div>
                </div>
                {onNavigateToStore && (
                  <button
                    type="button"
                    onClick={onNavigateToStore}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] font-black text-xs shrink-0 shadow-2xs transition-all hover:scale-[1.02] cursor-pointer self-start sm:self-center"
                    id="btn-goto-store-from-status"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Comprar en Tienda Directa</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick Specs: Area & Prescribed System */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex flex-col justify-between">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  Cálculo de Área y Volumen
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-[#1f1b10]">{projectArea} m²</span>
                  <span className="text-xs text-[#2f5ea1] font-bold">Rendimiento óptimo</span>
                </div>
                <p className="text-xs text-[#7f765f] mt-1.5">
                  2 manos de acabado con rendimiento de 18-22 m²/gal
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex flex-col justify-between">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  Sistema de Pintura Prescrito
                </span>
                <div className="mt-2">
                  <p className="text-sm font-bold text-[#1f1b10]">
                    Viniltex Avanzado Antibacterial
                  </p>
                  <p className="text-xs text-[#2f5ea1] font-bold">
                    + Sellador Acrílico Sellomax®
                  </p>
                </div>
                <p className="text-xs text-[#7f765f] mt-1.5">
                  Fórmula Lavable, Cero Olor & Antihongos Bio-Pruf
                </p>
              </div>
            </div>

            {/* Itemized Products Cards List */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#725c00] uppercase tracking-wider">
                <span>Materiales incluidos en el proyecto</span>
                <span>Subtotal / Acción</span>
              </div>

              {projectItems.map((item, idx) => {
                const hasColor = item.hasColors;
                const colorHex = item.selectedColorHex || '#E28468';
                const colorName = item.selectedColorName || 'Salmón Terracota';
                const colorCode = item.selectedColorCode || 'PT-248-A';

                return (
                  <div
                    key={`${item.sku}-${idx}`}
                    className="p-4 rounded-2xl border border-[#ebe2cf] bg-white hover:border-[#d1c6ab] transition-all shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#f6eddb] text-[#725c00] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono font-bold text-[#7f765f]">
                              {item.sku}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#f6eddb] text-[#725c00] font-bold uppercase">
                              {item.type}
                            </span>
                            {item.isCustomManual && (
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                                Manual / Obra
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm sm:text-base text-[#1f1b10] leading-snug">
                            {item.name}
                          </h4>
                          <p className="text-xs text-[#4d4632]">
                            Presentación: <strong>{item.unit}</strong> • Cantidad: <strong>{item.quantity}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#ebe2cf]">
                        <span className="font-black text-base text-[#1f1b10]">
                          {formatCOP(item.totalCOP)}
                        </span>
                        <span className="text-[11px] text-[#7f765f]">
                          {formatCOP(item.unitPriceCOP)} c/u
                        </span>
                      </div>
                    </div>

                    {/* Color Configuration Section for items that have colors */}
                    {hasColor ? (
                      <div className="p-3 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg shadow-inner border border-black/15 shrink-0"
                            style={{ backgroundColor: colorHex }}
                          ></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1f1b10]">
                                {colorName}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-[#2f5ea1] bg-white px-1.5 py-0.5 rounded border border-[#d1c6ab]/40">
                                {colorCode}
                              </span>
                              <span className="text-[10px] font-mono text-[#7f765f]">
                                {colorHex}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#725c00]">
                              {item.selectedColorMode === 'custom_wheel'
                                ? 'Personalizado vía Rueda de Color & Código'
                                : 'Sugerencia de Color Pintuco® Certificada'}
                            </span>
                          </div>
                        </div>

                        {/* Button to choose between suggestion or color wheel */}
                        {lockInfo.canChangeColors ? (
                          <button
                            type="button"
                            onClick={() => setColorModalTargetIndex(idx)}
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#ebe2cf] text-[#1f1b10] font-bold text-xs flex items-center justify-center gap-1.5 border border-[#d1c6ab] shadow-2xs transition-colors cursor-pointer shrink-0"
                            id={`btn-edit-color-${idx}`}
                          >
                            <Palette className="w-3.5 h-3.5 text-[#725c00]" />
                            <span>Elegir / Cambiar Color</span>
                          </button>
                        ) : (
                          <div
                            className="px-3 py-1.5 rounded-xl bg-[#f6eddb] text-[#7f765f] text-xs font-semibold flex items-center gap-1.5 border border-[#ebe2cf] shrink-0"
                            title={lockInfo.shortWarning}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Color Asignado en Planta</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-[#7f765f] pt-1">
                        <span className="italic">
                          Fórmula incolora / acabado transparente o accesorio estándar
                        </span>
                        {item.isCustomManual && lockInfo.canRemoveProducts && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(idx)}
                            className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Quitar ítem</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Product Action Banner */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              {lockInfo.canAddProducts ? (
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-[#d1c6ab] cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#725c00]" />
                  <span>+ Agregar otro producto o insumo manualmente</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#7f765f] bg-[#fcf3e0] px-4 py-2.5 rounded-xl border border-[#ebe2cf]">
                  <Lock className="w-4 h-4 text-[#7f765f] shrink-0" />
                  <span>
                    No es posible agregar insumos en estado <strong>"{currentStatus}"</strong> ({lockInfo.badgeLabel}).
                  </span>
                </div>
              )}

              <div className="text-right text-xs text-[#4d4632]">
                <span>Total Materiales Estimado: </span>
                <strong className="text-[#1f1b10] text-base font-black ml-1">
                  {formatCOP(projectItems.reduce((acc, it) => acc + (it.totalCOP || 0), 0))}
                </strong>
              </div>
            </div>

            {/* Delivery Address Metadata */}
            <div className="flex items-center gap-3 text-[#4d4632] text-xs pt-4 border-t border-[#ebe2cf]">
              <Truck className="w-4 h-4 text-[#7f765f] shrink-0" />
              <span>
                Dirección de Despacho Registrada:{' '}
                <strong className="text-[#1f1b10] font-bold">{projectAddress}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Span 5) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* Assigned Specialist Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 md:p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs text-[#2f5ea1] font-bold uppercase tracking-wider">
                Asesoría Técnica Pintuco
              </span>
              <span className="bg-[#ffd100]/30 text-[#564500] px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#725c00]" />
                <span>Especialista Asignado</span>
              </span>
            </div>

            <div className="flex items-center gap-4 mb-5">
              <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-xs bg-[#f6eddb] border-2 border-[#ffd100]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuACS_eTh_4l7waamV_o3jpG3aNcMJ8K_HLc0GlSe_9lT3I75ciud4Fn_Z5Tt2IrxcAyoHy5Ofz-81Ntat5RTKllzIOfKxdmqofhBO56ljx-YP3PLHGCdwFQJLAauhDc3snQYCH4_-g0FTJ9JB6dPPVJVFlAsWZyvdKPfjzGIYmH5-RrWwEJ5rJfHKXO_TDNgDrAxgxoaXwsR-MAKtEzauzXuNowk6tTqfJJw61y090b-J1C4EvHrKlE6Q"
                  alt="Ing. Carlos Mario Henao"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#1f1b10]">Ing. Carlos Mario Henao</h4>
                <p className="text-xs text-[#4d4632] font-medium">
                  Consultor Técnico de Recubrimientos Pintuco
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  </div>
                  <span className="text-xs font-bold text-[#1f1b10]">4.9 / 5.0</span>
                  <span className="text-xs text-[#7f765f]">• 450+ prescripciones</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] text-xs text-[#4d4632] mb-5 flex items-start gap-2.5 leading-relaxed">
              <FlaskConical className="w-4 h-4 text-[#2f5ea1] shrink-0 mt-0.5" />
              <span>
                Especialista a cargo de validar las medidas de tu espacio, diagnosticar porosidad y
                certificar la fórmula exacta de pintura.
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="w-full py-3 bg-[#25D366] text-white hover:bg-[#20ba59] text-xs sm:text-sm rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
                id="btn-consult-whatsapp"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Consultar Dudas por WhatsApp</span>
              </button>
              <a
                href="tel:+573124589201"
                className="w-full py-2.5 bg-[#f6eddb] hover:bg-[#f0e7d5] text-[#1f1b10] text-xs rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-[#d1c6ab]/40"
              >
                <Phone className="w-3.5 h-3.5 text-[#2f5ea1]" />
                <span>Llamar al Asesor: +57 312 458 9201</span>
              </a>

              {onNavigateToAdvisorPortal && (
                <button
                  type="button"
                  onClick={onNavigateToAdvisorPortal}
                  className="w-full mt-1 py-2.5 bg-[#ffd100]/20 hover:bg-[#ffd100]/30 text-[#725c00] text-xs rounded-xl font-bold transition-colors flex items-center justify-center gap-2 border border-[#ffd100]/50 cursor-pointer"
                  id="btn-open-advisor-eval"
                >
                  <ShieldCheck className="w-4 h-4 text-[#725c00]" />
                  <span>Módulo de Evaluación Técnica (Acceso Asesor)</span>
                </button>
              )}
            </div>
          </div>

          {/* Next Scheduled Milestone Card / Delivery Confirmation */}
          <div
            className={`rounded-2xl shadow-xs border p-6 md:p-8 transition-all ${
              currentStatus === 'Completada'
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-white border-[#ebe2cf]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Truck
                  className={`w-5 h-5 ${
                    currentStatus === 'Completada' ? 'text-emerald-700' : 'text-[#2f5ea1]'
                  }`}
                />
                <h3 className="text-lg font-bold text-[#1f1b10]">
                  {currentStatus === 'Completada'
                    ? 'Estado de Entrega: ¡ENTREGADO!'
                    : 'Próximo Hito de Entrega'}
                </h3>
              </div>
              {currentStatus === 'Completada' && (
                <span className="text-[11px] font-bold bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>En Obra</span>
                </span>
              )}
            </div>

            {currentStatus === 'Completada' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white border border-emerald-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#4d4632]">Fecha de Entrega:</span>
                    <strong className="text-[#1f1b10]">{request?.deliveryDate || 'Hoy'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4d4632]">Guía de Transporte:</span>
                    <strong className="font-mono text-[#2f5ea1]">
                      {request?.trackingNumber || 'PTC-TRK-892401'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4d4632]">Transportador Asignado:</span>
                    <strong className="text-[#1f1b10]">
                      {request?.assignedCarrier || 'Flota Logística Pintuco Express'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4d4632]">Dirección de Entrega:</span>
                    <strong className="text-[#1f1b10] truncate max-w-[200px]">
                      {projectAddress}
                    </strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCertificateModal(true)}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#ffd100]" />
                  <span>Ver Certificado de Garantía 5 Años Pintuco®</span>
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] mb-4">
                  <div className="flex items-center gap-2 text-[#2f5ea1] font-bold text-xs">
                    <Clock className="w-4 h-4" />
                    <span>
                      {currentStatus === 'En Producción'
                        ? 'En tinturado industrial y envasado'
                        : currentStatus === 'Aprobada QA'
                        ? 'Empacado y listo para despacho'
                        : `Programado para: ${requiredDateFormatted}`}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-[#1f1b10] mt-2 leading-snug">
                    {currentStatus === 'En Producción'
                      ? 'Dispensado en tintometría Giotto y prueba de adherencia'
                      : currentStatus === 'Aprobada QA'
                      ? 'Lote precintado con certificado ISO 9001 en planta'
                      : 'Emisión de Diagnóstico Técnico Oficial y Envío a Tintometría'}
                  </p>
                  <p className="text-xs text-[#7f765f] mt-1">
                    Despacho directo a tu puerta: Entrega estimada {requiredDateFormatted}.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#ffd100]/20 border border-[#ffd100]/30 flex items-start gap-3">
                  <Package className="w-5 h-5 text-[#725c00] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <strong className="text-[#1f1b10] font-bold block mb-0.5">
                      Compromiso Logístico Pintuco:
                    </strong>
                    <p className="text-[#4d4632] leading-relaxed">
                      Los envases viajan sellados con precinto de seguridad y lote de color certificado
                      para garantizar fidelidad cromática 100%.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Financial & Guarantee Summary Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 md:p-8">
            <h3 className="text-lg font-bold text-[#1f1b10] mb-4">Resumen de Pedido & Garantía</h3>

            <div className="space-y-3 mb-6 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#4d4632]">Anticipo Producto (50%):</span>
                <span className="font-bold text-[#2f5ea1] flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#2f5ea1]" /> Confirmado
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#4d4632]">Saldo Final de Producto (50%):</span>
                <span className="font-bold text-[#1f1b10]">Contra entrega al recibir pedido</span>
              </div>
              <div className="h-px bg-[#ebe2cf] my-2"></div>
              <div className="flex items-center justify-between">
                <span className="text-[#4d4632]">Garantía de Calidad:</span>
                <span className="font-bold text-[#725c00]">5 Años de Calidad Pintuco®</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#2f5ea1] shrink-0" />
              <div className="text-xs text-[#4d4632] leading-relaxed">
                Garantía de cubrimiento, lavabilidad y estabilidad de tono expedida directamente por{' '}
                <strong className="text-[#1f1b10]">Pintuco S.A.</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MODAL: EXPEDIENTE FOTOGRÁFICO ===================== */}
      {showFullExpedienteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#ebe2cf]">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1f1b10]">
                  Expediente Completo de Diagnóstico Técnico
                </h3>
                <p className="text-xs sm:text-sm text-[#7f765f]">
                  Inspección fotogramétrica realizada con ColorLink AI • Proyecto {projectCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFullExpedienteModal(false)}
                className="w-9 h-9 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {photos.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl overflow-hidden border border-[#ebe2cf] bg-[#fcf3e0] shadow-xs"
                >
                  <div className="aspect-[16/10] relative overflow-hidden bg-black/10">
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-[#2f5ea1] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Registro #{index + 1}
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-sm text-[#1f1b10] mb-1">{item.title}</h4>
                    <p className="text-xs text-[#4d4632] leading-relaxed">{item.caption}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#ebe2cf] flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullExpedienteModal(false)}
                className="px-6 py-2.5 rounded-full bg-[#ffd100] text-[#1f1b10] font-bold text-xs hover:bg-[#ffc800] transition-colors"
              >
                Cerrar Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: FICHA TÉCNICA DE PRODUCTO ===================== */}
      {showFichaTecnicaModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#ebe2cf]">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd100] flex items-center justify-center text-[#6f5a00] font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1f1b10]">
                    Ficha Técnica Oficial Pintuco®
                  </h3>
                  <p className="text-xs text-[#7f765f]">
                    Viniltex Avanzado Antibacterial • FT-VIN-ADV-2026
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFichaTecnicaModal(false)}
                className="w-9 h-9 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#4d4632]">
              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf]">
                <h4 className="font-bold text-[#1f1b10] mb-1">Descripción del Sistema</h4>
                <p className="leading-relaxed">
                  Pintura tipo emulsión acrílica modificada de máxima lavabilidad, formulada con
                  tecnología antibacterial y cero olor para ambientes habitacionales y de alto
                  tráfico. Cumple norma NTC 1335 Tipo 1.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#fff8f0] border border-[#ebe2cf]">
                  <span className="text-[#7f765f] block">Rendimiento Teórico:</span>
                  <strong className="text-[#1f1b10] font-bold">18 - 22 m² / Galón (2 manos)</strong>
                </div>
                <div className="p-3 rounded-lg bg-[#fff8f0] border border-[#ebe2cf]">
                  <span className="text-[#7f765f] block">Tiempo de Secado al Tacto:</span>
                  <strong className="text-[#1f1b10] font-bold">30 a 45 minutos (25°C)</strong>
                </div>
                <div className="p-3 rounded-lg bg-[#fff8f0] border border-[#ebe2cf]">
                  <span className="text-[#7f765f] block">Segunda Mano (Repinte):</span>
                  <strong className="text-[#1f1b10] font-bold">2 horas</strong>
                </div>
                <div className="p-3 rounded-lg bg-[#fff8f0] border border-[#ebe2cf]">
                  <span className="text-[#7f765f] block">Acabado Óptico:</span>
                  <strong className="text-[#1f1b10] font-bold">Mate Terciopelo Elegante</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#e1edff] text-[#0d4788] text-xs">
                <strong className="block font-bold mb-0.5">Preparación de Superficie:</strong>
                Limpiar todo polvo, grasa o material suelto. Para sustrato con absorción media
                (como el detectado en este proyecto), aplicar 1 mano de Sellador Acrílico 501
                diluido al 20% con agua limpia.
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#ebe2cf] flex items-center justify-between">
              <span className="text-xs text-[#7f765f]">Código Lote Tintometría: LT-BOG-982</span>
              <button
                type="button"
                onClick={() => setShowFichaTecnicaModal(false)}
                className="px-6 py-2.5 rounded-full bg-[#ffd100] text-[#1f1b10] font-bold text-xs hover:bg-[#ffc800] transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: WHATSAPP DIRECTO ===================== */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf]">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-[#1f1b10]">WhatsApp Oficial Pintuco</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#4d4632] leading-relaxed mb-4">
              Te comunicaremos directamente con el{' '}
              <strong className="text-[#1f1b10]">Ing. Carlos Mario Henao</strong> sobre tu proyecto{' '}
              <strong className="text-[#725c00]">{projectCode}</strong>.
            </p>

            <div className="p-3.5 rounded-xl bg-[#f6eddb] text-xs text-[#1f1b10] mb-5 border border-[#d1c6ab]">
              <span className="text-[11px] text-[#7f765f] block uppercase font-bold mb-1">
                Mensaje preconfigurado:
              </span>
              <em>
                "Hola Ing. Carlos Mario, soy el titular del proyecto {projectCode} en {projectCity}.
                Tengo una consulta sobre el diagnóstico de sustrato y la paleta Salmón Terracota."
              </em>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="flex-1 py-2.5 rounded-full border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb]"
              >
                Volver
              </button>
              <a
                href={`https://wa.me/573124589201?text=Hola%20Ing%20Carlos%20Mario,%20soy%20el%20titular%20del%20proyecto%20${projectCode}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: AGREGAR PRODUCTO MANUALMENTE ===================== */}
      {isAddProductModalOpen && (
        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => setIsAddProductModalOpen(false)}
          onAddProduct={handleAddProduct}
          projectStatus={currentStatus}
        />
      )}

      {/* ===================== MODAL: RUEDA DE COLOR & CÓDIGO / SUGERENCIA ===================== */}
      {colorModalTargetIndex !== null && projectItems[colorModalTargetIndex] && (
        <ColorSelectorModal
          isOpen={colorModalTargetIndex !== null}
          onClose={() => setColorModalTargetIndex(null)}
          productName={projectItems[colorModalTargetIndex].name}
          productSku={projectItems[colorModalTargetIndex].sku}
          initialMode={projectItems[colorModalTargetIndex].selectedColorMode || 'suggestion'}
          initialHex={projectItems[colorModalTargetIndex].selectedColorHex || '#E28468'}
          initialName={projectItems[colorModalTargetIndex].selectedColorName || 'Salmón Terracota'}
          initialCode={projectItems[colorModalTargetIndex].selectedColorCode || 'PT-248-A'}
          onApplyColor={handleApplyColorSelection}
        />
      )}

      {/* ===================== MODAL: CERTIFICADO DE GARANTÍA 5 AÑOS & ENTREGA ===================== */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#ebe2cf] animate-fadeIn">
            {/* Certificate Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#ffd100] text-[#6f5a00] px-3 py-1 rounded-xl text-xl font-black">
                  PINTUCO
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#1f1b10]">
                    Certificado de Garantía 5 Años & Entrega en Obra
                  </h3>
                  <span className="text-xs text-[#2f5ea1] font-bold">
                    Ecosistema Digital ColorLink • Certificación ISO 9001:2015
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="w-9 h-9 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Certificate Body */}
            <div className="space-y-5 text-xs sm:text-sm text-[#1f1b10]">
              <div className="p-4 rounded-2xl bg-[#fcf3e0] border border-[#d1c6ab] flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <span className="text-[11px] text-[#7f765f] uppercase font-bold block">
                    Titular del Proyecto
                  </span>
                  <strong className="text-base text-[#1f1b10]">
                    {request?.client?.fullName || 'Cliente Pintuco'}
                  </strong>
                  <p className="text-xs text-[#4d4632] mt-0.5">
                    {request?.client?.documentType}: {request?.client?.documentNumber}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="text-[11px] text-[#7f765f] uppercase font-bold block">
                    Proyecto & Guía
                  </span>
                  <strong className="text-sm font-mono text-[#2f5ea1]">
                    {projectCode}
                  </strong>
                  <p className="text-xs text-[#7f765f] mt-0.5">
                    Guía: {request?.trackingNumber || 'PTC-TRK-892401'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#ebe2cf]">
                  <span className="text-[#7f765f] block">Destino de Entrega:</span>
                  <strong className="text-[#1f1b10]">{projectAddress}, {projectCity}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#ebe2cf]">
                  <span className="text-[#7f765f] block">Fecha de Despacho & Entrega:</span>
                  <strong className="text-[#1f1b10]">
                    {request?.deliveryDate || new Date().toLocaleDateString('es-CO')}
                  </strong>
                </div>
              </div>

              {/* Products List in Certificate */}
              <div>
                <h4 className="font-bold text-xs uppercase text-[#725c00] tracking-wider mb-2">
                  Productos y Recubrimientos Cubiertos por la Garantía:
                </h4>
                <div className="divide-y divide-[#ebe2cf] border border-[#ebe2cf] rounded-xl overflow-hidden bg-white text-xs">
                  {projectItems.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.selectedColorHex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: item.selectedColorHex }}
                          ></span>
                        )}
                        <div>
                          <strong className="text-[#1f1b10] block">{item.name}</strong>
                          <span className="text-[11px] text-[#7f765f]">
                            {item.quantity} {item.unit} • {item.sku}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold text-[#137333]">Garantía 5 Años ✓</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lab Quality Specs Passed */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <strong className="text-emerald-950 block mb-1">
                  Ensayos Técnicos de Calidad Aprobados en Laboratorio Central:
                </strong>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>Viscosidad: <strong>99 KU (Norma)</strong></div>
                  <div>Colorimetría: <strong>ΔE = 0.31 (&lt; 0.5)</strong></div>
                  <div>Adherencia ASTM: <strong>5B (Excelente)</strong></div>
                  <div>Finura: <strong>Hegman 7</strong></div>
                </div>
              </div>

              {/* Signature */}
              <div className="pt-2 flex items-center justify-between text-xs text-[#7f765f] border-t border-[#ebe2cf]">
                <div>
                  <p className="font-bold text-[#1f1b10]">Ing. Laboratorio Central Pintuco</p>
                  <span>Dirección Técnica y Aseguramiento de Calidad</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                    FIRMA DIGITAL VALIDADA
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 rounded-xl bg-[#2f5ea1] hover:bg-[#254b80] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Imprimir / Guardar Certificado</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
