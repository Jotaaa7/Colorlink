import React, { useState, useRef, useEffect } from 'react';
import {
  ProjectRequest,
  SurfaceType,
  SurfaceCondition,
  EnvironmentType,
  DocumentType,
  UserProfile,
} from '../types';
import { SAMPLE_PHOTO_PRESETS, SamplePhotoPreset } from '../data/pintucoProducts';
import { ColorSelectorModal, ColorSelectionResult } from './ColorSelectorModal';
import { PINTUCO_SUGGESTED_COLORS } from '../lib/colorUtils';
import {
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Send,
  Camera,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Clock,
  MapPin,
  UserCheck,
  Palette,
  Disc,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';

interface NewRequestFormProps {
  onSubmitRequest: (request: ProjectRequest) => void;
  isProcessingAI: boolean;
  currentUser?: UserProfile | null;
  onNavigateToStore?: () => void;
}

export const NewRequestForm: React.FC<NewRequestFormProps> = ({
  onSubmitRequest,
  isProcessingAI,
  currentUser,
  onNavigateToStore,
}) => {
  // Form State - Clean initial state so real users enter their own data
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [documentType, setDocumentType] = useState<DocumentType | string>(
    currentUser?.documentType || 'Cédula de Ciudadanía'
  );
  const [documentNumber, setDocumentNumber] = useState(
    currentUser?.documentNumber || ''
  );
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const [city, setCity] = useState(currentUser?.city || '');
  const [address, setAddress] = useState('');
  const [areaM2, setAreaM2] = useState<number | string>('');
  const [requiredDate, setRequiredDate] = useState('');
  const [surfaceType, setSurfaceType] = useState<SurfaceType>('Pared');
  const [condition, setCondition] = useState<SurfaceCondition>('Nuevo');
  const [environment, setEnvironment] = useState<EnvironmentType>('interior');

  // Update contact fields when user changes or logs in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.fullName) setFullName(currentUser.fullName);
      if (currentUser.documentType) setDocumentType(currentUser.documentType);
      if (currentUser.documentNumber) setDocumentNumber(currentUser.documentNumber);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.phone) setPhone(currentUser.phone);
      if (currentUser.city) setCity(currentUser.city);
    }
  }, [currentUser]);

  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [photoName, setPhotoName] = useState<string>('');

  const [additionalDetails, setAdditionalDetails] = useState('');
  const [colorTone, setColorTone] = useState('');
  const [selectedColorHex, setSelectedColorHex] = useState('#E28468');
  const [selectedColorName, setSelectedColorName] = useState('Arena Cálido');
  const [selectedColorCode, setSelectedColorCode] = useState('PT-248-A');
  const [selectedColorMode, setSelectedColorMode] = useState<'suggestion' | 'custom_wheel'>('suggestion');
  const [showColorWheelModal, setShowColorWheelModal] = useState(false);
  const [finishPreference, setFinishPreference] = useState<'Mate' | 'Satinado' | 'Brillante'>('Mate');

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick Preset Selection
  const handleSelectPreset = (preset: SamplePhotoPreset) => {
    setPhotoUrl(preset.url);
    setPhotoBase64('');
    setPhotoName(preset.title);
    setSurfaceType(preset.surface);
    setCondition(preset.condition);
    setEnvironment(preset.environment);
    setAreaM2(preset.suggestedM2);
  };

  // Handle File Upload
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPhotoBase64(result);
      setPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRequest: ProjectRequest = {
      id: `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      client: {
        fullName: fullName.trim() || 'Cliente Pintuco',
        documentType,
        documentNumber: documentNumber.trim() || 'Sin especificar',
        email: email.trim() || 'cliente@pintuco.com',
        phone: phone.trim() || 'Sin teléfono',
      },
      city: city.trim() || 'Bogotá',
      address: address.trim() || 'Obra Principal',
      areaM2: Number(areaM2) || 50,
      requiredDate: requiredDate || new Date().toISOString().split('T')[0],
      surfaceType,
      condition,
      environment,
      photoUrl,
      photoBase64,
      additionalDetails: `${additionalDetails} [Color: ${selectedColorName} (${selectedColorCode || selectedColorHex}), Acabado: ${finishPreference}]`,
      colorFamily: selectedColorName,
      selectedColorHex,
      selectedColorName,
      selectedColorCode,
      selectedColorMode,
      finishPreference,
      status: 'Registrada',
    };

    onSubmitRequest(newRequest);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        {/* Left Column: Context Image (Matches screenshot) */}
        <div className="w-full lg:w-1/3 shrink-0">
          <div className="sticky top-24 rounded-2xl overflow-hidden shadow-md border border-[#ebe2cf] bg-white group">
            <div className="relative h-[480px] sm:h-[580px] w-full overflow-hidden bg-gradient-to-br from-[#1f1b10] via-[#3a2f18] to-[#121008]">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Registro fotográfico del proyecto"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full opacity-40 bg-[radial-gradient(#ffd100_1px,transparent_1px)] [background-size:16px_16px]"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffd100] text-[#1f1b10] text-xs font-bold w-fit mb-3 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ecosistema ColorLink
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
                  Transforma tus espacios
                </h3>
                <p className="text-sm sm:text-base text-white/90 leading-relaxed font-normal">
                  Expertos en recubrimientos y color para darle vida a tus proyectos con automatización técnica e IA.
                </p>

                {photoName && (
                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/80">
                    <span className="truncate max-w-[200px]">{photoName}</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[11px] font-semibold uppercase">
                      {surfaceType} • {environment}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Preset Selector for Demo */}
            <div className="p-4 bg-[#fcf3e0] border-t border-[#ebe2cf]">
              <div className="text-xs font-bold text-[#725c00] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Ejemplos de Proyecto para Diagnóstico Rápido:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PHOTO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="text-left text-xs p-2 rounded-lg bg-white border border-[#d1c6ab] hover:border-[#725c00] hover:bg-[#fff8f0] transition-all font-medium text-[#1f1b10] flex items-center gap-2 group/btn"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ffd100] group-hover/btn:scale-125 transition-transform"></span>
                    <span className="truncate">{preset.title.split('(')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Form (Exact Design Match) */}
        <div className="w-full lg:w-2/3">
          {/* Header Title */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#1f1b10] tracking-tight mb-2">
              Nueva Solicitud
            </h1>
            <p className="text-base sm:text-lg text-[#4d4632] leading-relaxed">
              Proporciona los detalles de tu proyecto para comenzar con recubrimientos profesionales y formulación automatizada.
            </p>
          </div>

          {/* Quick Direct Purchase Banner (Buy without project) */}
          {onNavigateToStore && (
            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#e1edff] via-[#f0f6ff] to-[#fff8f0] border border-[#bfdbfe] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0d4788] text-[#ffd100] flex items-center justify-center shrink-0 shadow-xs">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-[#0d4788] text-white">
                      Compra Rápida
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-[#0d4788]">
                      ¿Solo necesitas comprar pintura o herramientas sin proyecto?
                    </h3>
                  </div>
                  <p className="text-xs text-[#4d4632] mt-0.5">
                    Adquiere directo con entrega en 24h a nivel nacional sin necesidad de diagnósticos ni aprobaciones.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onNavigateToStore}
                className="px-4 py-2.5 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] font-black text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer hover:scale-[1.02]"
                id="btn-goto-direct-store-from-form"
              >
                <span>Comprar en Tienda Directa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" id="colorlink-request-form">
            {/* Section 1: Datos del Cliente */}
            <section
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf] transition-shadow hover:shadow-sm"
              id="section-client-data"
            >
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#ffd100] flex items-center justify-center text-[#6f5a00] font-bold shadow-xs">
                    <span className="material-symbols-outlined text-2xl">person</span>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[#1f1b10] leading-tight">
                      Datos del Cliente
                    </h2>
                    <p className="text-xs sm:text-sm text-[#7f765f]">
                      Información básica de contacto
                    </p>
                  </div>
                </div>

                {currentUser && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fcf3e0] border border-[#d1c6ab] text-xs font-semibold text-[#725c00]">
                    <UserCheck className="w-3.5 h-3.5 text-[#725c00]" />
                    <span>Conectado: {currentUser.fullName} ({currentUser.role})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="fullName">
                    Nombre Completo / Razón Social
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ingresa tu nombre completo o empresa"
                    className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="documentType">
                    Tipo de Documento
                  </label>
                  <div className="relative">
                    <select
                      id="documentType"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs appearance-none pr-10"
                    >
                      <option value="NIT">NIT (Empresas y Contratistas)</option>
                      <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                      <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-[#7f765f]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="documentNumber">
                    Número de Documento
                  </label>
                  <input
                    id="documentNumber"
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Ingresa el número de identificación"
                    className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="email">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="phone">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 (300) 000-0000"
                    className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Detalles de la Solicitud */}
            <section
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf] transition-shadow hover:shadow-sm"
              id="section-request-details"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#8cb7ff] flex items-center justify-center text-[#0d4788] font-bold shadow-xs">
                  <span className="material-symbols-outlined text-2xl">architecture</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1f1b10] leading-tight">
                    Detalles de la Solicitud
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7f765f]">
                    Ubicación y características técnicas del proyecto
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="city">
                    Ciudad / Municipio
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ej., Bogotá, Medellín, Cali..."
                    className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="address">
                    Dirección de la obra
                  </label>
                  <input
                    id="address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Dirección o punto de referencia"
                    className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="areaM2">
                    Área (metros cuadrados)
                  </label>
                  <div className="relative">
                    <input
                      id="areaM2"
                      type="number"
                      min="1"
                      required
                      value={areaM2}
                      onChange={(e) => setAreaM2(e.target.value)}
                      placeholder="0"
                      className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 pr-12 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs font-semibold"
                    />
                    <span className="absolute right-4 top-3 text-[#7f765f] font-bold text-sm">
                      m²
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="requiredDate">
                    Fecha Requerida
                  </label>
                  <input
                    id="requiredDate"
                    type="date"
                    required
                    value={requiredDate}
                    onChange={(e) => setRequiredDate(e.target.value)}
                    className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="surfaceType">
                    Tipo de Superficie
                  </label>
                  <div className="relative">
                    <select
                      id="surfaceType"
                      value={surfaceType}
                      onChange={(e) => setSurfaceType(e.target.value as SurfaceType)}
                      className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs appearance-none pr-10"
                    >
                      <option value="Pared">Pared / Mampostería</option>
                      <option value="Fachada">Fachada Exterior</option>
                      <option value="Drywall">Drywall / Yeso</option>
                      <option value="Piso">Piso de Concreto / Tráfico</option>
                      <option value="Metal">Estructura Metálica</option>
                      <option value="Madera">Madera / Carpintería</option>
                      <option value="Concreto">Concreto a la Vista</option>
                      <option value="Techo">Techo / Cubierta</option>
                      <option value="Tanque Industrial">Tanque Industrial / Silo</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-[#7f765f]">
                      expand_more
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="condition">
                    Condición Actual
                  </label>
                  <div className="relative">
                    <select
                      id="condition"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as SurfaceCondition)}
                      className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs appearance-none pr-10"
                    >
                      <option value="Nuevo">Nuevo (Obra Blanca / Concreto curado)</option>
                      <option value="Para Repintar">Para Repintar (Buen estado general)</option>
                      <option value="Dañado">Dañado (Fisuras / Desprendimiento)</option>
                      <option value="Con Humedad">Con Humedad o Salitre</option>
                      <option value="Con Óxido">Con Óxido / Corrosión</option>
                      <option value="Fisurado / Descascarado">Fisurado / Descascarado</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-3.5 pointer-events-none text-[#7f765f]">
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Ambiente Radio Pills */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]">
                    Ambiente
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label
                      className={`flex items-center gap-3 cursor-pointer p-3.5 border rounded-xl transition-all flex-1 justify-center ${
                        environment === 'interior'
                          ? 'border-[#725c00] bg-[#fcf3e0] ring-1 ring-[#725c00]'
                          : 'border-[#d1c6ab] bg-white hover:bg-[#fff8f0]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="environment"
                        value="interior"
                        checked={environment === 'interior'}
                        onChange={() => setEnvironment('interior')}
                        className="w-5 h-5 text-[#725c00] focus:ring-[#ffd100]"
                      />
                      <span className="text-base font-semibold text-[#1f1b10] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xl text-[#725c00]">
                          home
                        </span>
                        Interior
                      </span>
                    </label>

                    <label
                      className={`flex items-center gap-3 cursor-pointer p-3.5 border rounded-xl transition-all flex-1 justify-center ${
                        environment === 'exterior'
                          ? 'border-[#725c00] bg-[#fcf3e0] ring-1 ring-[#725c00]'
                          : 'border-[#d1c6ab] bg-white hover:bg-[#fff8f0]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="environment"
                        value="exterior"
                        checked={environment === 'exterior'}
                        onChange={() => setEnvironment('exterior')}
                        className="w-5 h-5 text-[#725c00] focus:ring-[#ffd100]"
                      />
                      <span className="text-base font-semibold text-[#1f1b10] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xl text-[#2f5ea1]">
                          wb_sunny
                        </span>
                        Exterior
                      </span>
                    </label>
                  </div>
                </div>

                {/* Photo Upload Dropzone (Exact screenshot match) */}
                <div className="col-span-1 md:col-span-2 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-[#1f1b10] flex items-center gap-1.5">
                      Registro Fotográfico
                      <span className="text-xs font-normal text-[#7f765f]">
                        (La IA analizará la textura y patologías de la superficie)
                      </span>
                    </label>
                    {photoUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl('');
                          setPhotoBase64('');
                          setPhotoName('');
                        }}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Quitar foto
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group ${
                      isDragging
                        ? 'border-[#725c00] bg-[#f6eddb] scale-[0.99]'
                        : 'border-[#edc200] bg-[#ffd100]/10 hover:bg-[#ffd100]/20'
                    }`}
                    id="photo-upload-dropzone"
                  >
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#ffd100] text-[#6f5a00] flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                      <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-bold text-[#1f1b10] mb-1">
                      Sube tus fotos aquí
                    </h4>
                    <p className="text-sm sm:text-base text-[#4d4632] mb-2 font-medium">
                      Arrastra y suelta tus archivos o haz clic para explorar
                    </p>
                    <p className="text-xs text-[#7f765f]">
                      Formatos soportados: JPG, PNG, WEBP. Tamaño máximo: 10MB
                    </p>

                    {photoName && (
                      <div className="mt-4 px-4 py-2 rounded-xl bg-white border border-[#d1c6ab] inline-flex items-center gap-2 text-xs font-semibold text-[#1f1b10]">
                        <ImageIcon className="w-4 h-4 text-[#725c00]" />
                        <span>Foto seleccionada: {photoName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Comentarios Adicionales */}
            <section
              className="bg-white rounded-2xl p-6 sm:p-8 shadow-xs border border-[#ebe2cf] transition-shadow hover:shadow-sm"
              id="section-additional-comments"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#ffc9c3] flex items-center justify-center text-[#bc0013] font-bold shadow-xs">
                  <span className="material-symbols-outlined text-2xl">edit_note</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1f1b10] leading-tight">
                    Comentarios Adicionales
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7f765f]">Opcional</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-semibold text-[#1f1b10]" htmlFor="additionalDetails">
                    Detalles Adicionales y Requerimientos Especiales
                  </label>
                  <textarea
                    id="additionalDetails"
                    rows={4}
                    value={additionalDetails}
                    onChange={(e) => setAdditionalDetails(e.target.value)}
                    placeholder="Proporciona cualquier requerimiento específico, preferencias de color o detalles que debamos saber..."
                    className="w-full rounded-lg border border-[#d1c6ab] bg-white py-3 px-4 text-sm sm:text-base text-[#1f1b10] focus:border-[#725c00] focus:ring-2 focus:ring-[#ffd100] outline-hidden transition-all shadow-2xs resize-none"
                  ></textarea>
                </div>

                {/* Color & Finish Selection with Color Wheel & Code Choice */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold text-[#725c00] uppercase tracking-wider">
                        Color / Tono Seleccionado
                      </label>
                      <p className="text-xs text-[#7f765f]">
                        Elige entre sugerencias certificadas Pintuco® o utiliza la rueda de color y código
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowColorWheelModal(true)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-[#f6eddb] text-[#1f1b10] font-bold text-xs flex items-center justify-center gap-2 border border-[#d1c6ab] shadow-2xs transition-colors cursor-pointer shrink-0"
                      id="btn-open-wheel-new-request"
                    >
                      <Disc className="w-4 h-4 text-[#2f5ea1]" />
                      <span>Rueda de Color & Código Hex</span>
                    </button>
                  </div>

                  {/* Selected Color Card Display */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#fcf3e0] border border-[#ebe2cf]">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-xl shadow-inner border border-black/15 shrink-0"
                        style={{ backgroundColor: selectedColorHex }}
                      ></div>
                      <div>
                        <span className="text-[10px] text-[#7f765f] uppercase font-bold">
                          Tono Activo:
                        </span>
                        <div className="font-bold text-sm text-[#1f1b10]">
                          {selectedColorName}
                        </div>
                        <div className="text-xs font-mono text-[#725c00]">
                          {selectedColorCode} • {selectedColorHex}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {PINTUCO_SUGGESTED_COLORS.slice(0, 5).map((col) => {
                        const isSelected = selectedColorHex.toUpperCase() === col.hex.toUpperCase();
                        return (
                          <button
                            key={col.code}
                            type="button"
                            onClick={() => {
                              setSelectedColorHex(col.hex);
                              setSelectedColorName(col.name);
                              setSelectedColorCode(col.code);
                              setColorTone(`${col.name} (${col.code} • ${col.hex})`);
                            }}
                            title={`${col.name} (${col.code})`}
                            className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 shrink-0 ${
                              isSelected ? 'border-[#725c00] ring-2 ring-[#ffd100]' : 'border-black/10'
                            }`}
                            style={{ backgroundColor: col.hex }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Finish Preference */}
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-[#725c00] uppercase tracking-wider">
                      Tipo de Acabado Óptico
                    </label>
                    <div className="flex gap-2">
                      {(['Mate', 'Satinado', 'Brillante'] as const).map((finish) => (
                        <button
                          key={finish}
                          type="button"
                          onClick={() => setFinishPreference(finish)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                            finishPreference === finish
                              ? 'bg-[#725c00] text-white shadow-xs'
                              : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
                          }`}
                        >
                          {finish}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Submit Button (Exact screenshot styling) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 pb-8">
              <div className="flex items-center gap-2 text-xs text-[#7f765f]">
                <Sparkles className="w-4 h-4 text-[#ffd100]" />
                <span>
                  ColorLink calculará formulación, stock en planta, ficha técnica y cotización al instante.
                </span>
              </div>

              <button
                type="submit"
                disabled={isProcessingAI}
                className="w-full sm:w-auto bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] font-bold text-base px-9 py-4 rounded-full shadow-md hover:-translate-y-1 hover:shadow-lg active:translate-y-0 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:hover:translate-y-0"
                id="submit-request-btn"
              >
                {isProcessingAI ? (
                  <>
                    <div className="w-5 h-5 border-3 border-[#1f1b10] border-t-transparent rounded-full animate-spin"></div>
                    <span>Procesando con ColorLink IA...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar Solicitud</span>
                    <span className="material-symbols-outlined text-xl">send</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal for selecting color via Suggestion vs Wheel & Code */}
      {showColorWheelModal && (
        <ColorSelectorModal
          isOpen={showColorWheelModal}
          onClose={() => setShowColorWheelModal(false)}
          productName="Acabado de Superficie"
          initialMode="custom_wheel"
          initialHex={selectedColorHex}
          initialName={selectedColorName}
          initialCode={selectedColorCode}
          onApplyColor={(result: ColorSelectionResult) => {
            setSelectedColorHex(result.hex);
            setSelectedColorName(result.name);
            setSelectedColorCode(result.code);
            setSelectedColorMode(result.mode);
            setColorTone(`${result.name} (${result.code} • ${result.hex})`);
          }}
        />
      )}
    </div>
  );
};
