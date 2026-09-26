import React, { useState, useRef, useEffect } from 'react';
import {
  PINTUCO_SUGGESTED_COLORS,
  PintucoColorPreset,
  hexToRgb,
  rgbToHex,
  hslToRgb,
  rgbToHsl,
  isValidHex,
  normalizeHex,
  findClosestPintucoColor,
} from '../lib/colorUtils';
import {
  Palette,
  Disc,
  Check,
  Sparkles,
  X,
  Copy,
  CheckCheck,
  Sliders,
  RefreshCw,
  Info,
} from 'lucide-react';

export interface ColorSelectionResult {
  mode: 'suggestion' | 'custom_wheel';
  name: string;
  hex: string;
  code: string;
}

interface ColorSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productSku?: string;
  initialMode?: 'suggestion' | 'custom_wheel';
  initialHex?: string;
  initialName?: string;
  initialCode?: string;
  onApplyColor: (result: ColorSelectionResult) => void;
}

export const ColorSelectorModal: React.FC<ColorSelectorModalProps> = ({
  isOpen,
  onClose,
  productName,
  productSku,
  initialMode = 'suggestion',
  initialHex = '#E28468',
  initialName = 'Salmón Terracota',
  initialCode = 'PT-248-A',
  onApplyColor,
}) => {
  const [activeTab, setActiveTab] = useState<'suggestion' | 'custom_wheel'>(initialMode);
  const [selectedHex, setSelectedHex] = useState(normalizeHex(initialHex));
  const [selectedName, setSelectedName] = useState(initialName);
  const [selectedCode, setSelectedCode] = useState(initialCode);

  // Wheel state: hue [0, 360], sat [0, 100], light [0, 100]
  const [hue, setHue] = useState(15);
  const [saturation, setSaturation] = useState(70);
  const [lightness, setLightness] = useState(65);

  const [hexInput, setHexInput] = useState(selectedHex);
  const [hexError, setHexError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>('Todas');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingWheel = useRef(false);

  // Sync initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      const normHex = normalizeHex(initialHex);
      setSelectedHex(normHex);
      setHexInput(normHex);
      setSelectedName(initialName);
      setSelectedCode(initialCode);
      setActiveTab(initialMode);

      const rgb = hexToRgb(normHex);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);
    }
  }, [isOpen, initialHex, initialName, initialCode, initialMode]);

  // Draw Color Wheel Canvas
  useEffect(() => {
    if (!isOpen || activeTab !== 'custom_wheel') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 6;

    ctx.clearRect(0, 0, width, height);

    // Draw wheel using radial and angular steps
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          // Calculate angle (0 to 360 deg)
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          if (angle < 0) angle += 360;

          const sat = Math.min(100, (dist / radius) * 100);
          const rgb = hslToRgb(angle, sat, lightness);

          const idx = (y * width + x) * 4;
          data[idx] = rgb.r;
          data[idx + 1] = rgb.g;
          data[idx + 2] = rgb.b;
          data[idx + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Draw Wheel Outer Ring border
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#d1c6ab';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw current selection handle marker
    const angleRad = (hue * Math.PI) / 180;
    const markerDist = (saturation / 100) * radius;
    const markerX = cx + markerDist * Math.cos(angleRad);
    const markerY = cy + markerDist * Math.sin(angleRad);

    ctx.beginPath();
    ctx.arc(markerX, markerY, 9, 0, 2 * Math.PI);
    ctx.fillStyle = selectedHex;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(markerX, markerY, 11, 0, 2 * Math.PI);
    ctx.strokeStyle = '#1f1b10';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [isOpen, activeTab, hue, saturation, lightness, selectedHex]);

  // Handle interacting with the wheel canvas
  const handleCanvasInteraction = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = Math.min(cx, cy) - 6;

    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    const sat = Math.min(100, Math.max(0, (dist / radius) * 100));

    setHue(Math.round(angle));
    setSaturation(Math.round(sat));

    const rgb = hslToRgb(angle, sat, lightness);
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setSelectedHex(newHex);
    setHexInput(newHex);

    // Find closest Pintuco Tone to auto-generate a professional name
    const closest = findClosestPintucoColor(newHex);
    setSelectedName(`${closest.name} (Tono Personalizado)`);
    setSelectedCode(`COL-${newHex.replace('#', '')}`);
  };

  // Handle Lightness slider change
  const handleLightnessChange = (val: number) => {
    setLightness(val);
    const rgb = hslToRgb(hue, saturation, val);
    const newHex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setSelectedHex(newHex);
    setHexInput(newHex);

    const closest = findClosestPintucoColor(newHex);
    setSelectedName(`${closest.name} (Tono Personalizado)`);
    setSelectedCode(`COL-${newHex.replace('#', '')}`);
  };

  // Handle typing custom Hex code
  const handleHexInputChange = (val: string) => {
    setHexInput(val);
    if (isValidHex(val)) {
      setHexError(false);
      const norm = normalizeHex(val);
      setSelectedHex(norm);

      const rgb = hexToRgb(norm);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setLightness(hsl.l);

      const closest = findClosestPintucoColor(norm);
      setSelectedName(`${closest.name} (Tono Personalizado)`);
      setSelectedCode(`COL-${norm.replace('#', '')}`);
    } else {
      setHexError(true);
    }
  };

  // Handle RGB inputs
  const currentRgb = hexToRgb(selectedHex);
  const handleRgbChange = (channel: 'r' | 'g' | 'b', val: number) => {
    const clamped = Math.max(0, Math.min(255, isNaN(val) ? 0 : val));
    const nextRgb = {
      ...currentRgb,
      [channel]: clamped,
    };
    const newHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    setSelectedHex(newHex);
    setHexInput(newHex);

    const hsl = rgbToHsl(nextRgb.r, nextRgb.g, nextRgb.b);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);

    const closest = findClosestPintucoColor(newHex);
    setSelectedName(`${closest.name} (Tono Personalizado)`);
    setSelectedCode(`COL-${newHex.replace('#', '')}`);
  };

  // Select Suggested Color
  const handleSelectSuggested = (color: PintucoColorPreset) => {
    setSelectedHex(color.hex);
    setHexInput(color.hex);
    setSelectedName(color.name);
    setSelectedCode(color.code);

    const rgb = hexToRgb(color.hex);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setLightness(hsl.l);
  };

  // Copy code helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(`${selectedCode} - ${selectedHex}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Confirm and Apply
  const handleApply = () => {
    onApplyColor({
      mode: activeTab,
      name: selectedName,
      hex: selectedHex,
      code: selectedCode,
    });
    onClose();
  };

  if (!isOpen) return null;

  // Filter suggested colors
  const families = ['Todas', ...Array.from(new Set(PINTUCO_SUGGESTED_COLORS.map((c) => c.family)))];
  const filteredSuggestions =
    selectedFamilyFilter === 'Todas'
      ? PINTUCO_SUGGESTED_COLORS
      : PINTUCO_SUGGESTED_COLORS.filter((c) => c.family === selectedFamilyFilter);

  const closestMatch = findClosestPintucoColor(selectedHex);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#ebe2cf] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#ebe2cf] flex items-center justify-between bg-[#fff8f0] rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ffd100] text-[#6f5a00] flex items-center justify-center shadow-xs">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#725c00]">
                  ColorLink Colorimetría
                </span>
                {productSku && (
                  <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#d1c6ab] text-[#7f765f]">
                    {productSku}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#1f1b10] leading-tight">
                Elección de Color: {productName}
              </h3>
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

        {/* Tab Selection: Sugerencia de Color VS Menú Rueda de Color y Código */}
        <div className="p-4 sm:p-6 border-b border-[#ebe2cf] bg-white">
          <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto p-1.5 rounded-2xl bg-[#f6eddb] border border-[#d1c6ab]/60">
            <button
              type="button"
              onClick={() => setActiveTab('suggestion')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'suggestion'
                  ? 'bg-white text-[#1f1b10] shadow-sm font-black'
                  : 'text-[#4d4632] hover:text-[#1f1b10]'
              }`}
            >
              <Sparkles
                className={`w-4 h-4 ${
                  activeTab === 'suggestion' ? 'text-[#ffd100]' : 'text-[#7f765f]'
                }`}
              />
              <span>1. Sugerencia de Color Pintuco®</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('custom_wheel')}
              className={`py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'custom_wheel'
                  ? 'bg-white text-[#1f1b10] shadow-sm font-black'
                  : 'text-[#4d4632] hover:text-[#1f1b10]'
              }`}
            >
              <Disc
                className={`w-4 h-4 ${
                  activeTab === 'custom_wheel' ? 'text-[#2f5ea1]' : 'text-[#7f765f]'
                }`}
              />
              <span>2. Rueda de Color & Código</span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* TAB 1: SUGERENCIA DE COLOR */}
          {activeTab === 'suggestion' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[#1f1b10] text-sm sm:text-base">
                    Paleta de Tonos Certificados Pintuco®
                  </h4>
                  <p className="text-xs text-[#7f765f]">
                    Formulaciones de alta durabilidad, cubrimiento probado y resistencia al envejecimiento.
                  </p>
                </div>

                {/* Family Filters */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                  {families.map((fam) => (
                    <button
                      key={fam}
                      type="button"
                      onClick={() => setSelectedFamilyFilter(fam)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedFamilyFilter === fam
                          ? 'bg-[#725c00] text-white shadow-xs'
                          : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
                      }`}
                    >
                      {fam}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Suggested Colors */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredSuggestions.map((col) => {
                  const isSelected = selectedHex.toUpperCase() === col.hex.toUpperCase();
                  return (
                    <button
                      key={col.code}
                      type="button"
                      onClick={() => handleSelectSuggested(col)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between group cursor-pointer ${
                        isSelected
                          ? 'border-[#725c00] bg-[#fcf3e0] ring-2 ring-[#ffd100] shadow-sm'
                          : 'border-[#ebe2cf] bg-white hover:border-[#d1c6ab] hover:bg-[#fffdfa]'
                      }`}
                    >
                      {/* Color Preview Swatch */}
                      <div
                        className="w-full h-16 rounded-xl shadow-inner border border-black/10 mb-2 relative overflow-hidden"
                        style={{ backgroundColor: col.hex }}
                      >
                        {isSelected && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-7 h-7 rounded-full bg-white text-[#725c00] flex items-center justify-center shadow-md">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          </div>
                        )}
                        {col.popular && (
                          <span className="absolute top-1 right-1 text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                            Top
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[#725c00] uppercase block truncate">
                          {col.family}
                        </span>
                        <h5 className="font-bold text-xs sm:text-sm text-[#1f1b10] leading-snug truncate">
                          {col.name}
                        </h5>
                        <div className="flex items-center justify-between text-[11px] text-[#7f765f] mt-1 font-mono">
                          <span>{col.code}</span>
                          <span>{col.hex}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: RUEDA DE COLOR & CÓDIGO */}
          {activeTab === 'custom_wheel' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: Interactive Wheel & Lightness Slider (Span 6) */}
              <div className="md:col-span-6 flex flex-col items-center p-4 rounded-2xl bg-[#fff8f0] border border-[#ebe2cf]">
                <span className="text-xs font-bold text-[#725c00] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Disc className="w-4 h-4 text-[#2f5ea1]" />
                  Rueda Cromática Interactiva (360°)
                </span>

                <div className="relative my-2 select-none touch-none">
                  <canvas
                    ref={canvasRef}
                    width={240}
                    height={240}
                    className="cursor-crosshair rounded-full shadow-md transition-shadow hover:shadow-lg"
                    onMouseDown={(e) => {
                      isDraggingWheel.current = true;
                      handleCanvasInteraction(e);
                    }}
                    onMouseMove={(e) => {
                      if (isDraggingWheel.current) handleCanvasInteraction(e);
                    }}
                    onMouseUp={() => {
                      isDraggingWheel.current = false;
                    }}
                    onMouseLeave={() => {
                      isDraggingWheel.current = false;
                    }}
                    onTouchStart={(e) => {
                      isDraggingWheel.current = true;
                      handleCanvasInteraction(e);
                    }}
                    onTouchMove={(e) => {
                      if (isDraggingWheel.current) handleCanvasInteraction(e);
                    }}
                    onTouchEnd={() => {
                      isDraggingWheel.current = false;
                    }}
                  />
                </div>

                {/* Lightness Slider */}
                <div className="w-full px-2 mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[#4d4632]">
                    <span>Luminosidad / Brillo:</span>
                    <span className="font-bold text-[#1f1b10]">{lightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={lightness}
                    onChange={(e) => handleLightnessChange(Number(e.target.value))}
                    className="w-full accent-[#725c00] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#7f765f]">
                    <span>Profundo / Oscuro</span>
                    <span>Medio</span>
                    <span>Pastel / Claro</span>
                  </div>
                </div>

                {/* Direct Native Eyedropper / Palette Input */}
                <div className="w-full mt-4 pt-3 border-t border-[#ebe2cf] flex items-center justify-between text-xs">
                  <span className="text-[#4d4632] font-semibold">Selector de color rápido:</span>
                  <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-[#d1c6ab] hover:bg-[#f6eddb] transition-colors">
                    <span
                      className="w-4 h-4 rounded-full border border-black/20"
                      style={{ backgroundColor: selectedHex }}
                    ></span>
                    <span className="font-bold text-[#1f1b10]">Abrir paleta OS</span>
                    <input
                      type="color"
                      value={selectedHex}
                      onChange={(e) => handleHexInputChange(e.target.value)}
                      className="opacity-0 w-0 h-0 pointer-events-none"
                    />
                  </label>
                </div>
              </div>

              {/* Right Column: Code Inputs & RGB Formula (Span 6) */}
              <div className="md:col-span-6 space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-[#ebe2cf] shadow-2xs space-y-4">
                  <h4 className="font-bold text-sm text-[#1f1b10] flex items-center justify-between">
                    <span>Código de Color Específico</span>
                    <span className="text-[11px] font-normal text-[#7f765f]">
                      Ingresa el código exacto
                    </span>
                  </h4>

                  {/* Hex Code Input */}
                  <div>
                    <label className="block text-xs font-bold text-[#725c00] uppercase mb-1">
                      Código Hexadecimal (#HEX)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={hexInput}
                          maxLength={7}
                          onChange={(e) => handleHexInputChange(e.target.value)}
                          placeholder="#E28468"
                          className={`w-full py-2.5 px-3.5 rounded-xl border font-mono font-bold text-sm tracking-wider uppercase transition-all outline-hidden ${
                            hexError
                              ? 'border-rose-500 bg-rose-50 text-rose-800'
                              : 'border-[#d1c6ab] bg-white text-[#1f1b10] focus:border-[#725c00] focus:ring-1 focus:ring-[#ffd100]'
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="px-3.5 py-2.5 rounded-xl bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] font-bold text-xs flex items-center gap-1.5 transition-colors border border-[#d1c6ab]"
                        title="Copiar código"
                      >
                        {copied ? (
                          <>
                            <CheckCheck className="w-4 h-4 text-emerald-600" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-[#725c00]" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                    {hexError && (
                      <p className="text-[11px] text-rose-600 mt-1">
                        Formato inválido. Ejemplo válido: #E28468 o #FFF
                      </p>
                    )}
                  </div>

                  {/* RGB Channel Inputs */}
                  <div>
                    <label className="block text-xs font-bold text-[#725c00] uppercase mb-1.5">
                      Fórmula de Laboratorio RGB (0 - 255)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-[#7f765f] block mb-0.5">
                          R (Rojo)
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={currentRgb.r}
                          onChange={(e) => handleRgbChange('r', parseInt(e.target.value))}
                          className="w-full p-2 text-center font-mono font-bold text-sm rounded-lg border border-[#d1c6ab] bg-[#fff8f0]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#7f765f] block mb-0.5">
                          G (Verde)
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={currentRgb.g}
                          onChange={(e) => handleRgbChange('g', parseInt(e.target.value))}
                          className="w-full p-2 text-center font-mono font-bold text-sm rounded-lg border border-[#d1c6ab] bg-[#fff8f0]"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#7f765f] block mb-0.5">
                          B (Azul)
                        </span>
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={currentRgb.b}
                          onChange={(e) => handleRgbChange('b', parseInt(e.target.value))}
                          className="w-full p-2 text-center font-mono font-bold text-sm rounded-lg border border-[#d1c6ab] bg-[#fff8f0]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tintometric equivalence alert */}
                  <div className="p-3 rounded-xl bg-[#fcf3e0] border border-[#d1c6ab]/70 text-xs text-[#4d4632] flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#725c00] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-[#1f1b10] block mb-0.5">
                        Equivalencia Pintuco®:
                      </span>
                      <span>
                        Este tono se formula mediante tintometría computarizada base con referencia más cercana a{' '}
                        <strong className="text-[#725c00] font-bold">{closestMatch.name}</strong> ({closestMatch.code}).
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Color Preview & Comparison Summary Bar */}
          <div className="p-4 rounded-2xl bg-[#fff8f0] border border-[#ebe2cf] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-12 h-12 rounded-xl shadow-md border-2 border-white ring-1 ring-black/10 shrink-0"
                  style={{ backgroundColor: selectedHex }}
                ></div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#725c00]">
                  Color que se aplicará al proyecto:
                </span>
                <h4 className="font-black text-base text-[#1f1b10] leading-tight">
                  {selectedName}
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono text-[#7f765f] mt-0.5">
                  <span className="font-bold text-[#2f5ea1]">{selectedCode}</span>
                  <span>•</span>
                  <span>{selectedHex}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full border border-[#d1c6ab] text-[#4d4632] hover:bg-[#f6eddb] text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full bg-[#ffd100] hover:bg-[#ffc800] text-[#1f1b10] font-black text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Aplicar Color</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
