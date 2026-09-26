export type SurfaceType =
  | 'Pared'
  | 'Piso'
  | 'Metal'
  | 'Madera'
  | 'Fachada'
  | 'Concreto'
  | 'Drywall'
  | 'Techo'
  | 'Tanque Industrial';

export type SurfaceCondition =
  | 'Nuevo'
  | 'Para Repintar'
  | 'Dañado'
  | 'Con Humedad'
  | 'Con Óxido'
  | 'Fisurado / Descascarado';

export type EnvironmentType = 'interior' | 'exterior';

export type DocumentType =
  | 'Cédula de Ciudadanía'
  | 'NIT'
  | 'Cédula de Extranjería'
  | 'Pasaporte';

export interface ClientData {
  fullName: string;
  documentType: DocumentType | string;
  documentNumber: string;
  email: string;
  phone: string;
}

export interface RecommendedProduct {
  name: string;
  type: string;
  sku: string;
  coverageM2PerGal: number;
  recommendedCoats: number;
  totalGallonsNeeded: number;
  estimatedCostCOP: number;
  reason: string;
  hasColors?: boolean;
  selectedColorHex?: string;
  selectedColorName?: string;
  selectedColorCode?: string;
}

export interface AIDiagnosis {
  diagnosticSummary: string;
  recommendedProducts: RecommendedProduct[];
  surfacePreparation: string[];
  applicationAdvice: {
    recommendedTools: string[];
    dilution: string;
    dryingTimeTouch: string;
    dryingTimeBetweenCoats: string;
    cureTime: string;
  };
  qualityCheckpoints: string[];
  operationalAlert: string;
  environmentalFactor: string;
}

export interface QuotationItem {
  sku: string;
  name: string;
  type: string;
  unit: string;
  quantity: number;
  unitPriceCOP: number;
  totalCOP: number;
  hasColors?: boolean;
  selectedColorMode?: 'suggestion' | 'custom_wheel';
  selectedColorName?: string;
  selectedColorHex?: string;
  selectedColorCode?: string;
  isCustomManual?: boolean;
  finishPreference?: string;
  notes?: string;
}

export interface Quotation {
  quoteNumber: string;
  date: string;
  validUntil: string;
  items: QuotationItem[];
  subtotalCOP: number;
  discountCOP: number;
  taxCOP: number;
  laborEstimateCOP: number;
  logisticsCOP: number;
  totalCOP: number;
  paymentTerms: string;
  estimatedLeadDays: number;
}

export interface PlantStock {
  plantName: string;
  city: string;
  availableGallons: number;
  batchCode: string;
  leadTimeHours: number;
  status: 'Inmediato' | 'En Tránsito' | 'Producción Requerida';
}

export interface ProductionOrder {
  orderId: string;
  sku: string;
  productName: string;
  volumeGallons: number;
  plant: string;
  targetDate: string;
  currentStep:
    | 'Recepción y Pesaje'
    | 'Dispersión y Molienda'
    | 'Completación y Dilución'
    | 'Tinturado y Colorimetría'
    | 'Control de Calidad (QA)'
    | 'Envasado y Etiquetado'
    | 'Despachado';
  progressPercentage: number;
  qaMetrics: {
    viscosityKrebs: number; // e.g. 95-105 KU
    densityGml: number; // e.g. 1.35
    deltaEColor: number; // < 0.5 is pass
    dryFilmThicknessMils: number;
    adhesionTapeASTM: '5B (Excelente)' | '4B (Aprobado)' | '3B';
    finenessHegman: number;
    approvedBy: string;
    isPassed: boolean;
  };
}

export interface ProjectRequest {
  id: string;
  createdAt: string;
  client: ClientData;
  city: string;
  address: string;
  areaM2: number;
  requiredDate: string;
  surfaceType: SurfaceType;
  condition: SurfaceCondition;
  environment: EnvironmentType;
  photoUrl?: string;
  photoBase64?: string;
  additionalDetails?: string;
  colorFamily?: string;
  selectedColorHex?: string;
  selectedColorName?: string;
  selectedColorCode?: string;
  selectedColorMode?: 'suggestion' | 'custom_wheel';
  finishPreference?: 'Mate' | 'Satinado' | 'Semibrillante' | 'Brillante' | 'Epóxico Alto Brillo';
  status:
    | 'Registrada'
    | 'Analizada por IA'
    | 'Cotizada'
    | 'Inventario Asignado'
    | 'En Producción'
    | 'Aprobada QA'
    | 'Completada';
  diagnosis?: AIDiagnosis;
  quotation?: Quotation;
  plantStocks?: PlantStock[];
  productionOrder?: ProductionOrder;
  assignedAdvisor?: string;
  technicalReviewNotes?: string;
  trackingNumber?: string;
  assignedCarrier?: string;
  dispatchDate?: string;
  deliveryDate?: string;
  deliveryNotes?: string;
  approvedAt?: string;
  completedAt?: string;
}

export type UserRole =
  | 'Contratista / Maestro'
  | 'Constructora / Arquitecto'
  | 'Cliente Particular'
  | 'Distribuidor / Tienda'
  | 'Especialista Técnico Pintuco'
  | 'Asesor Comercial / Técnico'
  | 'Administrador Pintuco';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  documentType: DocumentType | string;
  documentNumber: string;
  phone: string;
  city: string;
  companyName?: string;
  avatarUrl?: string;
  createdAt: string;
}

export type ActiveTab =
  | 'new_request'
  | 'project_status'
  | 'advisor_portal'
  | 'advisor_inventory'
  | 'ecosystem_hub'
  | 'technical_diagnosis'
  | 'commercial_quote'
  | 'inventory_plants'
  | 'production_qa'
  | 'ai_consultant'
  | 'login'
  | 'register';
