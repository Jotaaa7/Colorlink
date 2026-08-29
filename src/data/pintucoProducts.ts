import { ProjectRequest, SurfaceType, SurfaceCondition } from '../types';

export interface PintucoCatalogItem {
  sku: string;
  name: string;
  category: 'Arquitectónica' | 'Construcción' | 'Madera' | 'Metal' | 'Industrial y Alto Desempeño';
  description: string;
  coverageM2PerGal: number;
  priceCOP: number;
  recommendedCoats: number;
  dryingTimeTouch: string;
  dryingTimeRecoat: string;
  solidsByVolume: number;
  voc: string;
  sheen: string;
  image: string;
  recommendedSurfaces: SurfaceType[];
  indoorOutdoor: 'interior' | 'exterior' | 'ambos';
}

export const PINTUCO_CATALOG: PintucoCatalogItem[] = [
  {
    sku: 'PT-VX-1010',
    name: 'Viniltex® Avanzado Antibacterial',
    category: 'Arquitectónica',
    description: 'Pintura tipo 1 con máxima lavabilidad, poder cubriente superior y tecnología Bio-Pruf contra hongos y bacterias.',
    coverageM2PerGal: 35,
    priceCOP: 94500,
    recommendedCoats: 2,
    dryingTimeTouch: '30-45 min',
    dryingTimeRecoat: '2-4 horas',
    solidsByVolume: 42,
    voc: '< 50 g/L',
    sheen: 'Mate / Satinado',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
    recommendedSurfaces: ['Pared', 'Drywall', 'Concreto'],
    indoorOutdoor: 'interior',
  },
  {
    sku: 'PT-KZ-4020',
    name: 'Koraza® Máxima Protección 10 Años',
    category: 'Arquitectónica',
    description: 'Pintura 100% acrílica para exteriores con resistencia extrema a intemperie, rayos UV, lluvia torrencial y polución.',
    coverageM2PerGal: 28,
    priceCOP: 138000,
    recommendedCoats: 2,
    dryingTimeTouch: '1 hora',
    dryingTimeRecoat: '4-6 horas',
    solidsByVolume: 46,
    voc: '< 45 g/L',
    sheen: 'Mate sedoso',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&q=80',
    recommendedSurfaces: ['Fachada', 'Pared', 'Concreto'],
    indoorOutdoor: 'exterior',
  },
  {
    sku: 'PT-PL-3001',
    name: 'Pintulux® 3 en 1 Anticorrosivo',
    category: 'Metal',
    description: 'Esmalte sintético alquídico premium: anticorrosivo + imprimante + acabado en una sola aplicación directa sobre metal oxidado o nuevo.',
    coverageM2PerGal: 32,
    priceCOP: 105000,
    recommendedCoats: 2,
    dryingTimeTouch: '2 horas',
    dryingTimeRecoat: '6-8 horas',
    solidsByVolume: 48,
    voc: '< 380 g/L',
    sheen: 'Brillante / Satinado',
    image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=400&q=80',
    recommendedSurfaces: ['Metal', 'Tanque Industrial'],
    indoorOutdoor: 'ambos',
  },
  {
    sku: 'PT-MD-5012',
    name: 'Madetec® Barniz Poliuretano Filtro UV',
    category: 'Madera',
    description: 'Barniz transparente de alta dureza que resalta la veta natural de la madera protegiendo contra humedad, hongos y rayos solares.',
    coverageM2PerGal: 30,
    priceCOP: 98000,
    recommendedCoats: 3,
    dryingTimeTouch: '1-2 horas',
    dryingTimeRecoat: '6 horas',
    solidsByVolume: 40,
    voc: '< 350 g/L',
    sheen: 'Brillante natural',
    image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=400&q=80',
    recommendedSurfaces: ['Madera'],
    indoorOutdoor: 'ambos',
  },
  {
    sku: 'PT-EP-8090',
    name: 'Pintuco EpoxiPoliamida Alto Desempeño',
    category: 'Industrial y Alto Desempeño',
    description: 'Recubrimiento epóxico de dos componentes con altísima resistencia química, mecánica y a abrasión para pisos industriales y plantas.',
    coverageM2PerGal: 22,
    priceCOP: 215000,
    recommendedCoats: 2,
    dryingTimeTouch: '4 horas',
    dryingTimeRecoat: '12-24 horas',
    solidsByVolume: 65,
    voc: '< 250 g/L',
    sheen: 'Alto Brillo Epóxico',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80',
    recommendedSurfaces: ['Piso', 'Concreto', 'Tanque Industrial'],
    indoorOutdoor: 'interior',
  },
  {
    sku: 'PT-SM-2005',
    name: 'Sellomax® Imprimante y Sellador Acrílico',
    category: 'Construcción',
    description: 'Sellador base agua que uniformiza la absorción del estuco o concreto, fijando el polvo y aumentando el rendimiento del acabado en un 25%.',
    coverageM2PerGal: 42,
    priceCOP: 62000,
    recommendedCoats: 1,
    dryingTimeTouch: '30 min',
    dryingTimeRecoat: '2 horas',
    solidsByVolume: 30,
    voc: '< 20 g/L',
    sheen: 'Transparente mate',
    image: 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?w=400&q=80',
    recommendedSurfaces: ['Pared', 'Fachada', 'Drywall', 'Concreto'],
    indoorOutdoor: 'ambos',
  },
  {
    sku: 'PT-AQ-6001',
    name: 'Aquablock® Membrana Impermeabilizante Fibrada',
    category: 'Construcción',
    description: 'Impermeabilizante elasto-acrílico fibrado con puenteo de microfisuras para losas, terrazas y cubiertas expuestas a lluvia constante.',
    coverageM2PerGal: 15,
    priceCOP: 148000,
    recommendedCoats: 3,
    dryingTimeTouch: '2 horas',
    dryingTimeRecoat: '4-6 horas',
    solidsByVolume: 52,
    voc: '< 30 g/L',
    sheen: 'Semi-mate elástico',
    image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=400&q=80',
    recommendedSurfaces: ['Techo', 'Fachada', 'Concreto'],
    indoorOutdoor: 'exterior',
  },
];

export interface SamplePhotoPreset {
  id: string;
  title: string;
  surface: SurfaceType;
  condition: SurfaceCondition;
  environment: 'interior' | 'exterior';
  url: string;
  suggestedM2: number;
}

export const SAMPLE_PHOTO_PRESETS: SamplePhotoPreset[] = [
  {
    id: 'preset-living',
    title: 'Sala de Estar Contemporánea (Interior)',
    surface: 'Pared',
    condition: 'Para Repintar',
    environment: 'interior',
    url: 'https://lh3.googleusercontent.com/aida/AEtjO1WYVBglUAjzMQtZxYOsMdBjzwkZIyh5ECgrs4r2o5nrdJtqVrRcpYmbIorQtalWVZwjSl0yHAb4hTEAlgcBihBPPjuCyYNKPx9Z-bVDWzKHX6fZQSY5OvkaOagOPrntsnoM7b19rmxuER032hy2pOycXmWFJMkbN6NKOTnmVToJYFPKtHonVCPEgnciraOXNImokOm0dAQ6Q_u9lRVUdPaM_8Hi91DlzmL7jhQ6LWtdlSAqmipExtH0N04k',
    suggestedM2: 45,
  },
  {
    id: 'preset-facade',
    title: 'Fachada Residencial Expuesta a Lluvia',
    surface: 'Fachada',
    condition: 'Dañado',
    environment: 'exterior',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80',
    suggestedM2: 120,
  },
  {
    id: 'preset-industrial-floor',
    title: 'Piso de Bodega Comercial / Logística',
    surface: 'Piso',
    condition: 'Nuevo',
    environment: 'interior',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80',
    suggestedM2: 250,
  },
  {
    id: 'preset-metal-structure',
    title: 'Estructura Metálica y Portón Exterior',
    surface: 'Metal',
    condition: 'Con Óxido',
    environment: 'exterior',
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=800&q=80',
    suggestedM2: 35,
  },
];

export const INITIAL_DEMO_REQUEST: ProjectRequest = {
  id: 'REQ-2026-7841',
  createdAt: '2026-08-22T09:15:00Z',
  client: {
    fullName: 'Constructora & Diseños Andinos SAS',
    documentType: 'NIT',
    documentNumber: '900.845.192-3',
    email: 'contacto@disenosandinos.co',
    phone: '+57 (601) 745-8900',
  },
  city: 'Bogotá DC',
  address: 'Calle 93B # 13-45 Oficina 502, Chicó',
  areaM2: 180,
  requiredDate: '2026-09-05',
  surfaceType: 'Pared',
  condition: 'Para Repintar',
  environment: 'interior',
  photoUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1WYVBglUAjzMQtZxYOsMdBjzwkZIyh5ECgrs4r2o5nrdJtqVrRcpYmbIorQtalWVZwjSl0yHAb4hTEAlgcBihBPPjuCyYNKPx9Z-bVDWzKHX6fZQSY5OvkaOagOPrntsnoM7b19rmxuER032hy2pOycXmWFJMkbN6NKOTnmVToJYFPKtHonVCPEgnciraOXNImokOm0dAQ6Q_u9lRVUdPaM_8Hi91DlzmL7jhQ6LWtdlSAqmipExtH0N04k',
  additionalDetails: 'Proyecto de remodelación de oficinas boutique. Se requiere acabado mate de alta lavabilidad en tonalidades arena cálido y terracota suave. Importante entrega puntual por inauguración de sede.',
  colorFamily: 'Arena Cálido / Terracota Pintuco #E29D80',
  finishPreference: 'Mate',
  status: 'Aprobada QA',
  diagnosis: {
    diagnosticSummary: 'Superficie de mampostería interior de 180 m² con pintura previa vinílica envejecida. Se detecta necesidad de puenteo y nivelación de microfisuras superficiales en juntas y sellado uniforme para evitar manchas de absorción diferencial.',
    recommendedProducts: [
      {
        name: 'Viniltex® Avanzado Antibacterial',
        type: 'Acabado Principal Lavable',
        sku: 'PT-VX-1010',
        coverageM2PerGal: 35,
        recommendedCoats: 2,
        totalGallonsNeeded: 11,
        estimatedCostCOP: 1039500,
        reason: 'Máxima resistencia al frote y desinfección continua en ambientes corporativos con acabado mate elegante.',
      },
      {
        name: 'Sellomax® Imprimante y Sellador Acrílico',
        type: 'Imprimante Sellador',
        sku: 'PT-SM-2005',
        coverageM2PerGal: 42,
        recommendedCoats: 1,
        totalGallonsNeeded: 5,
        estimatedCostCOP: 310000,
        reason: 'Fija el sustrato existente, neutraliza porosidad y reduce en 20% el consumo del acabado de color.',
      },
    ],
    surfacePreparation: [
      'Lijar suavemente la superficie con lija de agua grano 180 para eliminar brillo residual.',
      'Limpiar polvo con paño húmedo libre de hilachas.',
      'Resanar fisuras con Estuco Acrílico Exterior/Interior Pintuco.',
      'Aplicar 1 mano de Sellomax® y dejar secar 2 horas.',
    ],
    applicationAdvice: {
      recommendedTools: ['Rodillo Microfibra Cero Goteo 3/8"', 'Brocha Nylon 2"', 'Bandeja dosificadora'],
      dilution: 'Máximo 10% de agua potable para primera mano, 5% para segunda mano.',
      dryingTimeTouch: '40 minutos a 20°C',
      dryingTimeBetweenCoats: '3 horas',
      cureTime: '7 días para lavado intensivo',
    },
    qualityCheckpoints: [
      'Medición de humedad relativa en muro (< 10%).',
      'Prueba de adherencia ASTM D3359 grado 5B.',
      'Control de colorimetría Delta E < 0.4 contra patrón formulado.',
    ],
    operationalAlert: 'Lote de Viniltex reservado en Centro de Distribución Bogotá Calle 80. Tinturado computarizado programado en línea de despacho.',
    environmentalFactor: 'Condiciones de Bogotá: temperatura 14°C - 19°C. Se aconseja ventilar durante aplicación para optimizar tiempos de secado.',
  },
  quotation: {
    quoteNumber: 'COT-PT-2026-0482',
    date: '22/08/2026',
    validUntil: '06/09/2026 (15 días)',
    items: [
      {
        sku: 'PT-VX-1010',
        name: 'Viniltex® Avanzado Antibacterial (Tono Arena Cálido)',
        type: 'Pintura Acabado',
        unit: 'Caneca (5 Gal) x 2 + Galón x 1',
        quantity: 11,
        unitPriceCOP: 94500,
        totalCOP: 1039500,
      },
      {
        sku: 'PT-SM-2005',
        name: 'Sellomax® Imprimante y Sellador Acrílico',
        type: 'Imprimante',
        unit: 'Caneca (5 Gal)',
        quantity: 5,
        unitPriceCOP: 62000,
        totalCOP: 310000,
      },
      {
        sku: 'ACC-KIT-PRO',
        name: 'Kit Profesional de Aplicación Pintuco (2 Rodillos + 2 Brochas + Bandeja)',
        type: 'Herramientas',
        unit: 'Kit',
        quantity: 2,
        unitPriceCOP: 48000,
        totalCOP: 96000,
      },
    ],
    subtotalCOP: 1445500,
    discountCOP: 72275, // 5% descuento comercial ColorLink
    taxCOP: 260912, // IVA 19%
    laborEstimateCOP: 950000,
    logisticsCOP: 0, // Envío gratuito por volumen
    totalCOP: 2584137,
    paymentTerms: 'Crédito Corporativo 30 días / PSE / Tarjeta',
    estimatedLeadDays: 2,
  },
  plantStocks: [
    {
      plantName: 'Planta Principal Rionegro (Antioquia)',
      city: 'Rionegro / Medellín',
      availableGallons: 4500,
      batchCode: 'LOTE-RN-2608-A1',
      leadTimeHours: 24,
      status: 'Inmediato',
    },
    {
      plantName: 'Centro de Distribución Central Calle 80',
      city: 'Bogotá DC',
      availableGallons: 1250,
      batchCode: 'LOTE-BG-2608-C3',
      leadTimeHours: 4,
      status: 'Inmediato',
    },
    {
      plantName: 'Centro Logístico Occidente (Yumbo)',
      city: 'Cali / Yumbo',
      availableGallons: 890,
      batchCode: 'LOTE-YB-2607-F2',
      leadTimeHours: 48,
      status: 'En Tránsito',
    },
    {
      plantName: 'Planta Caribe (Barranquilla)',
      city: 'Barranquilla',
      availableGallons: 640,
      batchCode: 'LOTE-BQ-2608-B9',
      leadTimeHours: 48,
      status: 'Inmediato',
    },
  ],
  productionOrder: {
    orderId: 'ORD-PROD-2026-9931',
    sku: 'PT-VX-1010',
    productName: 'Viniltex® Avanzado Color Especial Arena Cálido',
    volumeGallons: 11,
    plant: 'Centro de Distribución Central Bogotá',
    targetDate: '2026-08-23',
    currentStep: 'Control de Calidad (QA)',
    progressPercentage: 85,
    qaMetrics: {
      viscosityKrebs: 98,
      densityGml: 1.34,
      deltaEColor: 0.28,
      dryFilmThicknessMils: 2.1,
      adhesionTapeASTM: '5B (Excelente)',
      finenessHegman: 7,
      approvedBy: 'Ing. Calidad: Dra. Marcela Ospina (Certificación ISO 9001)',
      isPassed: true,
    },
  },
};
