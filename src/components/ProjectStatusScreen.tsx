import React, { useState } from 'react';
import { ProjectRequest } from '../types';
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
} from 'lucide-react';

interface ProjectStatusScreenProps {
  request: ProjectRequest | null;
  onNavigateToRequest: () => void;
  onNavigateToEcosystem: () => void;
  onOpenSupport: () => void;
  onNavigateToAdvisorPortal?: () => void;
}

export const ProjectStatusScreen: React.FC<ProjectStatusScreenProps> = ({
  request,
  onNavigateToRequest,
  onNavigateToEcosystem,
  onOpenSupport,
  onNavigateToAdvisorPortal,
}) => {
  // Photos Gallery state
  const photos = [
    {
      id: 0,
      title: 'Espacio Principal Sala & Comedor',
      label: 'Inspección Digital de Superficie',
      url: 'https://lh3.googleusercontent.com/aida/AEtjO1XGulv6BFlNCMVJ-v9Vr6kAcMtzVmUpR20kPQTBrpA2R8HZ9CvuLlA2QwBBX_ihb-pTiv3t4AomJe72yWvfNl6HAO-m9_--tqsoCK9UD8RybLXwjwNZc0TyipvKqr_fViDF28Li-Lez-BBOYw51oOoPeam4O-_vILrAPTrxrFaBmqkdMlVcu8GWo3W5i0zSQozSDfymMslLw4Ms5R2JwY7w0fnYcG2v9js2V5O3AMBHKba7LDU-Zh9XSRRl',
      caption: 'Evaluación técnica: Muros secos sin eflorescencia. Apto para sistema Viniltex.',
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
      caption: 'Pruebas de tono y calibración espectrofotométrica según cartas de color Pintuco.',
    },
    {
      id: 3,
      title: 'Perímetro Total',
      label: '3. Perímetro Total',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDMQ9cZmvQGEnFasKkYdMkA0-lkX4UhgoW8junLqn8HnbfIPxQ4RIDipxYlUWIxn3UzAnlnksoCpeNRTRLh8s8_oXnbY1tQqeIg0nxkCOayLAcW7V6ExYmrpKknveqZ4utpB_MXhaorN_jZYkCXaBw7FdOezU1IfQpyVpQV1-e1XkmRnHiLGLRYAiNFYcOZIFIkF-DRa99XLa8YJibqxsiKfyZhQ3ZigF3N4VjHl3LPoYlpB7r2U5sVuw',
      caption: 'Levantamiento perimetral con descuento de vanos, puertas y ventanería: 45 m² netos.',
    },
  ];

  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showFullExpedienteModal, setShowFullExpedienteModal] = useState(false);
  const [showFichaTecnicaModal, setShowFichaTecnicaModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  // Derived project values or fallbacks matching mockup
  const projectCode = request?.id || 'PTC-2024-8924';
  const projectCity = request?.city ? `${request.city}, Colombia` : 'Bogotá, D.C.';
  const projectAddress = request?.address || 'Calle 127 # 19-45, Apto 402, Bogotá';
  const projectArea = request?.areaM2 || 45;

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
            Actualizado hace 2 horas
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
              <span className="bg-[#d6e3ff] text-[#001b3d] text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2f5ea1]"></span>
                En Proceso • Fase 3 de 5
              </span>
              <span className="text-xs text-[#4d4632] bg-[#f6eddb] px-3 py-1 rounded-full font-medium">
                Garantía 5 Años Pintuco®
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#1f1b10] tracking-tight leading-tight">
              Diagnóstico Técnico y Suministro de Recubrimientos - Sala Principal y Comedor
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[#4d4632] text-xs sm:text-sm pt-1 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2f5ea1]" />
                <span>
                  Solicitud: <strong className="text-[#1f1b10] font-bold">12 May 2024</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#edc200]" />
                <span>
                  Finalización estimada:{' '}
                  <strong className="text-[#1f1b10] font-bold">28 May 2024</strong>
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

      {/* Timeline / Stepper Section */}
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
                style={{ width: '65%' }}
              ></div>
            </div>
            <span className="text-sm font-bold text-[#1f1b10]">65%</span>
          </div>
        </div>

        {/* Stepper Grid */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
            {/* Step 1: Completada */}
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
                <p className="text-xs text-[#7f765f] mt-1">Completada el 12 May</p>
              </div>
            </div>

            {/* Step 2: Completada */}
            <div className="flex md:flex-col items-start gap-4 md:gap-3 p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] transition-all">
              <div className="flex md:flex-col items-center gap-2 w-full">
                <div className="w-10 h-10 rounded-full bg-[#2f5ea1] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-5 h-5 text-white stroke-[2.5]" />
                </div>
                <div className="hidden md:block w-full h-1 bg-[#2f5ea1] rounded-full"></div>
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  Fase 2
                </span>
                <h3 className="text-sm font-bold text-[#1f1b10] leading-tight mt-0.5">
                  Análisis de Superficie
                </h3>
                <p className="text-xs text-[#7f765f] mt-1">Evaluación de fotos lista</p>
              </div>
            </div>

            {/* Step 3: ACTUAL EN CURSO */}
            <div className="flex md:flex-col items-start gap-4 md:gap-3 p-4 rounded-xl bg-[#ffd100]/20 ring-2 ring-[#ffd100] shadow-md transition-all border border-[#ffd100]/40">
              <div className="flex md:flex-col items-center gap-2 w-full">
                <div className="w-10 h-10 rounded-full bg-[#ffd100] text-[#6f5a00] flex items-center justify-center shrink-0 shadow-xs font-bold">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div className="hidden md:block w-full h-1.5 bg-[#ffd100] rounded-full overflow-hidden">
                  <div className="bg-[#725c00] h-full w-2/3 animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#6f5a00] uppercase font-black tracking-wider">
                    Fase 3 • En curso
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#1f1b10] leading-tight mt-0.5">
                  Diagnóstico & Formulación
                </h3>
                <p className="text-xs text-[#4d4632] mt-1">65% cálculo y tintometría</p>
              </div>
            </div>

            {/* Step 4: Pendiente */}
            <div className="flex md:flex-col items-start gap-4 md:gap-3 p-3.5 rounded-xl bg-white border border-[#ebe2cf] opacity-75">
              <div className="flex md:flex-col items-center gap-2 w-full">
                <div className="w-10 h-10 rounded-full bg-[#f6eddb] text-[#7f765f] flex items-center justify-center shrink-0 font-bold text-sm">
                  4
                </div>
                <div className="hidden md:block w-full h-1 bg-[#f6eddb] rounded-full"></div>
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-[#7f765f] uppercase font-bold tracking-wider">
                  Fase 4
                </span>
                <h3 className="text-sm font-semibold text-[#4d4632] leading-tight mt-0.5">
                  Envasado de Producto
                </h3>
                <p className="text-xs text-[#7f765f] mt-1">Est. 20-22 May</p>
              </div>
            </div>

            {/* Step 5: Pendiente */}
            <div className="flex md:flex-col items-start gap-4 md:gap-3 p-3.5 rounded-xl bg-white border border-[#ebe2cf] opacity-75">
              <div className="flex md:flex-col items-center gap-2 w-full">
                <div className="w-10 h-10 rounded-full bg-[#f6eddb] text-[#7f765f] flex items-center justify-center shrink-0 font-bold text-sm">
                  5
                </div>
                <div className="hidden md:block w-full h-1 bg-[#f6eddb] rounded-full"></div>
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-[#7f765f] uppercase font-bold tracking-wider">
                  Fase 5
                </span>
                <h3 className="text-sm font-semibold text-[#4d4632] leading-tight mt-0.5">
                  Entrega & Despacho
                </h3>
                <p className="text-xs text-[#7f765f] mt-1">Est. 24 May</p>
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
                  Análisis de fotos remitidas concluido. Sustrato con porosidad moderada: se prescribe
                  Sellador Antihumedad previo a Viniltex Avanzado. Paleta confirmada: Salmón
                  Terracota & Blanco Lienzo.
                </p>
              </div>
            </div>
            <span className="text-xs text-[#2f5ea1] font-bold px-3 py-1.5 bg-white rounded-lg shadow-2xs border border-[#ebe2cf] whitespace-nowrap">
              Diagnóstico de Sustrato: Aprobado
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

          {/* Technical Specifications Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <Package className="w-6 h-6 text-[#2f5ea1]" />
              <h3 className="text-xl sm:text-2xl font-black text-[#1f1b10]">
                Producto Sugerido & Especificaciones
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Spec 1: Superficie y Rendimiento */}
              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex flex-col justify-between">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  Cálculo de Área y Volumen
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-black text-[#1f1b10]">{projectArea} m²</span>
                  <span className="text-xs text-[#2f5ea1] font-bold">2.5 Galones estimados</span>
                </div>
                <p className="text-xs text-[#7f765f] mt-1.5">
                  2 manos de acabado con rendimiento de 18-20 m²/gal
                </p>
              </div>

              {/* Spec 2: Sistema Recomendado */}
              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] flex flex-col justify-between">
                <span className="text-[11px] text-[#4d4632] uppercase font-bold tracking-wider">
                  Sistema de Pintura Prescrito
                </span>
                <div className="mt-2">
                  <p className="text-sm font-bold text-[#1f1b10]">
                    Viniltex Avanzado Antibacterial
                  </p>
                  <p className="text-xs text-[#2f5ea1] font-bold">
                    + Sellador Acrílico Antihumedad 501
                  </p>
                </div>
                <p className="text-xs text-[#7f765f] mt-1.5">
                  Fórmula Lavable, Cero Olor & Antihongos
                </p>
              </div>
            </div>

            {/* Color Palette Detail Swatches */}
            <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] mb-6">
              <p className="text-xs font-bold text-[#1f1b10] uppercase tracking-wider mb-3">
                Paleta de Color Pintuco® Formulada:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Swatch 1 */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-2xs border border-[#ebe2cf]">
                  <div
                    className="w-12 h-12 rounded-lg shadow-inner shrink-0 border border-black/10"
                    style={{ backgroundColor: '#E28468' }}
                  ></div>
                  <div>
                    <p className="text-sm font-bold text-[#1f1b10]">Salmón Terracota</p>
                    <p className="text-xs text-[#7f765f]">1 Galón • Código Pintuco 248-A</p>
                  </div>
                </div>

                {/* Swatch 2 */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-2xs border border-[#ebe2cf]">
                  <div
                    className="w-12 h-12 rounded-lg shadow-inner shrink-0 border border-black/15"
                    style={{ backgroundColor: '#FAF6EE' }}
                  ></div>
                  <div>
                    <p className="text-sm font-bold text-[#1f1b10]">Blanco Lienzo</p>
                    <p className="text-xs text-[#7f765f]">2 Galones • Código Pintuco 100-B</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address Metadata */}
            <div className="flex items-center gap-3 text-[#4d4632] text-xs pt-2 border-t border-[#ebe2cf]">
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

          {/* Next Scheduled Milestone Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-[#ebe2cf] p-6 md:p-8">
            <div className="flex items-center gap-2.5 mb-4">
              <Truck className="w-5 h-5 text-[#2f5ea1]" />
              <h3 className="text-lg font-bold text-[#1f1b10]">Próximo Hito de Entrega</h3>
            </div>

            <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] mb-4">
              <div className="flex items-center gap-2 text-[#2f5ea1] font-bold text-xs">
                <Clock className="w-4 h-4" />
                <span>Jueves 16 de Mayo, 11:00 AM</span>
              </div>
              <p className="text-sm font-bold text-[#1f1b10] mt-2 leading-snug">
                Emisión de Diagnóstico Técnico Oficial y Envío a Tintometría
              </p>
              <p className="text-xs text-[#7f765f] mt-1">
                Despacho programado a tu puerta: Entrega estimada 24 de Mayo.
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
    </div>
  );
};
