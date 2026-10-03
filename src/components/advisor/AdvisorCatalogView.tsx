import React, { useState } from 'react';
import { PINTUCO_CATALOG, PintucoCatalogItem } from '../../data/pintucoProducts';
import { getProjectPhaseLockInfo } from '../../lib/projectStatusRules';
import {
  Search,
  BookOpen,
  Plus,
  FileText,
  CheckCircle2,
  Layers,
  Sparkles,
  Droplets,
  Clock,
  Shield,
  X,
  ExternalLink,
  ChevronRight,
  Lock,
} from 'lucide-react';

interface AdvisorCatalogViewProps {
  onAddProductToQuote: (product: PintucoCatalogItem) => void;
  onShowToast: (msg: string) => void;
  activeProjectStatus?: string;
  activeProjectCode?: string;
}

export const AdvisorCatalogView: React.FC<AdvisorCatalogViewProps> = ({
  onAddProductToQuote,
  onShowToast,
  activeProjectStatus,
  activeProjectCode,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedProductDetails, setSelectedProductDetails] = useState<PintucoCatalogItem | null>(null);

  const lockInfo = getProjectPhaseLockInfo(activeProjectStatus);

  const categories = [
    'Todas',
    'Arquitectónica',
    'Construcción',
    'Metal',
    'Madera',
    'Industrial y Alto Desempeño',
  ];

  const filteredProducts = PINTUCO_CATALOG.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'Todas' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-[#ebe2cf] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#ffd100] text-[#6f5a00] text-xs font-black uppercase tracking-wider">
              Catálogo Oficial
            </span>
            <span className="text-xs text-[#7f765f] font-semibold">
              {filteredProducts.length} productos técnicos Pintuco
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1f1b10] mt-1">
            Catálogo Técnico y Especificaciones de Rendimiento
          </h2>
          <p className="text-xs sm:text-sm text-[#4d4632] mt-0.5">
            Consulta fichas técnicas certificadas, rendimientos teóricos y agrega productos directamente a la cotización activa.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#fcf3e0] px-4 py-3 rounded-xl border border-[#ebe2cf] shrink-0">
          <BookOpen className="w-5 h-5 text-[#2f5ea1] shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-[#1f1b10]">Fichas Técnicas ISO 9001</p>
            <p className="text-[#7f765f]">Tiempos de curado y dilución de fábrica</p>
          </div>
        </div>
      </div>

      {/* Phase Lock Informative Banner for Advisors */}
      {!lockInfo.canAddProducts && (
        <div className="bg-[#fcf3e0] border border-[#d1c6ab] rounded-2xl p-4 flex items-start gap-3.5 text-xs text-[#4d4632] animate-in fade-in">
          <div className="w-9 h-9 rounded-xl bg-[#ffd100]/40 flex items-center justify-center shrink-0 mt-0.5 text-[#725c00]">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm font-bold text-[#1f1b10]">
                Catálogo en Modo Solo Consulta
              </strong>
              <span className="px-2 py-0.5 rounded-full bg-[#f6eddb] text-[#725c00] text-[11px] font-bold border border-[#d1c6ab]/50">
                {lockInfo.badgeLabel}
              </span>
            </div>
            <p className="mt-1 leading-relaxed">
              El proyecto activo <strong className="font-mono text-[#2f5ea1]">{activeProjectCode || 'en evaluación'}</strong> se encuentra en estado <strong className="text-[#1f1b10]">"{activeProjectStatus}"</strong>. {lockInfo.reason}
            </p>
            <p className="mt-1 text-[11px] text-[#7f765f]">
              Para poder formular y añadir productos a esta cotización, cambia el estado del proyecto a <em>"Cotizada"</em> o <em>"Registrada"</em> en la barra de comandos o en el gestor de estados.
            </p>
          </div>
        </div>
      )}

      {/* Search and Category Filters */}
      <div className="bg-white rounded-2xl p-4 border border-[#ebe2cf] shadow-xs flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f765f]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, SKU (ej. PT-VX-1010) o aplicación..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f6eddb]/50 border border-[#d1c6ab]/60 text-xs sm:text-sm text-[#1f1b10] placeholder:text-[#7f765f] focus:outline-none focus:border-[#725c00]"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#ffd100] text-[#6f5a00] shadow-xs'
                  : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredProducts.map((prod) => (
          <div
            key={prod.sku}
            className="bg-white rounded-2xl border border-[#ebe2cf] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Product Card Top: Image + Category Badge */}
              <div className="relative h-44 bg-[#1f1b10] overflow-hidden group">
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-white/95 text-[#1f1b10] text-[10px] font-black uppercase tracking-wider backdrop-blur-xs shadow-xs">
                    {prod.category}
                  </span>
                  {prod.hasColors && (
                    <span className="px-2 py-0.5 rounded-md bg-[#ffd100] text-[#6f5a00] text-[10px] font-bold">
                      Tinturable
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white">
                  <span className="font-mono text-xs font-bold text-[#ffe07f]">
                    SKU: {prod.sku}
                  </span>
                  <span className="text-base font-black font-mono">
                    {formatCOP(prod.priceCOP)} <span className="text-[10px] font-normal text-white/80">/ gal</span>
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-5 space-y-3">
                <h3 className="text-base font-black text-[#1f1b10] leading-tight">
                  {prod.name}
                </h3>

                <p className="text-xs text-[#4d4632] line-clamp-2 leading-relaxed">
                  {prod.description}
                </p>

                {/* Technical Specs Grid */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] text-xs">
                  <div>
                    <span className="text-[10px] text-[#7f765f] uppercase block font-semibold">
                      Rendimiento
                    </span>
                    <strong className="text-xs text-[#1f1b10]">
                      {prod.coverageM2PerGal} m² / galón
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7f765f] uppercase block font-semibold">
                      Manos Sugeridas
                    </span>
                    <strong className="text-xs text-[#1f1b10]">
                      {prod.recommendedCoats} manos
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7f765f] uppercase block font-semibold">
                      Secado al Tacto
                    </span>
                    <span className="text-xs text-[#4d4632] font-medium">
                      {prod.dryingTimeTouch}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7f765f] uppercase block font-semibold">
                      Repinte
                    </span>
                    <span className="text-xs text-[#4d4632] font-medium">
                      {prod.dryingTimeRecoat}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 text-[11px] text-[#7f765f]">
                  <span className="px-2 py-0.5 rounded bg-[#f6eddb] font-medium">
                    Acabado: {prod.sheen}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#f6eddb] font-medium">
                    VOC: {prod.voc}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-5 pt-0 flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductDetails(prod)}
                className="flex-1 py-2.5 rounded-xl border border-[#d1c6ab] hover:bg-[#f6eddb] text-[#4d4632] hover:text-[#1f1b10] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Ver Ficha</span>
              </button>

              {lockInfo.canAddProducts ? (
                <button
                  type="button"
                  onClick={() => {
                    onAddProductToQuote(prod);
                    onShowToast(`"${prod.name}" añadido a la cotización activa`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] text-xs font-black transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir a Cotización</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-2.5 rounded-xl bg-[#f0e7d5] text-[#7f765f] text-xs font-bold flex items-center justify-center gap-1.5 border border-[#d1c6ab]/60 cursor-not-allowed opacity-80"
                  title={`Fórmula cerrada: ${lockInfo.shortWarning}`}
                >
                  <Lock className="w-3.5 h-3.5 text-[#7f765f]" />
                  <span>Bloqueado ({activeProjectStatus})</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Technical Spec Sheet Modal */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd100] text-[#6f5a00] flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1f1b10]">
                    Ficha Técnica Oficial Pintuco
                  </h3>
                  <p className="text-xs text-[#7f765f] font-mono">
                    SKU: {selectedProductDetails.sku}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductDetails(null)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-lg font-black text-[#1f1b10] mb-1">
                  {selectedProductDetails.name}
                </h4>
                <p className="text-[#4d4632] leading-relaxed">
                  {selectedProductDetails.description}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] space-y-3">
                <span className="text-[10px] font-bold text-[#7f765f] uppercase tracking-wider block">
                  Propiedades Físicas & Desempeño
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#7f765f] block">Rendimiento Teórico:</span>
                    <strong className="text-sm text-[#2f5ea1]">{selectedProductDetails.coverageM2PerGal} m²/gal</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Precio Base Oficial:</span>
                    <strong className="text-sm font-mono">{formatCOP(selectedProductDetails.priceCOP)}</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Sólidos por Volumen:</span>
                    <strong>{selectedProductDetails.solidsByVolume}%</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Emisiones VOC:</span>
                    <strong>{selectedProductDetails.voc}</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Secado al Tacto (25°C):</span>
                    <strong>{selectedProductDetails.dryingTimeTouch}</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Tiempo para Repinte:</span>
                    <strong>{selectedProductDetails.dryingTimeRecoat}</strong>
                  </div>
                </div>
              </div>

              {/* Application Rules */}
              <div className="p-4 rounded-xl bg-white border border-[#ebe2cf] space-y-2">
                <span className="text-[10px] font-bold text-[#7f765f] uppercase tracking-wider block">
                  Instrucciones de Aplicación & Dilución
                </span>
                <ul className="list-disc pl-4 space-y-1 text-[#4d4632]">
                  <li>Superficie limpia, seca, libre de polvo, grasa y pintura desprendida.</li>
                  <li>Dilución máxima recomendada: 10% agua potable para primera mano, 5% segunda mano.</li>
                  <li>Homogeneizar durante 3 minutos con espátula limpia antes de aplicar.</li>
                  <li>Temperatura óptima de aplicación: Entre 10°C y 35°C, humedad relativa menor al 85%.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSelectedProductDetails(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb] cursor-pointer"
              >
                Cerrar
              </button>
              {lockInfo.canAddProducts ? (
                <button
                  type="button"
                  onClick={() => {
                    onAddProductToQuote(selectedProductDetails);
                    setSelectedProductDetails(null);
                    onShowToast(`"${selectedProductDetails.name}" agregado a la cotización`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#ffd100] text-[#0d4788] text-xs font-black hover:bg-[#ffc800] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir a Cotización</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  className="flex-1 py-2.5 rounded-xl bg-[#f0e7d5] text-[#7f765f] text-xs font-bold flex items-center justify-center gap-2 border border-[#d1c6ab] cursor-not-allowed opacity-80"
                  title={lockInfo.reason}
                >
                  <Lock className="w-4 h-4 text-[#7f765f]" />
                  <span>Añadir Bloqueado en fase "{activeProjectStatus}"</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
