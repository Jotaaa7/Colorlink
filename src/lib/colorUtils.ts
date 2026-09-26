// Color management & conversion utilities for Pintuco ColorLink

export interface PintucoColorPreset {
  name: string;
  hex: string;
  code: string;
  family: string;
  popular?: boolean;
}

export const PINTUCO_SUGGESTED_COLORS: PintucoColorPreset[] = [
  {
    name: 'Salmón Terracota',
    hex: '#E28468',
    code: 'PT-248-A',
    family: 'Terracotas & Tierras',
    popular: true,
  },
  {
    name: 'Blanco Lienzo',
    hex: '#FAF6EE',
    code: 'PT-100-B',
    family: 'Blancos & Neutros',
    popular: true,
  },
  {
    name: 'Arena Cálido',
    hex: '#E29D80',
    code: 'PT-315-C',
    family: 'Neutros Cálidos',
    popular: true,
  },
  {
    name: 'Gris Titanio Urbano',
    hex: '#8A9096',
    code: 'PT-420-G',
    family: 'Grises & Minerales',
    popular: true,
  },
  {
    name: 'Azul Sereno Pintuco',
    hex: '#4A7C9B',
    code: 'PT-512-Z',
    family: 'Azules & Océano',
    popular: true,
  },
  {
    name: 'Verde Andino Esmeralda',
    hex: '#2D6A4F',
    code: 'PT-608-V',
    family: 'Verdes & Botánicos',
    popular: true,
  },
  {
    name: 'Mostaza Colonial',
    hex: '#D4AF37',
    code: 'PT-733-M',
    family: 'Ocres & Amarillos',
    popular: false,
  },
  {
    name: 'Ocre Guatavita',
    hex: '#C18338',
    code: 'PT-782-O',
    family: 'Ocres & Amarillos',
    popular: false,
  },
  {
    name: 'Negro Forja Antracita',
    hex: '#2B2D2F',
    code: 'PT-901-N',
    family: 'Acentos & Profundos',
    popular: false,
  },
  {
    name: 'Marfil Seda',
    hex: '#FDF5E6',
    code: 'PT-105-S',
    family: 'Blancos & Neutros',
    popular: false,
  },
  {
    name: 'Azul Medianoche Profundo',
    hex: '#1D3557',
    code: 'PT-580-P',
    family: 'Azules & Océano',
    popular: false,
  },
  {
    name: 'Verde Salvia Nórdico',
    hex: '#84A98C',
    code: 'PT-630-S',
    family: 'Verdes & Botánicos',
    popular: false,
  },
];

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return { r: 226, g: 132, b: 104 }; // fallback
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  // h in [0, 360], s in [0, 100], l in [0, 100]
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  if (sNorm === 0) {
    const val = Math.round(lNorm * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hNorm) * 255);
  const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255);

  return { r, g, b };
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function isValidHex(hex: string): boolean {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
}

export function normalizeHex(hex: string): string {
  let clean = hex.trim();
  if (!clean.startsWith('#')) clean = `#${clean}`;
  return clean.toUpperCase();
}

export function findClosestPintucoColor(hex: string): PintucoColorPreset {
  const targetRgb = hexToRgb(hex);
  let closest = PINTUCO_SUGGESTED_COLORS[0];
  let minDistance = Infinity;

  for (const preset of PINTUCO_SUGGESTED_COLORS) {
    const rgb = hexToRgb(preset.hex);
    // Euclidean distance in RGB
    const dist = Math.sqrt(
      Math.pow(targetRgb.r - rgb.r, 2) +
      Math.pow(targetRgb.g - rgb.g, 2) +
      Math.pow(targetRgb.b - rgb.b, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      closest = preset;
    }
  }

  return closest;
}
