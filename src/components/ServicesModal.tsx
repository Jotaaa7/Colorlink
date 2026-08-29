import React from 'react';
import { X, Layers, Sparkles, Paintbrush, ShieldCheck, Truck, Droplet } from 'lucide-react';

interface ServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (serviceName: string) => void;
}

export const ServicesModal: React.FC<ServicesModalProps> = ({
  isOpen,
  onClose,
  onSelectService,
}) => {
  if (!isOpen) return null;

  const services = [
    {
      title: 'Ecosistema ColorLink Pro',
      desc: 'Automatización integral para proyectos comerciales e industriales: diagnóstico con IA, formulación de producto, inventario en planta y cotización instantánea.',
      icon: Sparkles,
      tag: 'IA Integrada',
      badgeColor: 'bg-[#ffd100] text-[#1f1b10]',
    },
    {
      title: 'Colorimetría Digital y Espectrofotometría',
      desc: 'Formulación y lectura exacta de cualquier color corporativo o muestra física con espectrofotómetro industrial (Delta E < 0.4 garantizado).',
      icon: Droplet,
      tag: 'Precisión 100%',
      badgeColor: 'bg-[#8cb7ff] text-[#0d4788]',
    },
    {
      title: 'Asesoría y Diagnóstico Técnico en Obra',
      desc: 'Acompañamiento en sitio por ingenieros de recubrimiento Pintuco para pruebas de humedad de sustrato, perfil de rugosidad y ensayos de adherencia ASTM.',
      icon: Paintbrush,
      tag: 'En Sitio',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: 'Garantía Extendida Directa de Fábrica',
      desc: 'Certificación oficial de durabilidad hasta por 10 años en sistemas arquitectónicos (Koraza) e industriales (Epóxicos y Uretanos) con póliza de respaldo.',
      icon: ShieldCheck,
      tag: 'ISO 9001',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Logística y Despacho Express en 24 Horas',
      desc: 'Despacho prioritario desde nuestras plantas en Rionegro, Bogotá, Cali y Barranquilla directamente a obra con seguimiento en tiempo real.',
      icon: Truck,
      tag: 'Nacional',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffd100] flex items-center justify-center text-[#6f5a00]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1f1b10]">
                Servicios del Ecosistema Pintuco
              </h3>
              <p className="text-xs text-[#7f765f]">
                Soluciones integrales de recubrimiento y soporte técnico especializado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#4d4632] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-6 space-y-4">
          {services.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                onClick={() => {
                  onSelectService(srv.title);
                  onClose();
                }}
                className="p-4 sm:p-5 rounded-2xl border border-[#ebe2cf] hover:border-[#725c00] hover:bg-[#fff8f0] transition-all cursor-pointer group flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#f6eddb] group-hover:bg-[#ffd100] text-[#725c00] group-hover:text-[#1f1b10] flex items-center justify-center shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-base font-bold text-[#1f1b10] group-hover:text-[#725c00] transition-colors">
                      {srv.title}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${srv.badgeColor}`}>
                      {srv.tag}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4d4632] leading-relaxed">
                    {srv.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-[#ebe2cf] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#725c00] text-white font-bold text-sm hover:bg-[#564500] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
