import React, { useState } from 'react';
import { PINTUCO_CATALOG, PintucoCatalogItem } from '../../data/pintucoProducts';
import {
  Search,
  Filter,
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  X,
  Plus,
} from 'lucide-react';

interface AdvisorTechnicalCatalogProps {
  onAddProductToQuote?: (product: PintucoCatalogItem) => void;
}

export const AdvisorTechnicalCatalog: React.FC<AdvisorTechnicalCatalogProps> = ({
  onAddProductToQuote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProductModal, setSelectedProductModal] = useState<PintucoCatalogItem | null>(null);

  const categories = [
    { id: 'all', label: 'Todos los Productos' },
    { id: 'Arquitectónica', label: 'Arquitectónica' },
    { id: 'Construcción', label: 'Construcción & Masillas' },
    { id: 'Metal', label: 'Metal & Anticorrosivos' },
    { id: 'Madera', label: 'Madera & Barnices' },
    { id: 'Industrial y Alto Desempeño', label: 'Industrial & Epóxicos' },
  ];

  const filteredProducts = PINTUCO_CATALOG.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;

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
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1f1b10] tracking-tight">
            Catálogo Técnico Oficial Pintuco®
          </h1>
          <p className="text-xs sm:text-sm text-[#7f765f] mt-1">
            Fichas técnicas, rendimientos por m², tiempos de secado y normatividad NTC / ASTM
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 bg-[#e1edff] text-[#2f5ea1] rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Edición Oficial 2026
          </span>
        </div>
      </div>

      {/* Search & Categories Filter */}
      <div className="bg-white rounded-2xl p-4 border border-[#ebe2cf] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full sm:w-80 flex items-center bg-[#fcf8f2] rounded-xl px-3 py-2 border border-[#ebe2cf]">
          <Search className="w-4 h-4 text-[#7f765f] mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, nombre o uso..."
            className="w-full bg-transparent text-xs text-[#1f1b10] placeholder:text-[#7f765f] outline-none font-medium"
          />
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#ffd100] text-[#6f5a00] shadow-2xs'
                  : 'bg-[#fcf8f2] text-[#4d4632] hover:bg-[#f6eddb]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((product) => (
          <div
            key={product.sku}
            className="bg-white rounded-2xl border border-[#ebe2cf] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            {/* Top Image & Badge */}
            <div className="relative h-44 bg-[#1f1b10] overflow-hidden group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 bg-[#1f1b10]/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-md">
                SKU: {product.sku}
              </div>
              <div className="absolute top-3 right-3 bg-[#ffd100] text-[#6f5a00] text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                {product.category}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-[#1f1b10] leading-snug">
                  {product.name}
                </h3>
                <p className="text-xs text-[#7f765f] mt-1.5 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Technical Matrix Specs */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#fcf8f2] rounded-xl border border-[#ebe2cf] text-xs">
                <div>
                  <span className="text-[10px] text-[#7f765f] block">Rendimiento:</span>
                  <strong className="text-[#1f1b10] font-black">{product.coverageM2PerGal} m²/gal</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7f765f] block">Secado al tacto:</span>
                  <strong className="text-[#2f5ea1] font-bold">{product.dryingTimeTouch}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7f765f] block">Entre manos:</span>
                  <strong className="text-[#4d4632]">{product.dryingTimeRecoat}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7f765f] block">Precio Lista:</span>
                  <strong className="text-[#725c00] font-mono">{formatCOP(product.priceCOP)}</strong>
                </div>
              </div>

              {/* Surfaces tags */}
              <div className="flex flex-wrap gap-1">
                {product.recommendedSurfaces.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] bg-[#f0e7d5] text-[#4d4632] px-2 py-0.5 rounded-md font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-[#fffbf5] border-t border-[#ebe2cf] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductModal(product)}
                className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-[#f6eddb] border border-[#d1c6ab] text-xs font-bold text-[#1f1b10] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-[#2f5ea1]" />
                <span>Ver Ficha Técnica</span>
              </button>

              {onAddProductToQuote && (
                <button
                  type="button"
                  onClick={() => onAddProductToQuote(product)}
                  className="p-2 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#6f5a00] font-bold transition-all shadow-2xs cursor-pointer"
                  title="Añadir a cotización actual"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Official Datasheet Modal */}
      {selectedProductModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd100] text-[#6f5a00] flex items-center justify-center font-black">
                  P
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1f1b10]">
                    Ficha Técnica Oficial Pintuco®
                  </h3>
                  <span className="text-xs text-[#7f765f]">
                    SKU: {selectedProductModal.sku} • Norma NTC / ISO 9001
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Product details */}
            <div className="space-y-4 text-xs text-[#1f1b10]">
              <div className="p-4 rounded-xl bg-[#fcf8f2] border border-[#ebe2cf]">
                <h4 className="text-base font-black text-[#725c00]">
                  {selectedProductModal.name}
                </h4>
                <p className="mt-1 leading-relaxed text-[#4d4632]">
                  {selectedProductModal.description}
                </p>
              </div>

              {/* Table of Specs */}
              <div className="border border-[#ebe2cf] rounded-xl overflow-hidden divide-y divide-[#ebe2cf]">
                <div className="flex justify-between p-2.5 bg-white">
                  <span className="text-[#7f765f]">Rendimiento Teórico:</span>
                  <span className="font-bold">{selectedProductModal.coverageM2PerGal} m²/galón a 1 mano</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#fcf8f2]">
                  <span className="text-[#7f765f]">Manos Recomendadas:</span>
                  <span className="font-bold">{selectedProductModal.recommendedCoats} manos</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white">
                  <span className="text-[#7f765f]">Secado al Tacto (25°C):</span>
                  <span className="font-bold text-[#2f5ea1]">{selectedProductModal.dryingTimeTouch}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#fcf8f2]">
                  <span className="text-[#7f765f]">Repinte / Segunda Mano:</span>
                  <span className="font-bold">{selectedProductModal.dryingTimeRecoat}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white">
                  <span className="text-[#7f765f]">Sólidos por Volumen:</span>
                  <span className="font-bold">{selectedProductModal.solidsByVolume}%</span>
                </div>
                <div className="flex justify-between p-2.5 bg-[#fcf8f2]">
                  <span className="text-[#7f765f]">Contenido VOC:</span>
                  <span className="font-bold text-[#137333]">{selectedProductModal.voc}</span>
                </div>
                <div className="flex justify-between p-2.5 bg-white">
                  <span className="text-[#7f765f]">Acabado / Brillo:</span>
                  <span className="font-bold">{selectedProductModal.sheen}</span>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-[#e1edff] text-[#001b3d] text-[11px] leading-relaxed">
                <strong>Instrucciones de Mezcla:</strong> Agitar el envase antes de usar hasta homogeneizar completamente.
                Para primera mano sobre sustratos porosos diluir hasta un 10% con agua limpia.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-6 mt-4 border-t border-[#ebe2cf]">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#1f1b10] hover:bg-[#f6eddb] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#7f765f]" />
                <span>Imprimir Ficha</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProductModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#ffd100] text-[#6f5a00] text-xs font-black hover:bg-[#ffc800] transition-colors cursor-pointer"
              >
                Cerrar Especificación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
