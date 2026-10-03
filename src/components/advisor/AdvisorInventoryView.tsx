import React, { useState } from 'react';
import { ProjectRequest } from '../../types';
import {
  Warehouse,
  Package,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Lock,
  Search,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
  X,
  FileCheck,
} from 'lucide-react';

interface AdvisorInventoryViewProps {
  request: ProjectRequest | null;
  onNavigateToFullInventory?: () => void;
  onShowToast: (msg: string) => void;
  onUpdateProject?: (updatedRequest: ProjectRequest) => void;
}

interface PlantItem {
  plantName: string;
  city: string;
  type: 'Planta Principal' | 'CEDI Central' | 'CEDI Regional';
  availableGallons: number;
  batchCode: string;
  leadTimeHours: number;
  status: 'Inmediato' | 'En Tránsito' | 'Producción Requerida';
  activeBatches: number;
}

export const AdvisorInventoryView: React.FC<AdvisorInventoryViewProps> = ({
  request,
  onNavigateToFullInventory,
  onShowToast,
  onUpdateProject,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [selectedPlantForReserve, setSelectedPlantForReserve] = useState<PlantItem | null>(null);

  const plants: PlantItem[] = [
    {
      plantName: 'Planta Principal Rionegro (Antioquia)',
      city: 'Rionegro / Medellín',
      type: 'Planta Principal',
      availableGallons: 5200,
      batchCode: 'LOTE-RN-2608-A4',
      leadTimeHours: 24,
      status: 'Inmediato',
      activeBatches: 18,
    },
    {
      plantName: 'CEDI Funza / Occidente Bogotá',
      city: 'Funza / Mosquera',
      type: 'CEDI Central',
      availableGallons: 2840,
      batchCode: 'LOTE-FZ-2608-F1',
      leadTimeHours: 6,
      status: 'Inmediato',
      activeBatches: 12,
    },
    {
      plantName: 'Centro de Distribución Central Calle 80',
      city: 'Bogotá D.C.',
      type: 'CEDI Central',
      availableGallons: 1850,
      batchCode: 'LOTE-BG-2608-C9',
      leadTimeHours: 4,
      status: 'Inmediato',
      activeBatches: 8,
    },
    {
      plantName: 'Centro Logístico Occidente (Yumbo)',
      city: 'Cali / Yumbo',
      type: 'CEDI Regional',
      availableGallons: 940,
      batchCode: 'LOTE-YB-2608-D2',
      leadTimeHours: 48,
      status: 'Inmediato',
      activeBatches: 5,
    },
    {
      plantName: 'Planta Caribe (Barranquilla)',
      city: 'Barranquilla / Soledad',
      type: 'Planta Principal',
      availableGallons: 710,
      batchCode: 'LOTE-BQ-2608-B5',
      leadTimeHours: 48,
      status: 'Inmediato',
      activeBatches: 4,
    },
  ];

  const filteredPlants = plants.filter(
    (p) =>
      p.plantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.batchCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSyncSap = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      onShowToast('Existencias y lotes sincronizados en tiempo real con SAP S/4HANA');
    }, 800);
  };

  const handleConfirmLock = () => {
    if (selectedPlantForReserve) {
      if (request && onUpdateProject) {
        onUpdateProject({
          ...request,
          status: 'Inventario Asignado',
        });
      }
      onShowToast(`Lote ${selectedPlantForReserve.batchCode} bloqueado preventivamente por 48h en SAP`);
      setShowReserveModal(false);
      setSelectedPlantForReserve(null);
    }
  };

  const totalGallonsAvailable = plants.reduce((acc, p) => acc + p.availableGallons, 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#ebe2cf] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#ffd100] text-[#6f5a00] text-xs font-black uppercase tracking-wider">
              Control de Existencias
            </span>
            <span className="text-xs text-[#7f765f] font-semibold">
              5 sedes activas en red nacional
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1f1b10] mt-1">
            Disponibilidad de Inventario Multisede & Bloqueo SAP
          </h2>
          <p className="text-xs sm:text-sm text-[#4d4632] mt-0.5">
            Verifica galones disponibles por planta, códigos de lote y asegura inventario preventivo para cotizaciones.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleSyncSap}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] text-xs font-bold transition-colors flex items-center gap-1.5 border border-[#d1c6ab] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 text-[#725c00] ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Actualizar SAP'}</span>
          </button>

          {onNavigateToFullInventory && (
            <button
              type="button"
              onClick={onNavigateToFullInventory}
              className="px-4 py-2.5 rounded-xl bg-[#2f5ea1] hover:bg-[#264b82] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <span>Gestión Avanzada CEDI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#ebe2cf] shadow-2xs">
          <div className="flex items-center justify-between text-[#7f765f] text-xs mb-2">
            <span className="font-bold">Total Galones en Red</span>
            <Warehouse className="w-4 h-4 text-[#725c00]" />
          </div>
          <div className="text-2xl font-black text-[#1f1b10] font-mono">
            {totalGallonsAvailable.toLocaleString('es-CO')} Gal
          </div>
          <span className="text-[11px] text-[#137333] font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Cobertura Nacional
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#ebe2cf] shadow-2xs">
          <div className="flex items-center justify-between text-[#7f765f] text-xs mb-2">
            <span className="font-bold">CEDI Bogotá & Funza</span>
            <Building2 className="w-4 h-4 text-[#2f5ea1]" />
          </div>
          <div className="text-2xl font-black text-[#2f5ea1] font-mono">
            4,690 Gal
          </div>
          <span className="text-[11px] text-[#7f765f] font-medium mt-1">
            Despacho prioritario 4 a 6 horas
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#ebe2cf] shadow-2xs">
          <div className="flex items-center justify-between text-[#7f765f] text-xs mb-2">
            <span className="font-bold">Planta Central Rionegro</span>
            <Package className="w-4 h-4 text-[#725c00]" />
          </div>
          <div className="text-2xl font-black text-[#1f1b10] font-mono">
            5,200 Gal
          </div>
          <span className="text-[11px] text-[#725c00] font-medium mt-1">
            Línea continua de tinturado
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#ebe2cf] shadow-2xs">
          <div className="flex items-center justify-between text-[#7f765f] text-xs mb-2">
            <span className="font-bold">Lotes Certificados QA</span>
            <ShieldCheck className="w-4 h-4 text-[#137333]" />
          </div>
          <div className="text-2xl font-black text-[#137333] font-mono">
            47 Lotes
          </div>
          <span className="text-[11px] text-[#7f765f] font-medium mt-1">
            Viscosidad Krebs & Delta E verificados
          </span>
        </div>
      </div>

      {/* Plants Table */}
      <div className="bg-white rounded-2xl border border-[#ebe2cf] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#ebe2cf] flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f765f]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar planta, ciudad o lote..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#f6eddb]/50 border border-[#d1c6ab]/60 text-xs text-[#1f1b10] focus:outline-none"
            />
          </div>
          <div className="text-xs text-[#7f765f] font-semibold self-end sm:self-auto">
            Mostrando {filteredPlants.length} plantas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#fcf3e0] text-[#7f765f] uppercase tracking-wider font-bold border-b border-[#ebe2cf]">
              <tr>
                <th className="py-3 px-4">Planta / Sede</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4">Stock Disponible</th>
                <th className="py-3 px-4">Lote Certificado</th>
                <th className="py-3 px-4">Lead Time</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción SAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe2cf]">
              {filteredPlants.map((plant) => (
                <tr key={plant.plantName} className="hover:bg-[#fffbf5] transition-colors">
                  <td className="py-3.5 px-4 font-bold text-[#1f1b10]">
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-[#725c00] shrink-0" />
                      <span>{plant.plantName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#4d4632]">{plant.city}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#1f1b10]">
                    <span className="text-sm">{plant.availableGallons.toLocaleString('es-CO')}</span> Gal
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-[#2f5ea1] font-bold">
                    {plant.batchCode}
                  </td>
                  <td className="py-3.5 px-4 text-[#4d4632]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#7f765f]" />
                      {plant.leadTimeHours} horas
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#137333] text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
                      {plant.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlantForReserve(plant);
                        setShowReserveModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] font-bold text-xs transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Bloquear 48h</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lock Reservation Modal */}
      {showReserveModal && selectedPlantForReserve && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf]">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd100] text-[#6f5a00] flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1f1b10]">Bloqueo Preventivo SAP</h3>
                  <p className="text-xs text-[#7f765f]">Reserva de Lote por 48 Horas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReserveModal(false);
                  setSelectedPlantForReserve(null);
                }}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#4d4632] mb-4 leading-relaxed">
              Estás a punto de emitir una instrucción de reserva preventiva temporal en el sistema 
              <strong> SAP R/3 / S/4HANA</strong> para el proyecto activo de <strong>{request?.client.fullName || 'Cliente Actual'}</strong>.
            </p>

            <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] space-y-2 text-xs mb-5">
              <div className="flex justify-between">
                <span className="text-[#7f765f]">Sede Logística:</span>
                <strong>{selectedPlantForReserve.plantName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7f765f]">Código de Lote:</span>
                <strong className="font-mono text-[#2f5ea1]">{selectedPlantForReserve.batchCode}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7f765f]">Vigencia del Bloqueo:</span>
                <strong>48 Horas calendario</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowReserveModal(false);
                  setSelectedPlantForReserve(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmLock}
                className="flex-1 py-2.5 rounded-xl bg-[#2f5ea1] text-white text-xs font-bold hover:bg-[#264b82] transition-colors"
              >
                Confirmar Bloqueo SAP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
