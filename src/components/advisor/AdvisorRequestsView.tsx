import React, { useState, useEffect } from 'react';
import { ProjectRequest } from '../../types';
import { AdvisorStatusModal, ValidProjectStatus } from './AdvisorStatusModal';
import {
  sendProjectStatusNotification,
  fetchProjectsFromDb,
  saveProjectToDb,
} from '../../services/renderDbService';
import {
  Search,
  Filter,
  User,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  Send,
  Building2,
  FileText,
  AlertCircle,
  X,
  Phone,
  Mail,
  SlidersHorizontal,
  RefreshCw,
  Warehouse,
} from 'lucide-react';

interface AdvisorRequestsViewProps {
  currentRequest: ProjectRequest | null;
  onSelectRequestForDiagnosis: (req: ProjectRequest) => void;
  onUpdateProject?: (updatedRequest: ProjectRequest) => void;
  onShowToast: (msg: string) => void;
}

export const AdvisorRequestsView: React.FC<AdvisorRequestsViewProps> = ({
  currentRequest,
  onSelectRequestForDiagnosis,
  onUpdateProject,
  onShowToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendientes' | 'cotizadas' | 'asignadas'>('todas');
  const [surfaceFilter, setSurfaceFilter] = useState<string>('todas');
  const [inspectingRequest, setInspectingRequest] = useState<ProjectRequest | null>(null);
  const [statusModalRequest, setStatusModalRequest] = useState<ProjectRequest | null>(null);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Standard demonstration requests + dynamic active user request
  const [requestsList, setRequestsList] = useState<ProjectRequest[]>(() => {
    const initialList: ProjectRequest[] = [
      ...(currentRequest ? [currentRequest] : []),
      {
        id: 'PTC-2024-8925',
        createdAt: '2024-05-14T10:30:00Z',
        client: {
          fullName: 'Constructora Bolívar - Ing. Marcela Duarte',
          documentType: 'NIT',
          documentNumber: '900.124.582-1',
          email: 'proyectos@constructorabolivar.com',
          phone: '+57 (311) 489-2910',
        },
        city: 'Medellín',
        address: 'El Poblado, Cra 43A # 18 Sur-35',
        areaM2: 120,
        requiredDate: '2024-05-28',
        surfaceType: 'Fachada',
        condition: 'Para Repintar',
        environment: 'exterior',
        additionalDetails: 'Edificio corporativo de 4 pisos. Requiere impermeabilización exterior extrema con Koraza 10 Años en acabado blanco perla y gris pizarra.',
        status: 'Analizada por IA',
        colorFamily: 'Blanco Perla / Gris Pizarra',
        finishPreference: 'Mate',
      },
      {
        id: 'PTC-2024-8926',
        createdAt: '2024-05-13T16:45:00Z',
        client: {
          fullName: 'Arq. Valeria Gómez - Estudio Espacio',
          documentType: 'Cédula de Ciudadanía',
          documentNumber: '52.890.312',
          email: 'valeria@espacioarquitectura.co',
          phone: '+57 (316) 720-4491',
        },
        city: 'Cali',
        address: 'Granada, Calle 15N # 9N-22',
        areaM2: 85,
        requiredDate: '2024-05-22',
        surfaceType: 'Pared',
        condition: 'Nuevo',
        environment: 'interior',
        additionalDetails: 'Restaurante bar en zona gastronómica. Se solicita Viniltex Avanzado en tonos terracota cálido y verde oliva mate de alta resistencia al lavado.',
        status: 'Cotizada',
        colorFamily: 'Terracota Cálido #D97746',
        finishPreference: 'Mate',
      },
      {
        id: 'PTC-2024-8927',
        createdAt: '2024-05-12T09:15:00Z',
        client: {
          fullName: 'Bodegas & Logística del Norte S.A.S',
          documentType: 'NIT',
          documentNumber: '830.419.002-8',
          email: 'mantenimiento@logisticadelnorte.com',
          phone: '+57 (300) 811-9233',
        },
        city: 'Barranquilla',
        address: 'Zona Franca de Barranquilla, Manzana D',
        areaM2: 340,
        requiredDate: '2024-06-05',
        surfaceType: 'Piso',
        condition: 'Dañado',
        environment: 'interior',
        additionalDetails: 'Pisos de planta de almacenamiento con tránsito pesado de montacargas. Requiere sistema Epóxico Autonivelante de 2 componentes.',
        status: 'Registrada',
        colorFamily: 'Gris Tráfico Industrial',
        finishPreference: 'Epóxico Alto Brillo',
      },
    ];
    return Array.from(new Map(initialList.map((item) => [item.id, item])).values());
  });

  // Dynamically load all real requests from Render PostgreSQL on mount
  const refreshRequestsFromDb = async () => {
    setIsLoadingDb(true);
    try {
      const dbProjects = await fetchProjectsFromDb();
      if (dbProjects && Array.isArray(dbProjects) && dbProjects.length > 0) {
        const normalized = dbProjects.map((p: any) => ({
          ...p,
          client: p.client || {
            fullName: p.clientName || 'Cliente ColorLink',
            email: p.clientEmail || '',
            phone: p.clientPhone || '',
            documentType: p.clientType || 'NIT',
            documentNumber: '',
          },
          surfaceType: p.surfaceType || 'Pared',
          city: p.city || 'Bogotá',
          address: p.address || 'Dirección registrada',
          areaM2: Number(p.areaM2) || 45,
          status: p.status || 'Registrada',
        }));

        setRequestsList((prev) => {
          const map = new Map<string, ProjectRequest>();
          // Add all database requests first
          normalized.forEach((it) => map.set(it.id, it));
          if (currentRequest) {
            map.set(currentRequest.id, currentRequest);
          }
          // Preserve demo items if needed
          prev.forEach((it) => {
            if (!map.has(it.id)) map.set(it.id, it);
          });
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.warn('Error cargando solicitudes en AdvisorRequestsView:', err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  useEffect(() => {
    refreshRequestsFromDb();
  }, [currentRequest?.id]);

  const handleSaveStatus = (newStatus: ValidProjectStatus, advisorNote?: string, trackingNumber?: string) => {
    if (!statusModalRequest) return;

    const updated: ProjectRequest = {
      ...statusModalRequest,
      status: newStatus,
      technicalReviewNotes: advisorNote || statusModalRequest.technicalReviewNotes,
      trackingNumber: trackingNumber || statusModalRequest.trackingNumber,
      ...(newStatus === 'Aprobada QA' || newStatus === 'Inventario Asignado'
        ? { approvedAt: statusModalRequest.approvedAt || new Date().toISOString() }
        : {}),
      ...(newStatus === 'Completada' ? { completedAt: new Date().toISOString() } : {}),
    };

    setRequestsList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (inspectingRequest?.id === updated.id) {
      setInspectingRequest(updated);
    }
    if (onUpdateProject) {
      onUpdateProject(updated);
    }
    // Asynchronously save to PostgreSQL in Render
    saveProjectToDb(updated).catch((err) => console.warn('Error actualizando proyecto en BD:', err));

    // Asynchronously send project status update email to the customer
    sendProjectStatusNotification(updated, newStatus, statusModalRequest.status).then((res) => {
      if (res.success && res.result?.success) {
        onShowToast(
          `Estado de ${updated.id} actualizado a "${newStatus}" • Correo enviado al cliente (${res.result.provider || 'SMTP'})`
        );
      }
    });
    onShowToast(`Estado del expediente ${updated.id} actualizado a: "${newStatus}"`);
    setStatusModalRequest(null);
  };

  const filteredRequests = requestsList.filter((req) => {
    const clientName = req.client?.fullName || (req as any).clientName || 'Cliente';
    const city = req.city || '';
    const address = req.address || '';
    const surface = req.surfaceType || '';

    const matchesSearch =
      (req.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      surface.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'todas' ||
      (statusFilter === 'pendientes' && (req.status === 'Registrada' || req.status === 'Analizada por IA')) ||
      (statusFilter === 'cotizadas' && req.status === 'Cotizada') ||
      (statusFilter === 'asignadas' && (req.status === 'Inventario Asignado' || req.status === 'Aprobada QA' || req.status === 'Completada'));

    const matchesSurface =
      surfaceFilter === 'todas' || req.surfaceType === surfaceFilter;

    return matchesSearch && matchesStatus && matchesSurface;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#dcfce7] text-[#166534] text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Entregado / Completada
          </span>
        );
      case 'Aprobada QA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ecfdf5] text-[#047857] text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprobada QA
          </span>
        );
      case 'En Producción':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e1edff] text-[#0d4788] text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            En Producción
          </span>
        );
      case 'Inventario Asignado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#e6f4ea] text-[#137333] text-xs font-bold">
            <Warehouse className="w-3.5 h-3.5" />
            Inventario Asignado
          </span>
        );
      case 'Cotizada':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ffe07f] text-[#231b00] text-xs font-bold">
            <Clock className="w-3.5 h-3.5" />
            Cotizada
          </span>
        );
      case 'Analizada por IA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d6e3ff] text-[#001b3d] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#2f5ea1]" />
            Analizada IA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f6eddb] text-[#725c00] text-xs font-bold">
            <AlertCircle className="w-3.5 h-3.5" />
            Registrada / Nueva
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white rounded-2xl p-6 border border-[#ebe2cf] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#ffd100] text-[#6f5a00] text-xs font-black uppercase tracking-wider">
              Bandeja de Entrada
            </span>
            <span className="text-xs text-[#7f765f] font-semibold">
              {filteredRequests.length} expedientes encontrados
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1f1b10] mt-1">
            Gestión de Solicitudes y Radicados Técnicos
          </h2>
          <p className="text-xs sm:text-sm text-[#4d4632] mt-0.5">
            Selecciona un proyecto para calibrar sustratos con visión artificial, asignar lotes y emitir cotización.
          </p>
        </div>

        {/* Quick action info & Refresh Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={refreshRequestsFromDb}
            disabled={isLoadingDb}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#f6eddb] border border-[#d1c6ab] text-xs font-bold text-[#725c00] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Recargar solicitudes de la base de datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDb ? 'animate-spin' : ''}`} />
            <span>{isLoadingDb ? 'Sincronizando...' : 'Actualizar'}</span>
          </button>

          <div className="flex items-center gap-2.5 bg-[#fcf3e0] px-3.5 py-2 rounded-xl border border-[#ebe2cf]">
            <Sparkles className="w-4 h-4 text-[#2f5ea1] shrink-0" />
            <div className="text-[11px]">
              <span className="font-bold text-[#1f1b10] block">PostgreSQL Conectado</span>
              <span className="text-[#7f765f]">{requestsList.length} registros en sistema</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#ebe2cf] shadow-xs flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f765f]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por radicado, cliente, ciudad o dirección..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f6eddb]/50 border border-[#d1c6ab]/60 text-xs sm:text-sm text-[#1f1b10] placeholder:text-[#7f765f] focus:outline-none focus:border-[#725c00]"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="inline-flex rounded-xl bg-[#f6eddb] p-1 border border-[#ebe2cf]">
            <button
              type="button"
              onClick={() => setStatusFilter('todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'todas'
                  ? 'bg-white text-[#1f1b10] shadow-xs'
                  : 'text-[#4d4632] hover:text-[#1f1b10]'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendientes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'pendientes'
                  ? 'bg-white text-[#1f1b10] shadow-xs'
                  : 'text-[#4d4632] hover:text-[#1f1b10]'
              }`}
            >
              Por Evaluar
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('cotizadas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'cotizadas'
                  ? 'bg-white text-[#1f1b10] shadow-xs'
                  : 'text-[#4d4632] hover:text-[#1f1b10]'
              }`}
            >
              Cotizadas
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('asignadas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === 'asignadas'
                  ? 'bg-white text-[#1f1b10] shadow-xs'
                  : 'text-[#4d4632] hover:text-[#1f1b10]'
              }`}
            >
              Asignadas
            </button>
          </div>

          {/* Surface Filter Dropdown */}
          <select
            value={surfaceFilter}
            onChange={(e) => setSurfaceFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#f6eddb] border border-[#d1c6ab]/60 text-xs font-bold text-[#4d4632] focus:outline-none cursor-pointer"
          >
            <option value="todas">Todas las Superficies</option>
            <option value="Pared">Muros / Pared</option>
            <option value="Fachada">Fachada Exterior</option>
            <option value="Piso">Piso Industrial</option>
            <option value="Metal">Metales / Estructuras</option>
            <option value="Madera">Maderas</option>
          </select>
        </div>
      </div>

      {/* Requests Table / Cards */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#ebe2cf]">
            <Search className="w-12 h-12 text-[#7f765f] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1f1b10]">No se encontraron solicitudes</h3>
            <p className="text-xs text-[#7f765f] mt-1">
              Prueba cambiando el texto de búsqueda o el filtro de estado.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isCurrentlySelected = currentRequest?.id === req.id;

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs hover:shadow-md ${
                  isCurrentlySelected
                    ? 'border-[#725c00] ring-2 ring-[#ffd100]/40 bg-[#fffdfa]'
                    : 'border-[#ebe2cf] hover:border-[#d1c6ab]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: ID, Client & Address */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black bg-[#f6eddb] text-[#1f1b10] px-2.5 py-0.5 rounded border border-[#d1c6ab]/50">
                        {req.id}
                      </span>
                      {getStatusBadge(req.status)}

                      {/* Fast Advisor Status Changer Button */}
                      <button
                        type="button"
                        onClick={() => setStatusModalRequest(req)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff8f0] hover:bg-[#ffd100] text-[#725c00] hover:text-[#0d4788] border border-[#d1c6ab] text-[11px] font-black transition-all shadow-2xs cursor-pointer"
                        title="Cambiar el estado de este proyecto"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-[#2f5ea1]" />
                        <span>Cambiar Estado</span>
                      </button>

                      {isCurrentlySelected && (
                        <span className="text-[10px] font-black px-2 py-0.5 bg-[#ffd100] text-[#6f5a00] rounded uppercase tracking-wider">
                          Expediente Activo en Diagnóstico
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-black text-[#1f1b10] flex items-center gap-2">
                        <User className="w-4 h-4 text-[#2f5ea1]" />
                        {req.client?.fullName || (req as any).clientName || 'Cliente ColorLink'}
                      </h3>
                      <p className="text-xs text-[#7f765f] flex items-center gap-1.5 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#725c00]" />
                        <span>{req.address || 'Dirección registrada'} • <strong>{req.city || 'Colombia'}</strong></span>
                      </p>
                    </div>

                    {/* Metadata strip */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4d4632]">
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#725c00]" />
                        <strong>Superficie:</strong> {req.surfaceType} ({req.areaM2} m²)
                      </span>
                      <span>•</span>
                      <span><strong>Condición:</strong> {req.condition}</span>
                      <span>•</span>
                      <span><strong>Ambiente:</strong> {req.environment === 'interior' ? 'Interior' : 'Exterior'}</span>
                      {req.colorFamily && (
                        <>
                          <span>•</span>
                          <span className="text-[#2f5ea1] font-semibold">
                            Tono: {req.colorFamily}
                          </span>
                        </>
                      )}
                    </div>

                    {req.additionalDetails && (
                      <p className="text-xs text-[#7f765f] italic line-clamp-1 bg-[#fcf3e0]/60 p-2 rounded-lg border border-[#ebe2cf]/60">
                        "{req.additionalDetails}"
                      </p>
                    )}
                  </div>

                  {/* Right Column: Pricing & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#ebe2cf]">
                    {req.quotation ? (
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] text-[#7f765f] font-bold uppercase block">
                          Cotización Estimada
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#2f5ea1] font-mono">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            maximumFractionDigits: 0,
                          }).format(req.quotation.totalCOP)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] text-[#7f765f] font-bold uppercase block">
                          Estimación Pintuco
                        </span>
                        <span className="text-xs font-bold text-[#725c00]">
                          Pendiente de Diagnóstico
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setInspectingRequest(req)}
                        className="p-2.5 rounded-xl bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] transition-colors text-xs font-bold flex items-center justify-center cursor-pointer"
                        title="Ver detalles completos del cliente y expediente"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectRequestForDiagnosis(req);
                          onShowToast(`Expediente ${req.id} cargado en Diagnóstico & Evaluación IA`);
                        }}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] transition-all text-xs font-black flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Evaluar en Diagnóstico IA</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Inspect Request Detail Modal */}
      {inspectingRequest && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd100] text-[#6f5a00] flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1f1b10]">
                    Expediente {inspectingRequest.id}
                  </h3>
                  <p className="text-xs text-[#7f765f]">
                    {inspectingRequest.client?.fullName || (inspectingRequest as any).clientName || 'Cliente ColorLink'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRequest(null)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Contact Info Box */}
              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] space-y-2">
                <span className="text-[10px] font-bold text-[#7f765f] uppercase tracking-wider block">
                  Información de Contacto
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#1f1b10]">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-[#2f5ea1]" />
                    <span>
                      <strong>{inspectingRequest.client?.documentType || 'Documento'}:</strong>{' '}
                      {inspectingRequest.client?.documentNumber || 'No especificado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#2f5ea1]" />
                    <span>{inspectingRequest.client?.phone || (inspectingRequest as any).clientPhone || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Mail className="w-4 h-4 text-[#2f5ea1]" />
                    <span>{inspectingRequest.client?.email || (inspectingRequest as any).clientEmail || 'Sin correo registrado'}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="w-4 h-4 text-[#725c00]" />
                    <span>{inspectingRequest.address || 'Dirección registrada'}, {inspectingRequest.city}</span>
                  </div>
                </div>
              </div>

              {/* Technical Scope Box */}
              <div className="p-4 rounded-xl bg-white border border-[#ebe2cf] space-y-2">
                <span className="text-[10px] font-bold text-[#7f765f] uppercase tracking-wider block">
                  Parámetros Técnicos
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[#7f765f] block">Superficie:</span>
                    <strong className="text-sm">{inspectingRequest.surfaceType}</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Área a Tratar:</span>
                    <strong className="text-sm text-[#2f5ea1]">{inspectingRequest.areaM2} m²</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Condición Actual:</span>
                    <strong>{inspectingRequest.condition}</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Ambiente:</span>
                    <strong>{inspectingRequest.environment}</strong>
                  </div>
                </div>

                {inspectingRequest.additionalDetails && (
                  <div className="pt-2 border-t border-[#ebe2cf]">
                    <span className="text-[#7f765f] block mb-1">Notas del Cliente:</span>
                    <p className="italic text-[#4d4632]">{inspectingRequest.additionalDetails}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setInspectingRequest(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusModalRequest(inspectingRequest);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#f0e7d5] hover:bg-[#ebe2cf] text-[#0d4788] text-xs font-black transition-colors flex items-center justify-center gap-1.5 border border-[#d1c6ab] cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#2f5ea1]" />
                <span>Cambiar Estado ({inspectingRequest.status})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectRequestForDiagnosis(inspectingRequest);
                  setInspectingRequest(null);
                  onShowToast(`Expediente ${inspectingRequest.id} abierto para evaluación`);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#ffd100] text-[#0d4788] text-xs font-black hover:bg-[#ffc800] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                <span>Evaluar en Diagnóstico</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Status Changer Modal for Requests List */}
      <AdvisorStatusModal
        isOpen={!!statusModalRequest}
        onClose={() => setStatusModalRequest(null)}
        request={statusModalRequest}
        onSaveStatus={handleSaveStatus}
      />
    </div>
  );
};
