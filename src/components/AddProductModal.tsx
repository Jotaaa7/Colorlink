import React, { useState } from 'react';
import { PINTUCO_CATALOG, PintucoCatalogItem } from '../data/pintucoProducts';
import { QuotationItem } from '../types';
import {
  PINTUCO_SUGGESTED_COLORS,
  PintucoColorPreset,
  normalizeHex,
} from '../lib/colorUtils';
import { ColorSelectorModal, ColorSelectionResult } from './ColorSelectorModal';
import {
  PackagePlus,
  Search,
  Filter,
  Palette,
  Disc,
  Sparkles,
  Check,
  Plus,
  X,
  Layers,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (item: QuotationItem) => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'manual'>('catalog');

  // Catalog tab state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<PintucoCatalogItem>(
    PINTUCO_CATALOG[0]
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [packagingUnit, setPackagingUnit] = useState<string>('Galón (1 Gal)');
  const [finishPreference, setFinishPreference] = useState<string>('Mate');

  // Color state for catalog item
  const [catalogColorMode, setCatalogColorMode] = useState<'suggestion' | 'custom_wheel'>('suggestion');
  const [catalogColorHex, setCatalogColorHex] = useState('#E28468');
  const [catalogColorName, setCatalogColorName] = useState('Salmón Terracota');
  const [catalogColorCode, setCatalogColorCode] = useState('PT-248-A');

  // Manual custom product state
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState('Pintura Especial');
  const [manualUnit, setManualUnit] = useState('Galón (1 Gal)');
  const [manualQuantity, setManualQuantity] = useState<number>(1);
  const [manualUnitPrice, setManualUnitPrice] = useState<number>(85000);
  const [manualHasColors, setManualHasColors] = useState<boolean>(true);
  const [manualNotes, setManualNotes] = useState('');

  // Color state for manual item
  const [manualColorMode, setManualColorMode] = useState<'suggestion' | 'custom_wheel'>('suggestion');
  const [manualColorHex, setManualColorHex] = useState('#FAF6EE');
  const [manualColorName, setManualColorName] = useState('Blanco Lienzo');
  const [manualColorCode, setManualColorCode] = useState('PT-100-B');

  // Color wheel modal state
  const [colorModalTarget, setColorModalTarget] = useState<'catalog' | 'manual' | null>(null);

  if (!isOpen) return null;

  // Filter Catalog
  const categories = [
    'Todas',
    'Arquitectónica',
    'Metal',
    'Madera',
    'Construcción',
    'Industrial y Alto Desempeño',
    'Herramientas y Accesorios',
  ];

  const filteredCatalog = PINTUCO_CATALOG.filter((item) => {
    const matchesCategory =
      selectedCategory === 'Todas' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Handle color change from ColorSelectorModal
  const handleColorModalApply = (result: ColorSelectionResult) => {
    if (colorModalTarget === 'catalog') {
      setCatalogColorMode(result.mode);
      setCatalogColorHex(result.hex);
      setCatalogColorName(result.name);
      setCatalogColorCode(result.code);
    } else if (colorModalTarget === 'manual') {
      setManualColorMode(result.mode);
      setManualColorHex(result.hex);
      setManualColorName(result.name);
      setManualColorCode(result.code);
    }
  };

  // Submit adding catalog item
  const handleAddCatalogItem = () => {
    const total = selectedCatalogItem.priceCOP * Math.max(1, quantity);
    const itemToAdd: QuotationItem = {
      sku: selectedCatalogItem.sku,
      name: selectedCatalogItem.hasColors
        ? `${selectedCatalogItem.name} (${catalogColorName})`
        : selectedCatalogItem.name,
      type: selectedCatalogItem.category,
      unit: packagingUnit,
      quantity: Math.max(1, quantity),
      unitPriceCOP: selectedCatalogItem.priceCOP,
      totalCOP: total,
      hasColors: selectedCatalogItem.hasColors,
      selectedColorMode: selectedCatalogItem.hasColors ? catalogColorMode : undefined,
      selectedColorName: selectedCatalogItem.hasColors ? catalogColorName : undefined,
      selectedColorHex: selectedCatalogItem.hasColors ? catalogColorHex : undefined,
      selectedColorCode: selectedCatalogItem.hasColors ? catalogColorCode : undefined,
      finishPreference: selectedCatalogItem.hasColors ? finishPreference : undefined,
      isCustomManual: false,
    };

    onAddProduct(itemToAdd);
    onClose();
  };

  // Submit adding manual item
  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    const total = manualUnitPrice * Math.max(1, manualQuantity);
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const generatedSku = `MAN-${manualType.slice(0, 3).toUpperCase()}-${randomSuffix}`;

    const itemToAdd: QuotationItem = {
      sku: generatedSku,
      name: manualHasColors
        ? `${manualName.trim()} (${manualColorName})`
        : manualName.trim(),
      type: manualType,
      unit: manualUnit,
      quantity: Math.max(1, manualQuantity),
      unitPriceCOP: manualUnitPrice,
      totalCOP: total,
      hasColors: manualHasColors,
      selectedColorMode: manualHasColors ? manualColorMode : undefined,
      selectedColorName: manualHasColors ? manualColorName : undefined,
      selectedColorHex: manualHasColors ? manualColorHex : undefined,
      selectedColorCode: manualHasColors ? manualColorCode : undefined,
      isCustomManual: true,
      notes: manualNotes.trim() || undefined,
    };

    onAddProduct(itemToAdd);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#ebe2cf] flex flex-col">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[#ebe2cf] flex items-center justify-between bg-[#fff8f0] rounded-t-3xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#ffd100] text-[#6f5a00] flex items-center justify-center shadow-xs">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#1f1b10] leading-tight">
                  Agregar Producto al Proyecto
                </h3>
                <p className="text-xs text-[#7f765f]">
                  Selecciona del catálogo certificado Pintuco® o crea un ítem personalizado para la obra.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white hover:bg-[#ebe2cf] text-[#4d4632] flex items-center justify-center transition-colors border border-[#d1c6ab]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="p-4 sm:p-6 border-b border-[#ebe2cf] bg-white">
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto p-1.5 rounded-2xl bg-[#f6eddb] border border-[#d1c6ab]/60">
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'catalog'
                    ? 'bg-white text-[#1f1b10] shadow-sm font-black'
                    : 'text-[#4d4632] hover:text-[#1f1b10]'
                }`}
              >
                <Layers className="w-4 h-4 text-[#725c00]" />
                <span>1. Catálogo Pintuco®</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'manual'
                    ? 'bg-white text-[#1f1b10] shadow-sm font-black'
                    : 'text-[#4d4632] hover:text-[#1f1b10]'
                }`}
              >
                <Plus className="w-4 h-4 text-[#2f5ea1]" />
                <span>2. Producto Manual / Obra</span>
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 flex-1 space-y-6">
            {/* ================= TAB 1: CATALOG ================= */}
            {activeTab === 'catalog' && (
              <div className="space-y-6">
                {/* Search & Categories Filter */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#7f765f]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar por nombre, SKU o aplicación (ej: Viniltex, anticorrosivo, rodillo)..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d1c6ab] bg-white text-sm text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100] outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          selectedCategory === cat
                            ? 'bg-[#725c00] text-white shadow-xs'
                            : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-60 overflow-y-auto pr-1">
                  {filteredCatalog.map((item) => {
                    const isSelected = selectedCatalogItem.sku === item.sku;
                    return (
                      <div
                        key={item.sku}
                        onClick={() => setSelectedCatalogItem(item)}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#725c00] bg-[#fcf3e0] ring-2 ring-[#ffd100] shadow-xs'
                            : 'border-[#ebe2cf] bg-white hover:border-[#d1c6ab]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold uppercase text-[#725c00]">
                              {item.category}
                            </span>
                            <span className="text-[10px] font-mono text-[#7f765f]">
                              {item.sku}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs sm:text-sm text-[#1f1b10] leading-snug line-clamp-1 mb-1">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-[#4d4632] line-clamp-2 leading-relaxed mb-2">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#ebe2cf] flex items-center justify-between">
                          <span className="font-black text-sm text-[#1f1b10]">
                            {formatCOP(item.priceCOP)}
                          </span>
                          {item.hasColors ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ffd100]/20 text-[#725c00] flex items-center gap-1">
                              <Palette className="w-3 h-3" />
                              Colorizable
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#7f765f]">Sin color</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Configure Selected Catalog Item */}
                <div className="p-5 rounded-2xl bg-[#fff8f0] border border-[#ebe2cf] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ebe2cf] pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-[#725c00]">
                        SKU: {selectedCatalogItem.sku}
                      </span>
                      <h4 className="font-black text-base sm:text-lg text-[#1f1b10]">
                        {selectedCatalogItem.name}
                      </h4>
                    </div>
                    <span className="text-xl font-black text-[#725c00]">
                      {formatCOP(selectedCatalogItem.priceCOP)} / galón
                    </span>
                  </div>

                  {/* If product has colors: Choose between Color Suggestion VS Color Wheel */}
                  {selectedCatalogItem.hasColors ? (
                    <div className="p-4 rounded-xl bg-white border border-[#d1c6ab] space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-[#725c00]" />
                          <h5 className="font-bold text-xs sm:text-sm text-[#1f1b10] uppercase tracking-wide">
                            Selección de Color para este Producto
                          </h5>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Tinturado Computarizado
                        </span>
                      </div>

                      {/* Current Selected Color Preview Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf]">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg shadow-sm border border-black/15 shrink-0"
                            style={{ backgroundColor: catalogColorHex }}
                          ></div>
                          <div>
                            <span className="text-[10px] text-[#7f765f] uppercase font-bold">
                              Tono Actual:
                            </span>
                            <div className="font-bold text-sm text-[#1f1b10]">
                              {catalogColorName}
                            </div>
                            <div className="text-xs font-mono text-[#725c00]">
                              {catalogColorCode} • {catalogColorHex}
                            </div>
                          </div>
                        </div>

                        {/* Open Wheel & Code Picker Button */}
                        <button
                          type="button"
                          onClick={() => setColorModalTarget('catalog')}
                          className="px-4 py-2 rounded-xl bg-white hover:bg-[#ebe2cf] text-[#1f1b10] font-bold text-xs flex items-center gap-2 border border-[#d1c6ab] shadow-2xs transition-colors cursor-pointer"
                        >
                          <Disc className="w-4 h-4 text-[#2f5ea1]" />
                          <span>Abrir Rueda de Color & Código</span>
                        </button>
                      </div>

                      {/* Quick Suggested Palette Swatches */}
                      <div>
                        <span className="text-xs font-bold text-[#4d4632] block mb-2">
                          O elige una sugerencia rápida de color Pintuco®:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {PINTUCO_SUGGESTED_COLORS.slice(0, 4).map((preset) => {
                            const isSelected =
                              catalogColorHex.toUpperCase() === preset.hex.toUpperCase();
                            return (
                              <button
                                key={preset.code}
                                type="button"
                                onClick={() => {
                                  setCatalogColorMode('suggestion');
                                  setCatalogColorHex(preset.hex);
                                  setCatalogColorName(preset.name);
                                  setCatalogColorCode(preset.code);
                                }}
                                className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? 'border-[#725c00] bg-[#fcf3e0] ring-2 ring-[#ffd100]'
                                    : 'border-[#ebe2cf] bg-white hover:border-[#d1c6ab]'
                                }`}
                              >
                                <div
                                  className="w-6 h-6 rounded-md shadow-inner shrink-0 border border-black/10"
                                  style={{ backgroundColor: preset.hex }}
                                ></div>
                                <div className="truncate">
                                  <span className="text-xs font-bold text-[#1f1b10] block truncate">
                                    {preset.name}
                                  </span>
                                  <span className="text-[10px] text-[#7f765f] font-mono">
                                    {preset.code}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Finish Preference */}
                      <div>
                        <span className="text-xs font-bold text-[#4d4632] block mb-1.5">
                          Acabado Óptico:
                        </span>
                        <div className="flex gap-2">
                          {['Mate', 'Satinado', 'Brillante'].map((finish) => (
                            <button
                              key={finish}
                              type="button"
                              onClick={() => setFinishPreference(finish)}
                              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                finishPreference === finish
                                  ? 'bg-[#725c00] text-white shadow-2xs'
                                  : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
                              }`}
                            >
                              {finish}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white border border-[#ebe2cf] text-xs text-[#7f765f] flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#725c00] shrink-0" />
                      <span>
                        Este producto tiene fórmula transparente o acabado incoloro. No requiere selección de color.
                      </span>
                    </div>
                  )}

                  {/* Quantity & Presentation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#725c00] uppercase mb-1">
                        Presentación / Empaque
                      </label>
                      <select
                        value={packagingUnit}
                        onChange={(e) => setPackagingUnit(e.target.value)}
                        className="w-full py-2.5 px-3 rounded-xl border border-[#d1c6ab] bg-white text-sm font-semibold text-[#1f1b10]"
                      >
                        <option value="Galón (1 Gal)">Galón (1 Gal)</option>
                        <option value="Caneca (5 Gal)">Caneca (5 Gal)</option>
                        <option value="Cuñete (2.5 Gal)">Cuñete (2.5 Gal)</option>
                        <option value="Litro (0.25 Gal)">Litro (0.25 Gal)</option>
                        <option value="Unidad / Kit">Unidad / Kit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#725c00] uppercase mb-1">
                        Cantidad Requerida
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="w-10 h-10 rounded-xl bg-white border border-[#d1c6ab] font-black text-lg text-[#1f1b10] hover:bg-[#f6eddb]"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full text-center py-2 font-black text-base rounded-xl border border-[#d1c6ab] bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="w-10 h-10 rounded-xl bg-white border border-[#d1c6ab] font-black text-lg text-[#1f1b10] hover:bg-[#f6eddb]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Submit */}
                  <div className="pt-3 border-t border-[#ebe2cf] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs text-[#7f765f] block">Subtotal Calculado:</span>
                      <span className="text-2xl font-black text-[#725c00]">
                        {formatCOP(selectedCatalogItem.priceCOP * quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddCatalogItem}
                      className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Agregar Producto al Proyecto</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: MANUAL CUSTOM PRODUCT ================= */}
            {activeTab === 'manual' && (
              <form onSubmit={handleAddManualItem} className="space-y-5">
                <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab]/70 text-xs text-[#4d4632] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-[#725c00] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#1f1b10] block mb-0.5">
                      Ingreso Manual de Productos / Materiales Especiales:
                    </span>
                    <span>
                      Permite añadir herramientas específicas, consumibles de obra o formulaciones personalizadas que no estén listadas en el catálogo base.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-[#725c00] uppercase mb-1">
                      Nombre del Producto o Material *
                    </label>
                    <input
                      type="text"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="Ej: Esmalte Poliuretano Especial Alto Tráfico, Lija Grano 180, Cinta Pintor 3M..."
                      className="w-full py-2.5 px-3.5 rounded-xl border border-[#d1c6ab] bg-white text-sm font-semibold text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100] outline-hidden"
                    />
                  </div>

                  {/* Category / Type */}
                  <div>
                    <label className="block text-xs font-bold text-[#725c00] uppercase mb-1">
                      Categoría / Tipo de Producto
                    </label>
                    <select
                      value={manualType}
                      onChange={(e) => setManualType(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#d1c6ab] bg-white text-sm font-semibold text-[#1f1b10]"
                    >
                      <option value="Pintura Especial">Pintura Especial / Acabado</option>
                      <option value="Imprimante / Sellador">Imprimante / Sellador</option>
                      <option value="Masilla y Estuco">Masilla y Estuco</option>
                      <option value="Impermeabilizante">Impermeabilizante</option>
                      <option value="Herramientas y Brochas">Herramientas y Brochas</option>
                      <option value="Insumo de Preparación">Insumo de Preparación (Lijas, Cintas)</option>
                      <option value="Otro Suministro">Otro Suministro de Obra</option>
                    </select>
                  </div>

                  {/* Packaging Unit */}
                  <div>
                    <label className="block text-xs font-bold text-[#725c00] uppercase mb-1">
                      Unidad / Presentación
                    </label>
                    <input
                      type="text"
                      value={manualUnit}
                      onChange={(e) => setManualUnit(e.target.value)}
                      placeholder="Ej: Galón, Caneca, Cuñete, Rollo, Paquete..."
                      className="w-full py-2.5 px-3.5 rounded-xl border border-[#d1c6ab] bg-white text-sm font-semibold text-[#1f1b10]"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-bold text-[#725c00] uppercase mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={manualQuantity}
                      onChange={(e) => setManualQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-[#d1c6ab] bg-white text-sm font-bold text-[#1f1b10]"
                    />
                  </div>

                  {/* Unit Price COP */}
                  <div>
                    <label className="block text-xs font-bold text-[#725c00] uppercase mb-1">
                      Precio Unitario Estimado (COP) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      required
                      value={manualUnitPrice}
                      onChange={(e) => setManualUnitPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-[#d1c6ab] bg-white text-sm font-black text-[#1f1b10]"
                    />
                  </div>
                </div>

                {/* Has Colors Checkbox */}
                <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#ebe2cf] space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualHasColors}
                      onChange={(e) => setManualHasColors(e.target.checked)}
                      className="w-5 h-5 accent-[#725c00] rounded"
                    />
                    <span className="font-bold text-sm text-[#1f1b10]">
                      ¿Este producto requiere especificación de color? (Rueda o sugerencia de color)
                    </span>
                  </label>

                  {manualHasColors && (
                    <div className="pt-2 border-t border-[#ebe2cf] space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#d1c6ab]">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg shadow-sm border border-black/15 shrink-0"
                            style={{ backgroundColor: manualColorHex }}
                          ></div>
                          <div>
                            <span className="text-[10px] text-[#7f765f] uppercase font-bold">
                              Color Asignado:
                            </span>
                            <div className="font-bold text-sm text-[#1f1b10]">
                              {manualColorName}
                            </div>
                            <div className="text-xs font-mono text-[#725c00]">
                              {manualColorCode} • {manualColorHex}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setColorModalTarget('manual')}
                          className="px-4 py-2 rounded-xl bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] font-bold text-xs flex items-center gap-2 border border-[#d1c6ab] transition-colors cursor-pointer"
                        >
                          <Disc className="w-4 h-4 text-[#2f5ea1]" />
                          <span>Abrir Rueda de Color & Código</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {PINTUCO_SUGGESTED_COLORS.slice(0, 4).map((preset) => (
                          <button
                            key={preset.code}
                            type="button"
                            onClick={() => {
                              setManualColorMode('suggestion');
                              setManualColorHex(preset.hex);
                              setManualColorName(preset.name);
                              setManualColorCode(preset.code);
                            }}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                              manualColorHex.toUpperCase() === preset.hex.toUpperCase()
                                ? 'border-[#725c00] bg-[#fcf3e0] ring-2 ring-[#ffd100]'
                                : 'border-[#ebe2cf] bg-white hover:border-[#d1c6ab]'
                            }`}
                          >
                            <div
                              className="w-5 h-5 rounded-md shadow-inner shrink-0 border border-black/10"
                              style={{ backgroundColor: preset.hex }}
                            ></div>
                            <span className="text-xs font-bold text-[#1f1b10] truncate">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-xs font-bold text-[#725c00] uppercase mb-1">
                    Notas o Instrucciones para el Asesor Técnico (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    placeholder="Instrucciones sobre marca alternativa, dilución especial o entrega requerida..."
                    className="w-full py-2 px-3 rounded-xl border border-[#d1c6ab] bg-white text-xs text-[#1f1b10] resize-none"
                  />
                </div>

                {/* Total & Submit */}
                <div className="pt-3 border-t border-[#ebe2cf] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-[#7f765f] block">Total Estimado del Ítem:</span>
                    <span className="text-2xl font-black text-[#725c00]">
                      {formatCOP(manualUnitPrice * manualQuantity)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Guardar Producto en el Proyecto</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Nested Color Wheel Modal for picking color if triggered */}
      {colorModalTarget && (
        <ColorSelectorModal
          isOpen={!!colorModalTarget}
          onClose={() => setColorModalTarget(null)}
          productName={
            colorModalTarget === 'catalog'
              ? selectedCatalogItem.name
              : manualName || 'Producto Personalizado'
          }
          productSku={colorModalTarget === 'catalog' ? selectedCatalogItem.sku : undefined}
          initialMode={colorModalTarget === 'catalog' ? catalogColorMode : manualColorMode}
          initialHex={colorModalTarget === 'catalog' ? catalogColorHex : manualColorHex}
          initialName={colorModalTarget === 'catalog' ? catalogColorName : manualColorName}
          initialCode={colorModalTarget === 'catalog' ? catalogColorCode : manualColorCode}
          onApplyColor={handleColorModalApply}
        />
      )}
    </>
  );
};
