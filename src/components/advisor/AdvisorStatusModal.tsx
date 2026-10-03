import React, { useState, useEffect } from 'react';
import { ProjectRequest } from '../../types';
import { getProjectPhaseLockInfo } from '../../lib/projectStatusRules';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Warehouse,
  Factory,
  ShieldCheck,
  Truck,
  FileText,
  AlertCircle,
  X,
  ArrowRight,
  Send,
  Save,
  Lock,
  Check,
} from 'lucide-react';

export type ValidProjectStatus =
  | 'Registrada'
  | 'Analizada por IA'
  | 'Cotizada'
  | 'Inventario Asignado'
  | 'En Producción'
  | 'Aprobada QA'
  | 'Completada';

interface StatusOption {
  status: ValidProjectStatus;
  title: string;
  description: string;
  phase: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  badgeBg: string;
  badgeText: string;
}

interface AdvisorStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProjectRequest | null;
  onSaveStatus: (newStatus: ValidProjectStatus, advisorNote?: string, trackingNumber?: string) => void;
}

export const AdvisorStatusModal: React.FC<AdvisorStatusModalProps> = ({
  isOpen,
  onClose,
  request,
  onSaveStatus,
}) => {
  const currentStatus = (request?.status as ValidProjectStatus) || 'Cotizada';
  const [selectedStatus, setSelectedStatus] = useState<ValidProjectStatus>(currentStatus);
  const [advisorNote, setAdvisorNote] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(request?.trackingNumber || '');

  useEffect(() => {
    if (request?.status) {
      setSelectedStatus(request.status as ValidProjectStatus);
      setAdvisorNote(request.technicalReviewNotes || '');
      setTrackingNumber(request.trackingNumber || '');
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const statusOptions: StatusOption[] = [
    {
      status: 'Registrada',
      title: '1. Registrada / Nueva',
      description: 'Solicitud ingresada por el cliente. Pendiente de evaluación técnica.',
      phase: 'Fase 1',
      icon: Clock,
      colorClass: 'text-[#725c00] border-[#d1c6ab]',
      badgeBg: 'bg-[#f6eddb]',
      badgeText: 'text-[#725c00]',
    },
    {
      status: 'Analizada por IA',
      title: '2. Analizada por IA',
      description: 'Visión artificial de sustrato y cálculo de manos procesados por el motor IA.',
      phase: 'Fase 2',
      icon: Sparkles,
      colorClass: 'text-[#2f5ea1] border-[#2f5ea1]',
      badgeBg: 'bg-[#d6e3ff]',
      badgeText: 'text-[#001b3d]',
    },
    {
      status: 'Cotizada',
      title: '3. Cotizada (Propuesta Vigente)',
      description: 'Cotización comercial oficial generada con precios netos, IVA y formulación.',
      phase: 'Fase 3',
      icon: FileText,
      colorClass: 'text-[#725c00] border-[#ffd100]',
      badgeBg: 'bg-[#ffe07f]',
      badgeText: 'text-[#231b00]',
    },
    {
      status: 'Inventario Asignado',
      title: '4. Inventario Asignado / Stock Bloqueado',
      description: 'Lote bloqueado en SAP R/3 (CEDI Funza, Rionegro o Bogotá). Reserva preventiva activa.',
      phase: 'Fase 4',
      icon: Warehouse,
      colorClass: 'text-[#137333] border-[#137333]',
      badgeBg: 'bg-[#e6f4ea]',
      badgeText: 'text-[#137333]',
    },
    {
      status: 'En Producción',
      title: '5. En Producción / Tinturado Planta',
      description: 'Fórmula en dispensador tintométrico Giotto y envasado en línea de producción.',
      phase: 'Fase 4',
      icon: Factory,
      colorClass: 'text-[#0d4788] border-[#0d4788]',
      badgeBg: 'bg-[#e1edff]',
      badgeText: 'text-[#0d4788]',
    },
    {
      status: 'Aprobada QA',
      title: '6. Aprobada QA / Calidad Certificada',
      description: 'Ensayos de viscosidad, espesor y Delta E < 0.5 aprobados con precinto de despacho.',
      phase: 'Fase 4',
      icon: ShieldCheck,
      colorClass: 'text-[#047857] border-[#047857]',
      badgeBg: 'bg-[#ecfdf5]',
      badgeText: 'text-[#047857]',
    },
    {
      status: 'Completada',
      title: '7. Completada / Entregado en Obra',
      description: 'Pedido recibido por el cliente a conformidad. Garantía oficial de 5 años activada.',
      phase: 'Fase 5',
      icon: Truck,
      colorClass: 'text-[#137333] border-[#137333]',
      badgeBg: 'bg-[#dcfce7]',
      badgeText: 'text-[#166534]',
    },
  ];

  const handleConfirm = () => {
    onSaveStatus(selectedStatus, advisorNote, trackingNumber);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#ebe2cf] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#ebe2cf] bg-[#fff8f0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffd100] text-[#6f5a00] flex items-center justify-center font-bold shadow-xs">
              <CheckCircle2 className="w-6 h-6 text-[#0d4788]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[#1f1b10]">
                  Cambiar Estado del Proyecto
                </h3>
                <span className="font-mono text-xs font-bold bg-[#f0e7d5] px-2 py-0.5 rounded border border-[#d1c6ab]/50">
                  {request.id}
                </span>
              </div>
              <p className="text-xs text-[#7f765f] mt-0.5">
                Cliente: <strong className="text-[#1f1b10]">{request.client.fullName}</strong> • Estado actual:{' '}
                <span className="font-bold text-[#725c00]">{request.status}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Scrollable list of statuses */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="text-xs text-[#4d4632] leading-relaxed">
            Selecciona la nueva etapa del flujo operativo. El cambio se reflejará de inmediato en el
            portal del cliente, en el estado del proyecto y en el historial del expediente.
          </div>

          <div className="space-y-2.5">
            {statusOptions.map((opt) => {
              const isSelected = selectedStatus === opt.status;
              const isCurrent = request.status === opt.status;
              const Icon = opt.icon;

              return (
                <div
                  key={opt.status}
                  onClick={() => setSelectedStatus(opt.status)}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 relative ${
                    isSelected
                      ? 'border-[#725c00] bg-[#fff9ea] shadow-sm'
                      : 'border-[#ebe2cf] hover:border-[#d1c6ab] bg-white hover:bg-[#fffdfa]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-[#ffd100] text-[#0d4788]' : 'bg-[#f6eddb] text-[#7f765f]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1f1b10]">
                          {opt.title}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ebe2cf] text-[#4d4632]">
                            Actual
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${opt.badgeBg} ${opt.badgeText}`}>
                        {opt.phase}
                      </span>
                    </div>

                    <p className="text-xs text-[#4d4632] mt-0.5 leading-relaxed">
                      {opt.description}
                    </p>

                    {/* Policy on adding products */}
                    {(() => {
                      const optLockInfo = getProjectPhaseLockInfo(opt.status);
                      return (
                        <div className="flex items-center gap-2 mt-2">
                          {optLockInfo.canAddProducts ? (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Permite agregar / modificar productos</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-700" />
                              <span>Bloquea agregar productos ({optLockInfo.badgeLabel})</span>
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 transition-colors ${
                      isSelected ? 'border-[#725c00] bg-[#725c00]' : 'border-[#d1c6ab] bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Technical Advisor Note for this change */}
          <div className="pt-2 border-t border-[#ebe2cf] space-y-2">
            <label className="text-xs font-bold text-[#1f1b10] flex items-center justify-between">
              <span>Nota o Justificación Técnica del Asesor:</span>
              <span className="text-[11px] text-[#7f765f] font-normal">Visible en expediente</span>
            </label>
            <textarea
              value={advisorNote}
              onChange={(e) => setAdvisorNote(e.target.value)}
              placeholder="Ej: Lote verificado en CD Calle 80. Cliente autorizó cotización por vía telefónica. Se procede a coordinar tinturado..."
              className="w-full p-3 rounded-xl bg-[#f6eddb]/50 border border-[#d1c6ab] text-xs text-[#1f1b10] placeholder:text-[#7f765f] focus:outline-none focus:border-[#725c00] resize-none"
              rows={2}
            />
          </div>

          {/* Optional Dispatch Tracking Number if status is QA or Completada */}
          {(selectedStatus === 'Aprobada QA' || selectedStatus === 'Completada' || selectedStatus === 'Inventario Asignado') && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf]">
              <label className="text-xs font-bold text-[#1f1b10] flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-[#2f5ea1]" />
                <span>Número de Guía / Remisión SAP (Opcional):</span>
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ej. GUI-PT-89240-BOG (Servientrega / Coordinadora)"
                className="w-full p-2.5 rounded-lg bg-white border border-[#d1c6ab] text-xs font-mono text-[#1f1b10] focus:outline-none focus:border-[#725c00]"
              />
            </div>
          )}

          {/* Operational lock warning when selecting a locked status */}
          {(() => {
            const selLock = getProjectPhaseLockInfo(selectedStatus);
            if (!selLock.canAddProducts) {
              return (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">
                      Control operacional: Formulación técnica bloqueada ({selLock.badgeLabel})
                    </strong>
                    <span>
                      Al pasar a "{selectedStatus}", se deshabilitará la opción de agregar productos a este expediente para salvaguardar la reserva de inventario y el ciclo de mezcla en planta.
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-[#ebe2cf] bg-[#fcf3e0]/60 flex flex-col sm:flex-row gap-2 justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2.5 rounded-xl bg-[#ffd100] text-[#0d4788] hover:bg-[#ffc800] text-xs font-black shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            id="btn-confirm-save-project-status"
          >
            <Save className="w-4 h-4" />
            <span>Guardar y Actualizar a "{selectedStatus}"</span>
          </button>
        </div>
      </div>
    </div>
  );
};
