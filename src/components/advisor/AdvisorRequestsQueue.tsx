import React, { useState } from 'react';
import { ProjectRequest } from '../../types';
import {
  Search,
  Filter,
  Layers,
  Calendar,
  MapPin,
  User,
  ArrowRight,
  Sparkles,
  Warehouse,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';

interface AdvisorRequestsQueueProps {
  currentRequest: ProjectRequest | null;
  onSelectProject: (request: ProjectRequest) => void;
  onOpenDiagnosis: (request?: ProjectRequest) => void;
  onOpenInventory: (request?: ProjectRequest) => void;
}

export const AdvisorRequestsQueue: React.FC<AdvisorRequestsQueueProps> = ({
  currentRequest,
  onSelectProject,
  onOpenDiagnosis,
  onOpenInventory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Simulated queue of realistic customer projects in Colombia
  const sampleQueue: ProjectRequest[] = [
    ...(currentRequest
      ? [currentRequest]
      : [
          {
            id: 'PTC-2024-8924',
            createdAt: '2026-05-12T10:00:00Z',
            client: {
              fullName: 'Andrés Cepeda',
              documentType: 'Cédula de Ciudadanía',
              documentNumber: '80.124.982',
              email: 'andres.cepeda@gmail.com',
              phone: '+57 312 458 9201',
            },
            city: 'Bogotá DC',
            address: 'Calle 127 # 19-45 Apto 402, Usaquén',
            areaM2: 45,
            surfaceType: 'Pared',
            condition: 'Para Repintar',
            environment: 'interior',
            colorFamily: 'Salmón Terracota #248-A / Blanco Lienzo #100-B',
            finishPreference: 'Satinado',
            status: 'Cotizada',
            additionalDetails: 'Muro principal en sala con foco de color y perímetro blanco lavable antibacterial.',
          },
        ]),
    {
      id: 'PTC-2024-8925',
      createdAt: '2026-05-14T14:30:00Z',
      client: {
        fullName: 'Arq. Mariana Restrepo',
        documentType: 'NIT',
        documentNumber: '901.442.118-4',
        email: 'proyectos@restrepoarquitectura.co',
        phone: '+57 320 894 1255',
      },
      city: 'Medellín',
      address: 'Carrera 43A # 1-50 Torre Sur, El Poblado',
      areaM2: 240,
      surfaceType: 'Fachada',
      condition: 'Dañado',
      environment: 'exterior',
      colorFamily: 'Gris Basalto / Blanco Ostra Koraza',
      finishPreference: 'Mate',
      status: 'Registrada',
      additionalDetails: 'Edificio residencial con exposición extrema a radiación solar y lluvia andina. Requiere Koraza 10 años.',
    },
    {
      id: 'PTC-2024-8926',
      createdAt: '2026-05-15T09:10:00Z',
      client: {
        fullName: 'Dr. Julián Sarmiento',
        documentType: 'Cédula de Ciudadanía',
        documentNumber: '79.654.321',
        email: 'dr.sarmiento@saludoral.com',
        phone: '+57 310 555 4321',
      },
      city: 'Bogotá DC',
      address: 'Calle 98 # 22-64 Cons. 504, Chicó Norte',
      areaM2: 85,
      surfaceType: 'Drywall',
      condition: 'Nuevo',
      environment: 'interior',
      colorFamily: 'Blanco Puro Hospitalario Viniltex',
      finishPreference: 'Satinado',
      status: 'Cotizada',
      additionalDetails: 'Clínica odontológica con protocolo de desinfección química frecuente. Requiere certificación antibacterial.',
    },
    {
      id: 'PTC-2024-8927',
      createdAt: '2026-05-16T11:45:00Z',
      client: {
        fullName: 'Logística & Bodegas del Norte SAS',
        documentType: 'NIT',
        documentNumber: '830.098.221-1',
        email: 'mantenimiento@bodegasdelnorte.com',
        phone: '+57 (601) 318-9000',
      },
      city: 'Cali',
      address: 'Autopista Cali-Yumbo Km 4 Bodega 12',
      areaM2: 520,
      surfaceType: 'Piso',
      condition: 'Fisurado / Descascarado',
      environment: 'interior',
      colorFamily: 'Gris Tráfico Epóxico Alto Desempeño',
      finishPreference: 'Epóxico Alto Brillo',
      status: 'Inventario Asignado',
      additionalDetails: 'Tránsito de montacargas pesados y derrames ocasionales de lubricantes. Prescripción de Pintuco EpoxiPoliamida.',
    },
    {
      id: 'PTC-2024-8928',
      createdAt: '2026-05-17T16:20:00Z',
      client: {
        fullName: 'Constructora Cúpula Urbana',
        documentType: 'NIT',
        documentNumber: '900.562.880-9',
        email: 'compras@cupulaurbana.co',
        phone: '+57 316 448 9900',
      },
      city: 'Barranquilla',
      address: 'Calle 82 # 56-31 Edificio Mirador del Río',
      areaM2: 320,
      surfaceType: 'Concreto',
      condition: 'Con Humedad',
      environment: 'exterior',
      colorFamily: 'Arena Caribeña Sellante Aquablock',
      finishPreference: 'Mate',
      status: 'Completada',
      additionalDetails: 'Ambiente marino de alta salinidad y humedad relativa superior al 85%. Tratamiento antihongos certificado.',
    },
  ];

  // Filter requests
  const filteredQueue = sampleQueue.filter((req) => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pendientes' && (req.status === 'Registrada' || req.status === 'Analizada por IA')) ||
      (statusFilter === 'cotizada' && req.status === 'Cotizada') ||
      (statusFilter === 'inventario' && req.status === 'Inventario Asignado') ||
      (statusFilter === 'completada' && req.status === 'Completada');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1f1b10] tracking-tight">
            Bandeja de Solicitudes & Expedientes
          </h1>
          <p className="text-xs sm:text-sm text-[#7f765f] mt-1">
            Gestión en tiempo real de proyectos recibidos desde la app y portal de clientes
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-[#ebe2cf] shadow-2xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd100]"></span>
            <span className="text-xs text-[#7f765f]">Total en cola:</span>
            <strong className="text-xs font-black text-[#1f1b10]">{sampleQueue.length}</strong>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-[#e6f4ea] border border-[#ceead6] shadow-2xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#137333]"></span>
            <span className="text-xs text-[#137333]">Área total:</span>
            <strong className="text-xs font-black text-[#137333]">
              {sampleQueue.reduce((acc, q) => acc + q.areaM2, 0)} m²
            </strong>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#ebe2cf] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-96 flex items-center bg-[#fcf8f2] rounded-xl px-3 py-2 border border-[#ebe2cf]">
          <Search className="w-4 h-4 text-[#7f765f] mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por radicado, cliente o ciudad..."
            className="w-full bg-transparent text-xs text-[#1f1b10] placeholder:text-[#7f765f] outline-none font-medium"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'pendientes', label: 'Pendientes' },
            { id: 'cotizada', label: 'Cotizadas' },
            { id: 'inventario', label: 'Con Reserva' },
            { id: 'completada', label: 'Completadas' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#ffd100] text-[#6f5a00] shadow-2xs'
                  : 'bg-[#fcf8f2] text-[#4d4632] hover:bg-[#f6eddb]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="flex flex-col gap-4">
        {filteredQueue.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#ebe2cf] text-[#7f765f]">
            No se encontraron solicitudes con los criterios de búsqueda actuales.
          </div>
        ) : (
          filteredQueue.map((item) => {
            const isSelected = currentRequest?.id === item.id;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-5 border transition-all shadow-xs hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isSelected ? 'border-[#ffd100] ring-2 ring-[#ffd100]/30' : 'border-[#ebe2cf]'
                }`}
              >
                {/* Left: Info */}
                <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-xs font-black bg-[#f0e7d5] px-2.5 py-0.5 rounded-md text-[#1f1b10] border border-[#d1c6ab]/40">
                      {item.id}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.status === 'Completada'
                          ? 'bg-[#e2f3e8] text-[#137333]'
                          : item.status === 'Inventario Asignado'
                          ? 'bg-[#e1edff] text-[#2f5ea1]'
                          : item.status === 'Cotizada'
                          ? 'bg-[#fff0c2] text-[#725c00]'
                          : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}
                    >
                      {item.status}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold bg-[#ffd100] text-[#6f5a00] px-2 py-0.5 rounded-full">
                        ★ Expediente Activo
                      </span>
                    )}
                  </div>

                  {/* Title / Client */}
                  <div>
                    <h2 className="text-base font-black text-[#1f1b10] leading-tight">
                      {item.client.fullName}
                    </h2>
                    <p className="text-xs text-[#7f765f] mt-0.5 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#2f5ea1]" />
                        {item.address} ({item.city})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#725c00]" />
                        {item.surfaceType} ({item.areaM2} m²)
                      </span>
                      <span>•</span>
                      <span>{item.finishPreference || 'Satinado'}</span>
                    </p>
                  </div>

                  {/* Details */}
                  {item.additionalDetails && (
                    <p className="text-xs text-[#4d4632] line-clamp-2 bg-[#fcf8f2] p-2.5 rounded-xl border border-[#ebe2cf]/60">
                      "{item.additionalDetails}"
                    </p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap lg:flex-nowrap shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#ebe2cf]">
                  <a
                    href={`https://wa.me/57${item.client.phone.replace(/\D/g, '')}?text=Hola%20${encodeURIComponent(
                      item.client.fullName
                    )},%20te%20contacto%20desde%20Pintuco%20para%20tu%20proyecto%20${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] transition-colors flex items-center justify-center cursor-pointer"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectProject(item);
                      onOpenInventory(item);
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-[#f6eddb] hover:bg-[#f0e7d5] text-[#1f1b10] text-xs font-bold flex items-center gap-1.5 transition-colors border border-[#d1c6ab]/40 cursor-pointer"
                  >
                    <Warehouse className="w-4 h-4 text-[#2f5ea1]" />
                    <span>Inventario</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectProject(item);
                      onOpenDiagnosis(item);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#6f5a00] text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Evaluar & Diagnosticar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
