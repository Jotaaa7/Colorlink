export type ValidProjectStatus =
  | 'Registrada'
  | 'Analizada por IA'
  | 'Cotizada'
  | 'Inventario Asignado'
  | 'En Producción'
  | 'Aprobada QA'
  | 'Completada';

export interface PhaseLockInfo {
  canAddProducts: boolean;
  canEditQuantities: boolean;
  canRemoveProducts: boolean;
  canChangeColors: boolean;
  reason: string;
  shortWarning: string;
  badgeLabel: string;
  isLocked: boolean;
}

/**
 * Determines whether products can be added or modified in the given project status.
 *
 * Product changes make technical and business sense ONLY during diagnostic and quotation phases:
 * - 'Registrada' (Solicitud inicial recibida)
 * - 'Analizada por IA' (Diagnóstico de sustrato y formulación técnica)
 * - 'Cotizada' (Propuesta técnico-comercial en revisión)
 *
 * In subsequent logistical and production phases, product changes have NO technical or industrial logic:
 * - 'Inventario Asignado': Batches and stock are already locked in SAP R/3 / CEDI.
 * - 'En Producción': The paint is in manufacturing, dispersion, grinding, or tinting in plant reactors.
 * - 'Aprobada QA': Laboratory certified viscosity, Delta E, and adhesion; containers are sealed.
 * - 'Completada': The project was delivered to the client and closed with an active warranty.
 */
export function getProjectPhaseLockInfo(status?: string): PhaseLockInfo {
  switch (status) {
    case 'Inventario Asignado':
      return {
        canAddProducts: false,
        canEditQuantities: false,
        canRemoveProducts: false,
        canChangeColors: false,
        reason:
          'El inventario ya fue reservado con códigos de lote asignados en el CEDI / SAP. Para modificar o añadir recubrimientos, el pedido debe reversarse a estado "Cotizada".',
        shortWarning: 'Lotes reservados en SAP: No admite nuevos productos.',
        badgeLabel: 'Lotes Bloqueados en SAP',
        isLocked: true,
      };
    case 'En Producción':
      return {
        canAddProducts: false,
        canEditQuantities: false,
        canRemoveProducts: false,
        canChangeColors: false,
        reason:
          'La pintura se encuentra en reactores de dispersión, molienda o tinturado automatizado en planta. No es técnicamente viable alterar una orden de fabricación en curso.',
        shortWarning: 'En línea de producción: No admite nuevos productos.',
        badgeLabel: 'En Fabricación y Tinturado',
        isLocked: true,
      };
    case 'Aprobada QA':
      return {
        canAddProducts: false,
        canEditQuantities: false,
        canRemoveProducts: false,
        canChangeColors: false,
        reason:
          'El lote cuenta con control de calidad (QA) aprobado por laboratorio (viscosidad, Delta E < 0.5 y adherencia) y los envases ya están precintados para despacho.',
        shortWarning: 'Calidad QA aprobada: Formulación sellada.',
        badgeLabel: 'Calidad Certificada QA',
        isLocked: true,
      };
    case 'Completada':
      return {
        canAddProducts: false,
        canEditQuantities: false,
        canRemoveProducts: false,
        canChangeColors: false,
        reason:
          'El pedido ya fue entregado en obra y el certificado de garantía de 5 años está emitido. El expediente técnico se encuentra formalmente cerrado.',
        shortWarning: 'Proyecto entregado y cerrado: No admite adiciones.',
        badgeLabel: 'Entregado en Obra (Cerrado)',
        isLocked: true,
      };
    case 'Registrada':
    case 'Analizada por IA':
    case 'Cotizada':
    default:
      return {
        canAddProducts: true,
        canEditQuantities: true,
        canRemoveProducts: true,
        canChangeColors: true,
        reason:
          'Fase técnica de formulación abierta: Permite calibrar metros cuadrados, añadir recubrimientos del catálogo, cambiar colores y ajustar cantidades.',
        shortWarning: 'Formulación abierta: Puedes agregar o cambiar productos.',
        badgeLabel: 'Fase de Formulación Abierta',
        isLocked: false,
      };
  }
}

export function canAddProductsToProject(status?: string): boolean {
  return getProjectPhaseLockInfo(status).canAddProducts;
}
