import React, { useState, useEffect } from 'react';
import { UserProfile, ProjectRequest } from '../types';
import { saveRemoteInventoryReservation } from '../services/supabaseService';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  ChevronRight,
  Truck,
  BookmarkCheck,
  Bookmark,
  Building2,
  Clock,
  Timer,
  Check,
  X,
  Plus,
  Trash2,
  Info,
  Warehouse,
  Palette,
  Package,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Store,
  FileText,
  FilterX,
  Phone,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface AdvisorInventoryScreenProps {
  currentUser: UserProfile | null;
  request: ProjectRequest | null;
  onSwitchToAdvisorAccount: () => void;
  onOpenLogin: () => void;
  onNavigateHome: () => void;
  onNavigateToDiagnosis?: () => void;
}

interface ProductItem {
  sku: string;
  name: string;
  category: 'arq' | 'prep' | 'imp' | 'acc';
  presentation: string;
  badge: string;
  status: 'disponible' | 'critico' | 'tintometrico';
  lot: string;
  totalStock: number;
  freeStock: number;
  reservedStock: number;
  funzaCount: number;
  cll134Count: number;
  cll80Count: number;
  image: string;
  colorType?: string;
  colorHex?: string;
  unit: string;
}

interface ReservedItem {
  id: string;
  sku: string;
  name: string;
  quantity: string;
  detail: string;
  colorHex?: string;
  status: string;
}

export const AdvisorInventoryScreen: React.FC<AdvisorInventoryScreenProps> = ({
  currentUser,
  request,
  onSwitchToAdvisorAccount,
  onOpenLogin,
  onNavigateHome,
  onNavigateToDiagnosis,
}) => {
  // Check authorization (RBAC)
  const isAuthorized =
    currentUser &&
    (currentUser.role === 'Especialista Técnico Pintuco' ||
      currentUser.role === 'Asesor Comercial / Técnico' ||
      currentUser.role === 'Administrador Pintuco');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHub, setSelectedHub] = useState('all');
  const [selectedLine, setSelectedLine] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'disponible' | 'critico' | 'tintometrico'>('all');

  // Interactive Reservation Panel state
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [dispatchHub, setDispatchHub] = useState('funza');
  const [isConfirmingRes, setIsConfirmingRes] = useState(false);
  const [isReservedSuccess, setIsReservedSuccess] = useState(false);

  // Sync SAP state
  const [isSyncingSap, setIsSyncingSap] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Hoy 14:32 COT');

  // Modals state
  const [selectedStockModalProduct, setSelectedStockModalProduct] = useState<ProductItem | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showActiveReservesModal, setShowActiveReservesModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; icon?: string } | null>(null);

  const triggerToast = (text: string, icon = 'check') => {
    setToastMessage({ text, icon });
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Products Database
  const [products] = useState<ProductItem[]>([
    {
      sku: '1024589',
      name: 'Viniltex Avanzado Antibacterial - Base Pastel',
      category: 'arq',
      presentation: 'Galón (3.785 L) • Resistencia 100% lavable • Fórmula aprobada salud infantil',
      badge: 'Pastel',
      status: 'disponible',
      lot: 'BOG-2024-L89',
      totalStock: 142,
      freeStock: 136,
      reservedStock: 6,
      funzaCount: 98,
      cll134Count: 24,
      cll80Count: 20,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD40YwLgp2_COxRR3C4JK7ZxkrosUfFR1yWBvhkWPErOibNKyYT_LYnquB0f0DSOhGP9hNxIMW3lASDq1by2NuMrT6VSSikcxD6FNWJ0oxQtsr7EUVQnSYCLBrH66wDgubuvDK3XjSS5M-6UudwzK9KiUpYhI0JKeUdGIOu_0ElPymk3wgdqUt2EW7ZxUZhTHesHFyHMkWjFo3fQ6qXIwnMLjj1yZIxNE-lsSiOExRRGQ9b5aV8EolX7w',
      unit: 'gal',
    },
    {
      sku: '1024590',
      name: 'Viniltex Avanzado Antibacterial - Cuarto (1/4 Gal)',
      category: 'arq',
      presentation: 'Presentación 0.946 L • Base apta para acentos de color y remates de muro',
      badge: '1/4 Gal',
      status: 'disponible',
      lot: 'BOG-2024-L92',
      totalStock: 68,
      freeStock: 65,
      reservedStock: 3,
      funzaCount: 40,
      cll134Count: 18,
      cll80Count: 10,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD_PodhUFtiUwub2ZEu8lBhVz1nvFWijz58OKhzWm4OoOdT34iJGBOxAv-UaHWuDBp17_iMiEvGqWcOO6qNwnCxnjiKzvM5PsaAzG8FaBRfqzavcmKR5-6VTydZrZCNBgVKfCfMHJt5UlEFwW4HXTC6CjZB0l0REyeMwzailWztyMGju2vsXk9jt_5sBZ2xqFC3XR4s7r3-eFwHc40wXcBhRSMCDx0moEwvK5arKuFnSOgsKaJxAjFYag',
      unit: 'cuartos',
    },
    {
      sku: '1018944',
      name: 'Sellador Acrílico Antihumedad 501',
      category: 'prep',
      presentation: 'Galón (3.785 L) • Bloqueador de alcalinidad y eflorescencias para yeso y pañete',
      badge: 'Sellador',
      status: 'disponible',
      lot: 'BOG-2024-S33',
      totalStock: 85,
      freeStock: 81,
      reservedStock: 4,
      funzaCount: 62,
      cll134Count: 15,
      cll80Count: 8,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDOLXaCG5sAIbFC-wQBm1KUVH3YM7QvCLW_pI1-BBFSOwEpAlnOeLENyRf8nNdA4RVnRI6NyoHAApeS2sH6wbvs-egeyLrSdT5nok78OsCcLOuGmGOjkoeAvNaTz530p8sxizt24oZMMxemOvhscV-QEYDV4loXATBxs3bvwcz4rkUOm80MvJcjediZOxDEkNZW7xd1mmCDIbKNiSfkzijbq8wdIADUbpOg2nmf_hY87oKXaL8AO1ybiA',
      unit: 'gal',
    },
    {
      sku: 'KIT-PRO-09',
      name: 'Kit de Aplicación & Resane Pro',
      category: 'acc',
      presentation: 'Rodillo Felpa 9" antigota + Cinta Azul Pintor 1" + Masilla Acrílica 1kg + Espátula flexible',
      badge: 'Herramientas',
      status: 'disponible',
      lot: 'Bolsa x 4 piezas',
      totalStock: 54,
      freeStock: 50,
      reservedStock: 4,
      funzaCount: 38,
      cll134Count: 9,
      cll80Count: 7,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC3pNrUPHZjqwEpGstiFInLwXDwQ8ikshyYvI3Zv4KkBLb7GjnH9SMng2W540pHnskjYFfUbaZ0hVW8iO3d0MEUrCpaDuYYFLp75mSljuvF0H4FsIxCgOC3Hsz_ivGBcQaZbpjI7f8ZVXsdy4g-NR4Nr3SYZlRnP8bHiFDfUoNG2VLTrwlc91M_5-FX_y3IAhMJSvfJU_yqocT6geMGn80FMWB8mnUL0CYqCouaBUWB8dbM74YJ8CsFPw',
      unit: 'kits',
    },
    {
      sku: '1004123',
      name: 'Esmalte Doméstico Secado Rápido Blanco',
      category: 'arq',
      presentation: 'Galón (3.785 L) • Acabado brillante para marcos, carpintería metálica y zócalos',
      badge: 'Alquídico',
      status: 'critico',
      lot: 'Reabastecimiento: 36h',
      totalStock: 12,
      freeStock: 10,
      reservedStock: 2,
      funzaCount: 4,
      cll134Count: 5,
      cll80Count: 3,
      image:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBbACIcrDNoMyFeMKXdwSMVp7bZY90AcwI_vZGZN-iy2PLZONRiuITAdCGJa41__Naq3y7EdE44-fGcPOpzx_Cey78kECu68ZgC4A-p1DMA5QaRIYRdcorFYDcW8NWF0UVJw1qNCOPEoOMdhkxG8-_A6XHkacDeqn-dCwWVzd1zaWkHX1RBZFePZQrGFwgmSyd6YtERnvS4a-fWLRVmWWnnchd0Is930Y3Wep3Z_1JQ8BmoqRMn04FCKQ',
      unit: 'gal',
    },
  ]);

  // Staged reserved items list
  const [reservedItems, setReservedItems] = useState<ReservedItem[]>([
    {
      id: 'res-1',
      sku: '1024589',
      name: '1 Gal + 2 Cts Viniltex Salmón Terracota',
      quantity: '1.5 Galón',
      detail: 'Tintometría Color #248-A',
      colorHex: '#d65f4d',
      status: 'Confirmado',
    },
    {
      id: 'res-2',
      sku: '1024501',
      name: '1 Gal Viniltex Blanco Lienzo',
      quantity: '1 Galón',
      detail: 'Fórmula de alta lavabilidad #100-B',
      colorHex: '#f4f2ea',
      status: 'Confirmado',
    },
    {
      id: 'res-3',
      sku: '1018944',
      name: '1 Galón Sellador Acrílico 501',
      quantity: '1 Galón',
      detail: 'Cód. 1018944 • Base anti-humedad',
      status: 'Confirmado',
    },
  ]);

  // Countdown timer for 48h stock guarantee
  const [timerMinutes, setTimerMinutes] = useState(47 * 60 + 58);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerMinutes((prev) => (prev > 0 ? prev - 1 : 0));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = Math.floor(timerMinutes / 60);
  const mins = timerMinutes % 60;

  // Filter products logic
  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      term === '' ||
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.lot.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'disponible' && p.totalStock >= 50) ||
      (statusFilter === 'critico' && p.totalStock < 15) ||
      (statusFilter === 'tintometrico' && p.badge.toLowerCase().includes('pastel'));

    const matchesLine =
      selectedLine === 'all' ||
      (selectedLine === 'arq' && p.category === 'arq') ||
      (selectedLine === 'prep' && p.category === 'prep') ||
      (selectedLine === 'acc' && p.category === 'acc');

    return matchesSearch && matchesStatus && matchesLine;
  });

  // Add Item to reservation
  const handleStageItem = (product: ProductItem) => {
    const newItem: ReservedItem = {
      id: `res-${Date.now()}`,
      sku: product.sku,
      name: `${product.name} (${product.unit === 'kits' ? '1 Kit' : '1 Galón'})`,
      quantity: product.unit === 'kits' ? '1 Kit' : '1 Galón',
      detail: `SKU ${product.sku} • Apartado temporal`,
      status: 'Confirmado',
    };
    setReservedItems((prev) => [newItem, ...prev]);
    triggerToast(`"${product.name}" agregado a la reserva preventiva`, 'plus');
  };

  const handleRemoveReservedItem = (id: string) => {
    setReservedItems((prev) => prev.filter((item) => item.id !== id));
    triggerToast('Ítem eliminado de la reserva', 'trash');
  };

  const handleClearReservedList = () => {
    setReservedItems([]);
    triggerToast('Lista de reserva despejada', 'trash');
  };

  const handleSyncSap = () => {
    setIsSyncingSap(true);
    setTimeout(() => {
      setIsSyncingSap(false);
      const now = new Date();
      setLastSyncTime(`Hoy ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} COT`);
      triggerToast('Inventario SAP R/3 sincronizado con éxito (5 sedes activas)', 'sync');
    }, 1000);
  };

  const handleConfirmReservation = () => {
    setIsConfirmingRes(true);

    // Save reservation record to Supabase database
    saveRemoteInventoryReservation({
      orderCode: 'ORD-RES-8924-BOG',
      projectId: request?.id || 'PTC-2024-8924',
      clientName: request?.client?.fullName || 'Andrés Cepeda',
      destinationAddress: request?.address || 'Usaquén, Calle 127 #11, Bogotá',
      deliveryMode,
      dispatchHub,
      status: 'Confirmado Bloqueo 48h',
      items: reservedItems,
      expiresInHours: 48,
    }).catch((err) => console.warn('Supabase reservation async save notice:', err));

    setTimeout(() => {
      setIsConfirmingRes(false);
      setIsReservedSuccess(true);
      triggerToast('Orden ORD-RES-8924-BOG garantizada por 48 horas en SAP & Supabase', 'check');
    }, 1400);
  };

  // =========================================================================
  // 1. RESTRICTED ACCESS SCREEN (If user is NOT an Advisor or Admin)
  // =========================================================================
  if (!isAuthorized) {
    return (
      <div className="min-h-[85vh] bg-[#fff8f0] flex items-center justify-center p-4 md:p-8">
        <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl border border-[#ebe2cf] p-6 sm:p-10 relative overflow-hidden">
          {/* Decorative background accent */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#ffd100]/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col items-center text-center">
            {/* Lock / Restricted Badge */}
            <div className="w-20 h-20 rounded-3xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shadow-inner mb-6 border border-[#ba1a1a]/20">
              <Lock className="w-10 h-10 stroke-[2.2]" />
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f6eddb] border border-[#d1c6ab] text-[#725c00] text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldAlert className="w-4 h-4 text-[#ba1a1a]" />
              <span>Acceso Restringido • Seguridad Pintuco PRO</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#1f1b10] tracking-tight mb-3">
              Control Logístico & Existencias Exclusivo para Asesores
            </h1>

            <p className="text-sm sm:text-base text-[#4d4632] max-w-lg mb-6 leading-relaxed">
              Esta pantalla se conecta directamente a los <strong>servidores SAP R/3</strong> de Pintuco para 
              <strong> bloquear físicamente lotes en bodega</strong>, verificar fórmulas tintométricas certificadas y coordinar despachos desde CEDI Funza y tiendas especializadas.
            </p>

            {/* Current Session Info */}
            <div className="w-full bg-[#fcf3e0] border border-[#ebe2cf] rounded-2xl p-4 mb-8 text-left flex items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#7f765f] uppercase tracking-wider block">
                  Estado de tu sesión actual:
                </span>
                <span className="text-sm font-bold text-[#1f1b10] flex items-center gap-1.5 mt-0.5">
                  <User className="w-4 h-4 text-[#2f5ea1]" />
                  {currentUser ? `${currentUser.fullName} (${currentUser.role})` : 'Visitante no autenticado'}
                </span>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-[#ffdad6] text-[#ba1a1a] rounded-full border border-[#ba1a1a]/20 shrink-0">
                Rol Sin Permisos
              </span>
            </div>

            {/* Action Buttons to gain authorized access */}
            <div className="w-full flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onSwitchToAdvisorAccount}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                id="btn-unlock-advisor-inventory-demo"
              >
                <UserCheck className="w-5 h-5 text-[#0d4788]" />
                <span>Ingresar como Asesor Técnico Pintuco (Demo 1-Clic)</span>
              </button>

              <button
                type="button"
                onClick={onOpenLogin}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-[#f6eddb] hover:bg-[#f0e7d5] text-[#1f1b10] font-bold text-sm border border-[#d1c6ab] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Iniciar con Otras Credenciales</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onNavigateHome}
              className="mt-6 text-xs font-bold text-[#7f765f] hover:text-[#1f1b10] transition-colors underline decoration-dotted cursor-pointer"
            >
              Volver al Portal de Cliente y Solicitudes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHORIZED SCREEN: CONTROL DE INVENTARIO & DISPONIBILIDAD MULTISEDE
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#fff8f0] text-[#1f1b10] font-sans antialiased pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1f1b10] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#ffd100] animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#ffd100] shrink-0" />
          <span className="text-xs sm:text-sm font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* ===================================================================
          PINTUCO PRO PORTAL NAVBAR (MATCHING THE SCREENSHOT EXACTLY)
          =================================================================== */}
      <header className="w-full bg-[#fff8f0]/95 backdrop-blur-xl border-b border-[#ebe2cf] sticky top-0 z-40 shadow-xs">
        <div className="h-20 w-full px-4 sm:px-6 lg:px-12 flex items-center justify-between gap-6 max-w-[1440px] mx-auto">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ffd100] flex items-center justify-center text-[#0d4788] shadow-xs">
                <Palette className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-[#1f1b10] leading-none">
                  PINTUCO
                </span>
                <span className="text-[11px] font-bold text-[#2f5ea1] uppercase tracking-wider mt-0.5">
                  Portal Técnico & Logístico
                </span>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="hidden xl:flex items-center gap-1 px-2 py-1 bg-[#fcf3e0] rounded-xl border border-[#ebe2cf] ml-4">
              <button
                type="button"
                onClick={() => onNavigateToDiagnosis?.()}
                className="px-3.5 py-2 text-[#4d4632] hover:text-[#1f1b10] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Solicitudes
              </button>

              <button
                type="button"
                onClick={() => onNavigateToDiagnosis?.()}
                className="px-3.5 py-2 text-[#4d4632] hover:text-[#1f1b10] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Diagnóstico & IA
              </button>

              <button
                type="button"
                className="px-3.5 py-2 bg-[#ffd100] text-[#0d4788] text-xs font-black rounded-lg shadow-2xs transition-colors"
              >
                Inventario & Disponibilidad
              </button>

              <button
                type="button"
                onClick={() => triggerToast('Abriendo Catálogo Técnico Pintuco 2024', 'info')}
                className="px-3.5 py-2 text-[#4d4632] hover:text-[#1f1b10] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Catálogo Técnico
              </button>

              <button
                type="button"
                onClick={() => triggerToast('Cargando historial de reservas y pedidos SAP', 'info')}
                className="px-3.5 py-2 text-[#4d4632] hover:text-[#1f1b10] text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Historial
              </button>
            </nav>
          </div>

          {/* Right Section: Quick Search, Online Badge & Advisor Profile */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden md:flex items-center gap-2 bg-[#f6eddb] px-3.5 py-2 rounded-xl border border-[#d1c6ab]/40">
              <Search className="w-4 h-4 text-[#7f765f]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar SKU, producto o lote..."
                className="bg-transparent border-none outline-none text-xs text-[#1f1b10] placeholder:text-[#7f765f] w-48 lg:w-60 font-medium"
              />
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-[#f0e7d5] rounded-full border border-[#d1c6ab]/40">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2f5ea1] animate-pulse"></span>
              <span className="text-xs text-[#1f1b10] font-semibold">En línea</span>
            </div>

            {/* Profile Pill */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#d1c6ab]">
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-[#1f1b10] leading-tight">
                  {currentUser?.fullName || 'Ing. Carlos Ruiz'}
                </span>
                <span className="text-[11px] text-[#7f765f]">Consultor Técnico Senior</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#725c00] text-white flex items-center justify-center shadow-xs">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================================
          BREADCRUMB & HEADER SECTION
          =================================================================== */}
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-5">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs text-[#7f765f] mb-3">
          <button
            onClick={() => onNavigateToDiagnosis?.()}
            className="hover:text-[#2f5ea1] transition-colors font-semibold cursor-pointer"
          >
            Asesorías Activas
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-[#7f765f]" />
          <span className="px-2 py-0.5 rounded bg-[#f6eddb] font-bold text-[#1f1b10]">
            {request?.id || 'PTC-2024-8924'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[#7f765f]" />
          <span className="text-[#2f5ea1] font-bold">Inventario & Reserva Multisede</span>
        </nav>

        {/* Live Status and Title Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2f5ea1] animate-pulse"></span>
              <span className="text-xs uppercase tracking-wider text-[#2f5ea1] font-bold">
                Sincronización SAP R/3 en Vivo
              </span>
              <span className="text-[#7f765f] text-xs">•</span>
              <span className="text-xs text-[#4d4632]">Última lectura: {lastSyncTime}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1f1b10] tracking-tight">
              Control de Inventario & Disponibilidad Multisede
            </h1>
            <p className="text-xs sm:text-sm text-[#4d4632] max-w-3xl leading-relaxed">
              Verificación de existencias en tiempo real, fórmulas tintométricas certificadas y bloqueo preventivo de lotes para el proyecto{' '}
              <strong className="text-[#1f1b10] font-bold">
                {request?.id || 'PTC-2024-8924'} ({request?.client?.fullName || 'Andrés Cepeda'} - Bogotá)
              </strong>.
            </p>
          </div>

          {/* Action Buttons Top Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleSyncSap}
              disabled={isSyncingSap}
              className="px-3.5 py-2.5 bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] text-xs sm:text-sm font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              id="btnSyncSap"
            >
              <RefreshCw className={`w-4 h-4 text-[#2f5ea1] ${isSyncingSap ? 'animate-spin' : ''}`} />
              <span>{isSyncingSap ? 'Sincronizando...' : 'Actualizar SAP'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPolicyModal(true)}
              className="px-3.5 py-2.5 bg-[#f0e7d5] hover:bg-[#ebe2cf] text-[#1f1b10] text-xs sm:text-sm font-bold rounded-xl shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              id="btnDispatchPolicies"
            >
              <Truck className="w-4 h-4 text-[#7f765f]" />
              <span>Políticas de Despacho</span>
            </button>

            <button
              type="button"
              onClick={() => setShowActiveReservesModal(true)}
              className="px-4 py-2.5 bg-[#ffd100] text-[#0d4788] hover:bg-[#ffc800] text-xs sm:text-sm font-black rounded-xl shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              id="btnViewActiveReserves"
            >
              <BookmarkCheck className="w-4 h-4 text-[#0d4788]" />
              <span>Ver Reservas Activas</span>
              <span className="w-5 h-5 rounded-full bg-[#2f5ea1] text-white text-[11px] font-bold flex items-center justify-center ml-1">
                {reservedItems.length}
              </span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            LOGISTICS PERFORMANCE KPIS (4 CARDS)
            =================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Card 1: Disponibilidad Inmediata */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#ebe2cf] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-[#4d4632] font-bold">
                Disponibilidad Inmediata
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#f6eddb] flex items-center justify-center text-[#2f5ea1]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#1f1b10]">94.8%</span>
              <span className="text-xs text-[#2f5ea1] font-bold flex items-center">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" /> +2.4%
              </span>
            </div>
            <div className="w-full bg-[#f6eddb] rounded-full h-1.5 mt-3 overflow-hidden">
              <div className="bg-[#2f5ea1] h-full rounded-full" style={{ width: '94.8%' }}></div>
            </div>
            <span className="text-xs text-[#7f765f] mt-2">En 38 SKUs del portafolio técnico</span>
          </div>

          {/* Card 2: Bases Tintométricas */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#ebe2cf] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-[#4d4632] font-bold">
                Bases Tintométricas
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#ffd100]/25 flex items-center justify-center text-[#6f5a00]">
                <Palette className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#1f1b10]">4 / 4</span>
              <span className="text-xs text-[#4d4632] font-semibold">Calibradas</span>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2f5ea1]"></span>
              <span className="text-xs text-[#1f1b10] font-medium">
                Bases Pastel, Tint, Deep y Accent listas
              </span>
            </div>
            <span className="text-xs text-[#7f765f] mt-2">Precisión colorimétrica Delta-E &lt; 0.4</span>
          </div>

          {/* Card 3: Tránsito Promedio */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#ebe2cf] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-[#4d4632] font-bold">
                Tránsito Promedio
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#f6eddb] flex items-center justify-center text-[#2f5ea1]">
                <Timer className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#1f1b10]">4 - 6 h</span>
              <span className="text-xs text-[#7f765f] font-medium">Urbano Express</span>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-[#4d4632]">
              <span>Estándar: 24h</span>
              <span className="text-[#2f5ea1] font-bold">Flota CEDI Activa</span>
            </div>
            <span className="text-xs text-[#7f765f] mt-2">Cobertura Sabana de Bogotá y Cundinamarca</span>
          </div>

          {/* Card 4: Reservas Activas */}
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#ebe2cf] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-wider text-[#4d4632] font-bold">
                Reservas Activas
              </span>
              <div className="w-9 h-9 rounded-xl bg-[#ffd100] flex items-center justify-center text-[#0d4788]">
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-[#1f1b10]">12</span>
              <span className="text-xs text-[#2f5ea1] font-bold">Órdenes Protegidas</span>
            </div>
            <div className="flex items-center gap-1.5 mt-3">
              <Clock className="w-4 h-4 text-[#7f765f]" />
              <span className="text-xs text-[#1f1b10]">Bloqueo de lote garantizado x 48h</span>
            </div>
            <span className="text-xs text-[#7f765f] mt-2">Cero quiebres en proyectos vinculados</span>
          </div>
        </div>

        {/* ===================================================================
            SEARCH & DYNAMIC FILTERS BAR
            =================================================================== */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#ebe2cf] mb-8 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="lg:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f765f]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por SKU, Producto, Lote o Color (ej. Viniltex, 1024589, Salmón 248-A)..."
                className="w-full bg-[#f6eddb] pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#1f1b10] placeholder:text-[#7f765f] outline-none focus:bg-[#f0e7d5] transition-all font-medium border border-transparent focus:border-[#d1c6ab]"
              />
            </div>

            {/* Hub Selector */}
            <div className="lg:col-span-3">
              <div className="relative">
                <Warehouse className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f765f]" />
                <select
                  value={selectedHub}
                  onChange={(e) => setSelectedHub(e.target.value)}
                  className="w-full appearance-none bg-[#f6eddb] pl-10 pr-8 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#1f1b10] outline-none cursor-pointer border border-transparent focus:border-[#d1c6ab]"
                >
                  <option value="all">Todas las Sedes (Bogotá D.C.)</option>
                  <option value="funza">CEDI Central Bogotá Funza</option>
                  <option value="cll134">Tienda Pintuco Calle 134</option>
                  <option value="cll80">Centro de Pinturas Calle 80</option>
                  <option value="guarne">CEDI Medellín Guarne (Regional)</option>
                </select>
                <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-1/2 -translate-y-1/2 text-[#7f765f] pointer-events-none" />
              </div>
            </div>

            {/* Line Filter & Reset */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <div className="relative flex-1">
                <select
                  value={selectedLine}
                  onChange={(e) => setSelectedLine(e.target.value)}
                  className="w-full appearance-none bg-[#f6eddb] pl-3.5 pr-8 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#1f1b10] outline-none cursor-pointer border border-transparent focus:border-[#d1c6ab]"
                >
                  <option value="all">Línea Técnica</option>
                  <option value="arq">Arquitectónica Premium</option>
                  <option value="prep">Preparación Superficie</option>
                  <option value="imp">Impermeabilizantes</option>
                  <option value="acc">Herramientas & Accesorios</option>
                </select>
                <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-1/2 -translate-y-1/2 text-[#7f765f] pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedHub('all');
                  setSelectedLine('all');
                  setStatusFilter('all');
                  triggerToast('Filtros restablecidos');
                }}
                className="p-2.5 bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#4d4632] rounded-xl transition-colors cursor-pointer"
                title="Restablecer filtros"
              >
                <FilterX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chips de estado y semáforo */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#ebe2cf]/50">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#4d4632] font-semibold mr-1">Disponibilidad:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#2f5ea1] text-white shadow-xs font-bold'
                    : 'bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10]'
                }`}
              >
                Todos (38)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('disponible')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'disponible'
                    ? 'bg-[#2f5ea1] text-white shadow-xs font-bold'
                    : 'bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10]'
                }`}
              >
                En Stock &gt; 50
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('critico')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'critico'
                    ? 'bg-[#2f5ea1] text-white shadow-xs font-bold'
                    : 'bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10]'
                }`}
              >
                Bajo Stock (&lt; 15)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('tintometrico')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'tintometrico'
                    ? 'bg-[#2f5ea1] text-white shadow-xs font-bold'
                    : 'bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10]'
                }`}
              >
                Base Tintométrica
              </button>
            </div>

            {/* Semáforo de disponibilidad */}
            <div className="flex items-center gap-3 text-xs text-[#4d4632]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#107c41]"></span> Stock Óptimo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c98300]"></span> Stock Bajo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span> Reserva Exclusiva
              </span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            MAIN WORKSPACE: 2-COLUMN GRID (8 COLS vs 4 COLS)
            =================================================================== */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mb-10">
          {/* ===============================================================
              LEFT COLUMN: PRODUCT CATALOG & STOCK (8 Columns)
              =============================================================== */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#2f5ea1]" />
                <h2 className="text-xl font-black text-[#1f1b10]">
                  Referencias Asignables al Proyecto
                </h2>
              </div>
              <span className="text-xs bg-[#f0e7d5] px-3 py-1 rounded-full text-[#1f1b10] font-bold">
                {filteredProducts.length} referencias en foco
              </span>
            </div>

            {/* List of Products */}
            <div className="space-y-3" id="productGrid">
              {filteredProducts.map((product) => {
                const isCritical = product.status === 'critico';
                return (
                  <div
                    key={product.sku}
                    className="product-card bg-white rounded-2xl p-5 shadow-xs border border-[#ebe2cf] transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Product Thumbnail */}
                      <div className="w-16 h-16 rounded-xl bg-[#f6eddb] shrink-0 flex items-center justify-center p-1.5 relative overflow-hidden border border-[#d1c6ab]/40">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <span className="absolute bottom-0 inset-x-0 bg-[#ffd100] text-[#0d4788] text-[9px] font-black text-center py-0.5 uppercase tracking-wider">
                          {product.badge}
                        </span>
                      </div>

                      {/* Product Metadata */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-[#f6eddb] font-bold text-[#2f5ea1]">
                            SKU {product.sku}
                          </span>

                          {isCritical ? (
                            <span className="text-[11px] px-2 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] font-black flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping"></span>
                              Crítico
                            </span>
                          ) : (
                            <span className="text-[11px] px-2 py-0.5 rounded bg-[#e6f4ea] text-[#137333] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#137333]"></span>
                              Inmediato
                            </span>
                          )}

                          <span className="text-[11px] text-[#7f765f] font-medium">
                            Lote: {product.lot}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-[#1f1b10] truncate">
                          {product.name}
                        </h3>

                        <p className="text-xs text-[#4d4632] line-clamp-1">
                          {product.presentation}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-[#7f765f]">
                          <span>
                            CEDI Funza:{' '}
                            <strong className={`font-bold ${isCritical ? 'text-[#ba1a1a]' : 'text-[#1f1b10]'}`}>
                              {product.funzaCount} {product.unit}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Cll 134:{' '}
                            <strong className="text-[#1f1b10] font-bold">
                              {product.cll134Count} {product.unit}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            Cll 80:{' '}
                            <strong className="text-[#1f1b10] font-bold">
                              {product.cll80Count} {product.unit}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Numbers & Action Buttons */}
                    <div className="flex md:flex-col items-end justify-between md:justify-center gap-2.5 border-t md:border-t-0 pt-3 md:pt-0 border-[#ebe2cf]/50 shrink-0">
                      <div className="text-left md:text-right">
                        <div className={`text-2xl font-black ${isCritical ? 'text-[#ba1a1a]' : 'text-[#1f1b10]'}`}>
                          {product.totalStock}{' '}
                          <span className="text-xs font-semibold text-[#7f765f]">{product.unit}</span>
                        </div>
                        <span className="text-xs text-[#7f765f]">
                          {isCritical ? (
                            <strong className="text-[#ba1a1a] font-bold">¡Apartar prioritario!</strong>
                          ) : (
                            <>
                              Libres: <strong className="text-[#1f1b10]">{product.freeStock} {product.unit}</strong>
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStockModalProduct(product)}
                          className="px-3 py-1.5 bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Desglose Sedes
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStageItem(product)}
                          className="px-3.5 py-1.5 bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Apartar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alert Banner: Computer-Aided Tintometry */}
            <div className="bg-[#f6eddb] rounded-2xl p-5 flex items-start gap-4 shadow-xs border border-[#ebe2cf]">
              <div className="w-10 h-10 rounded-xl bg-[#ffd100] flex items-center justify-center text-[#0d4788] shrink-0">
                <Palette className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#1f1b10]">
                  Validación de Tintometría Asistida por Computador
                </h4>
                <p className="text-xs text-[#4d4632] leading-relaxed">
                  Los colores de la orden <strong className="text-[#1f1b10]">Salmón Terracota #248-A</strong> y{' '}
                  <strong className="text-[#1f1b10]">Blanco Lienzo #100-B</strong> se dispensan sobre las Bases Pastel y Cuartos en el dispensador volumétrico Giotto X-200. Se recomienda reservar las bases en la misma bodega para garantizar homogeneidad cromática de lote.
                </p>
              </div>
            </div>
          </div>

          {/* ===============================================================
              RIGHT COLUMN: FIXED / STICKY RESERVATION FORM (4 Columns)
              =============================================================== */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-md border border-[#ebe2cf] sticky top-24 flex flex-col">
              {/* Header of Reservation */}
              <div className="flex items-center justify-between pb-3 border-b border-[#ebe2cf]/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#2f5ea1] flex items-center justify-center text-white">
                    <BookmarkCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#2f5ea1] font-bold block">
                      Orden SAP Previa
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-[#1f1b10]">
                      ORD-RES-8924-BOG
                    </h3>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ffd100] font-black text-[#0d4788]">
                  Borrador
                </span>
              </div>

              {/* Project & Client Information */}
              <div className="bg-[#fcf3e0] rounded-xl p-3 my-3 space-y-1.5 border border-[#ebe2cf]/50">
                <div className="flex justify-between text-xs">
                  <span className="text-[#7f765f]">Proyecto Asignado:</span>
                  <span className="font-bold text-[#1f1b10]">{request?.id || 'PTC-2024-8924'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#7f765f]">Titular:</span>
                  <span className="font-bold text-[#1f1b10]">{request?.client?.fullName || 'Andrés Cepeda'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#7f765f]">Destino Obra:</span>
                  <span className="font-medium text-[#1f1b10] text-right truncate max-w-[180px]">
                    {request?.address || 'Usaquén, Calle 127 #11, Bogotá'}
                  </span>
                </div>
              </div>

              {/* Lot Blocking Timer (48h Guarantee) */}
              <div className="bg-[#f0e7d5] rounded-xl p-3 my-1 flex items-center justify-between border border-[#d1c6ab]/40">
                <div className="flex items-center gap-2 text-[#1f1b10]">
                  <Timer className="w-5 h-5 text-[#2f5ea1]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-[#2f5ea1]">
                      Bloqueo de Lote
                    </span>
                    <span className="text-xs font-semibold text-[#1f1b10]">Garantía activa por:</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-0.5 bg-white px-3 py-1 rounded-lg shadow-2xs border border-[#ebe2cf]">
                  <span className="text-lg font-black text-[#1f1b10]">
                    {hours.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs font-bold text-[#7f765f]">h</span>
                  <span className="text-lg font-black text-[#1f1b10] ml-1">
                    {mins.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs font-bold text-[#7f765f]">m</span>
                </div>
              </div>

              {/* Confirmed Items in Reservation */}
              <div className="space-y-2 my-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1f1b10]">
                    Ítems Confirmados en Reserva:
                  </span>
                  <button
                    type="button"
                    onClick={handleClearReservedList}
                    className="text-xs text-[#2f5ea1] font-bold hover:underline cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {reservedItems.length === 0 ? (
                    <p className="text-xs text-[#7f765f] p-3 text-center bg-[#f6eddb] rounded-xl">
                      No hay productos en lista. Haz clic en "Apartar" sobre las referencias del catálogo.
                    </p>
                  ) : (
                    reservedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 bg-[#f6eddb] rounded-xl flex items-center justify-between text-xs border border-[#ebe2cf]/50 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.colorHex ? (
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                              style={{ backgroundColor: item.colorHex }}
                              title={item.detail}
                            ></span>
                          ) : (
                            <Package className="w-3.5 h-3.5 text-[#2f5ea1] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-[#1f1b10] truncate">{item.name}</p>
                            <span className="text-[11px] text-[#7f765f] block truncate">
                              {item.detail}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-bold text-[#2f5ea1] text-[11px]">
                            {item.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveReservedItem(item.id)}
                            className="text-[#7f765f] hover:text-[#ba1a1a] transition-colors p-0.5 cursor-pointer"
                            title="Eliminar de reserva"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Logistics Mode Selection */}
              <div className="space-y-1.5 my-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7f765f]">
                  Modalidad Logística
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMode('delivery');
                      triggerToast('Modalidad: Despacho Directo a Obra asignado', 'truck');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                      deliveryMode === 'delivery'
                        ? 'bg-[#2f5ea1] text-white shadow-xs font-black'
                        : 'bg-[#f6eddb] text-[#1f1b10] hover:bg-[#f0e7d5]'
                    }`}
                  >
                    Despacho Directo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMode('pickup');
                      triggerToast('Modalidad: Retiro en Tienda habilitado', 'store');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold text-center transition-all cursor-pointer ${
                      deliveryMode === 'pickup'
                        ? 'bg-[#2f5ea1] text-white shadow-xs font-black'
                        : 'bg-[#f6eddb] text-[#1f1b10] hover:bg-[#f0e7d5]'
                    }`}
                  >
                    Retiro en Tienda
                  </button>
                </div>
              </div>

              {/* Sede de Origen / Despacho */}
              <div className="space-y-1 my-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#7f765f]">
                  Sede de Origen / Despacho
                </label>
                <div className="relative">
                  <select
                    value={dispatchHub}
                    onChange={(e) => {
                      setDispatchHub(e.target.value);
                      triggerToast('Sede de despacho actualizada');
                    }}
                    className="w-full appearance-none bg-[#f6eddb] pl-3 pr-8 py-2.5 rounded-xl text-xs font-semibold text-[#1f1b10] outline-none cursor-pointer border border-[#d1c6ab]/40"
                  >
                    <option value="funza">CEDI Funza Bogotá (Entrega en 24h a Obra)</option>
                    <option value="cll134">Tienda Pintuco Calle 134 (Retiro Inmediato)</option>
                    <option value="cll80">Centro de Pinturas Calle 80 (Retiro Express)</option>
                  </select>
                  <ChevronRight className="w-4 h-4 rotate-90 absolute right-3 top-1/2 -translate-y-1/2 text-[#7f765f] pointer-events-none" />
                </div>
                <p className="text-xs text-[#2f5ea1] font-semibold flex items-center gap-1.5 pt-1">
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span>Entrega estimada: Mañana antes de las 11:30 AM</span>
                </p>
              </div>

              {/* Actions Button */}
              <div className="space-y-2 pt-3 mt-2 border-t border-[#ebe2cf]/50">
                <button
                  type="button"
                  onClick={handleConfirmReservation}
                  disabled={isConfirmingRes || isReservedSuccess}
                  className={`w-full py-3 rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isReservedSuccess
                      ? 'bg-[#137333] text-white'
                      : 'bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788]'
                  }`}
                  id="btnConfirmReservation"
                >
                  {isConfirmingRes ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registrando en SAP...</span>
                    </>
                  ) : isReservedSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                      <span>¡Reserva Bloqueada con Éxito!</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#0d4788]" />
                      <span>Confirmar Reserva de Stock</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => triggerToast('Modo edición de cantidades de obra habilitado')}
                  className="w-full py-2 bg-transparent hover:bg-[#f6eddb] text-[#7f765f] hover:text-[#1f1b10] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Modificar Cantidades de Obra
                </button>
              </div>

              {/* Disclaimer */}
              <div className="mt-3 p-2.5 rounded-xl bg-[#fcf3e0] text-center text-[11px] text-[#7f765f] border border-[#ebe2cf]/50">
                Al confirmar, el sistema emite el bloqueo físico en SAP R/3 y notifica al transportador asignado.
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            SUPPLY NETWORK & WAREHOUSES IN BOGOTÁ (3 CARDS)
            =================================================================== */}
        <div className="mt-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-[#2f5ea1]" />
                <h2 className="text-xl sm:text-2xl font-black text-[#1f1b10]">
                  Red de Suministro y Almacenes Técnicos Bogotá D.C.
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#4d4632]">
                Puntos de stock verificado para carga pesada, dispensado computarizado y entrega express.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3.5 py-1.5 bg-[#f6eddb] font-bold rounded-full text-[#1f1b10] border border-[#d1c6ab]/40">
                3 Centros Operativos en Sabana de Bogotá
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: CEDI Central Bogotá Funza */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-[#ebe2cf] flex flex-col justify-between transition-all hover:shadow-md">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] px-2.5 py-0.5 rounded bg-[#f6eddb] font-bold text-[#2f5ea1]">
                    CEDI Principal
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-[#137333] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#137333]"></span> Abierto
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#1f1b10]">CEDI Central Funza</h3>
                <p className="text-xs text-[#7f765f] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2f5ea1] shrink-0" />
                  <span>Calle 17 # 68D, Parque Industrial San Carlos</span>
                </p>

                <div className="bg-[#fcf3e0] rounded-xl p-3 space-y-1.5 text-xs border border-[#ebe2cf]/50">
                  <div className="flex justify-between">
                    <span className="text-[#7f765f]">Capacidad Total Bogotá:</span>
                    <span className="font-bold text-[#1f1b10]">1,240 Galones en bodega</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f765f]">Horario Operativo:</span>
                    <span className="font-medium text-[#1f1b10]">07:00 AM - 06:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f765f]">Despacho Flota:</span>
                    <span className="text-[#2f5ea1] font-bold">Despacho Express Habilitado</span>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-0">
                <div
                  className="w-full h-32 bg-[#f6eddb] rounded-xl bg-cover bg-center mb-3 shadow-inner border border-black/5"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDXpGbAd0jI_AIylGf8z4naEAHa76XXpnOSJzwerDVrF9lOgq0bzcXKnQapIF8KBDco7uwcocYdW3FYc0l5lx-cOUsUwMD-18g9P6C7nG0U4QqHpE8t0xrrhaGkwHIse1Z7qmXyF977Bjmo7fp5GURbSelQXxvOv27qlpwWhHo3JzW69gkIKE9bQbzWvasEv04AwzX8RzPc1Mh88KrV8DBcikvdy4y_5-DHzibd_GWt6dm5Ew8y8k-QkQ')`,
                  }}
                ></div>
                <button
                  type="button"
                  onClick={() => {
                    setDispatchHub('funza');
                    triggerToast('CEDI Funza asignado como Sede de Despacho Principal');
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    dispatchHub === 'funza'
                      ? 'bg-[#2f5ea1] text-white shadow-xs'
                      : 'bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10]'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{dispatchHub === 'funza' ? 'Sede de Despacho Activa' : 'Asignar como Sede de Despacho'}</span>
                </button>
              </div>
            </div>

            {/* Card 2: Tienda Especializada Calle 134 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-[#ebe2cf] flex flex-col justify-between transition-all hover:shadow-md">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] px-2.5 py-0.5 rounded bg-[#f6eddb] font-bold text-[#2f5ea1]">
                    Centro de Color
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-[#137333] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#137333]"></span> Abierto
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#1f1b10]">Tienda Pintuco Calle 134</h3>
                <p className="text-xs text-[#7f765f] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2f5ea1] shrink-0" />
                  <span>Calle 134 # 19-35, Usaquén, Bogotá</span>
                </p>

                <div className="bg-[#fcf3e0] rounded-xl p-3 space-y-1.5 text-xs border border-[#ebe2cf]/50">
                  <div className="flex justify-between">
                    <span className="text-[#7f765f]">Capacidad Total Norte:</span>
                    <span className="font-bold text-[#1f1b10]">340 Galones disponibles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f765f]">Tintometría Giotto:</span>
                    <span className="text-[#2f5ea1] font-bold">Dispensado Inmediato</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f765f]">Distancia a Obra:</span>
                    <span className="font-bold text-[#137333]">2.8 km (12 mins)</span>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-0">
                <div
                  className="w-full h-32 bg-[#f6eddb] rounded-xl bg-cover bg-center mb-3 shadow-inner border border-black/5"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB4KanReloyJ-KJD4y1Q_poJzyCS2ON1jOiMinUF3kCjPCliOekiF_C33XwE0dUg-X6eT1xNZ5aysHIInWT0AhtlYm9wCoOAebn9SLfCw0C-BcWvSmqjS_3rM8OchCULuyZEOfjTLD03DOmk0ozr0mnIULP6cGMjFLsEPCzn0Oy393HRSxumDjxKDWH4E9tg5U2WNOlJS5nUQrJyJ4EoSWRvQjF2qH3jXafx1WXzIUemb-X4eiSmnL3iA')`,
                  }}
                ></div>
                <button
                  type="button"
                  onClick={() => {
                    setDispatchHub('cll134');
                    triggerToast('Tienda Calle 134 asignada para Retiro Directo');
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    dispatchHub === 'cll134'
                      ? 'bg-[#2f5ea1] text-white shadow-xs'
                      : 'bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10]'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>{dispatchHub === 'cll134' ? 'Sede de Retiro Activa' : 'Asignar para Retiro Directo'}</span>
                </button>
              </div>
            </div>

            {/* Card 3: Tienda Pintuco Calle 80 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-[#ebe2cf] flex flex-col justify-between transition-all hover:shadow-md">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] px-2.5 py-0.5 rounded bg-[#f6eddb] font-bold text-[#2f5ea1]">
                    Bodega Vehicular
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-[#137333] font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#137333]"></span> Abierto
                  </span>
                </div>
                <h3 className="text-lg font-black text-[#1f1b10]">Centro Pinturas Calle 80</h3>
                <p className="text-xs text-[#7f765f] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2f5ea1] shrink-0" />
                  <span>Autopista Medellín km 1.5, Vía Siberia</span>
                </p>

                <div className="bg-[#fcf3e0] rounded-xl p-3 space-y-1.5 text-xs border border-[#ebe2cf]/50">
                  <div className="flex justify-between">
                    <span className="text-[#7f765f]">Capacidad Total Occidente:</span>
                    <span className="font-bold text-[#1f1b10]">520 Galones disponibles</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f765f]">Carga Vehicular:</span>
                    <span className="text-[#2f5ea1] font-bold">Muelle de Carga Rápida</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f765f]">Horario Operativo:</span>
                    <span className="font-medium text-[#1f1b10]">07:30 AM - 05:30 PM</span>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-5 pt-0">
                <div
                  className="w-full h-32 bg-[#f6eddb] rounded-xl bg-cover bg-center mb-3 shadow-inner border border-black/5"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCxuhI8aDJQKr9IbPrE-9YQX5CM9pIHckeDvEl4i3eBOyxHlc-uHFfaWpDHZ0wJzm0q4YDEkoiZts7UbaF-yTV1PmSwt7zjZ9MG5eyd5rM3bnzdkYcK6RY8IKW5-It0QhUnqc0jW_Csh7NBsi2GKQhx3S5jumPDQSJ1JaL3eQiBKgfBuTMqUkt7y5wVR9e8YMUE_qj6MeqF3QOf7JXS39FnAwxVQRnwGXSJmvHfkuQ4yU1jZasE58tY-Q')`,
                  }}
                ></div>
                <button
                  type="button"
                  onClick={() => {
                    setDispatchHub('cll80');
                    triggerToast('Centro Calle 80 asignado como Sede de Retiro');
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    dispatchHub === 'cll80'
                      ? 'bg-[#2f5ea1] text-white shadow-xs'
                      : 'bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10]'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>{dispatchHub === 'cll80' ? 'Sede de Retiro Activa' : 'Asignar como Sede de Retiro'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ===================================================================
          MODAL: DESGLOSE MULTISEDE DE PRODUCTO
          =================================================================== */}
      {selectedStockModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-[#ebe2cf] animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd100] flex items-center justify-center text-[#0d4788]">
                  <Package className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#1f1b10]">
                    {selectedStockModalProduct.name}
                  </h3>
                  <span className="text-xs text-[#7f765f]">
                    SKU: {selectedStockModalProduct.sku} • Total {selectedStockModalProduct.totalStock} {selectedStockModalProduct.unit}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStockModalProduct(null)}
                className="p-1.5 rounded-xl hover:bg-[#f6eddb] text-[#7f765f] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="p-3.5 bg-[#f6eddb] rounded-2xl flex items-center justify-between border border-[#ebe2cf]">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                    CEDI Central Bogotá (Funza)
                  </span>
                  <p className="text-[11px] text-[#7f765f]">Calle 17 # 68D • Muelle 4</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#1f1b10]">
                    {selectedStockModalProduct.funzaCount}
                  </span>
                  <span className="text-[11px] text-[#7f765f] block">
                    {selectedStockModalProduct.unit}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#f6eddb] rounded-2xl flex items-center justify-between border border-[#ebe2cf]">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                    Tienda Pintuco Calle 134
                  </span>
                  <p className="text-[11px] text-[#7f765f]">Calle 134 # 19-35 • Tintometría Giotto</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#1f1b10]">
                    {selectedStockModalProduct.cll134Count}
                  </span>
                  <span className="text-[11px] text-[#7f765f] block">
                    {selectedStockModalProduct.unit}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-[#f6eddb] rounded-2xl flex items-center justify-between border border-[#ebe2cf]">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-bold text-[#1f1b10]">
                    Centro de Pinturas Calle 80
                  </span>
                  <p className="text-[11px] text-[#7f765f]">Autopista Medellín km 1.5 • Carga Pesada</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-[#1f1b10]">
                    {selectedStockModalProduct.cll80Count}
                  </span>
                  <span className="text-[11px] text-[#7f765f] block">
                    {selectedStockModalProduct.unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ebe2cf]/60">
              <button
                type="button"
                onClick={() => setSelectedStockModalProduct(null)}
                className="px-5 py-2.5 bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: POLÍTICAS DE DESPACHO
          =================================================================== */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-[#ebe2cf] animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d6e3ff] flex items-center justify-center text-[#001b3d]">
                  <Truck className="w-5 h-5 text-[#2f5ea1]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1f1b10]">
                    Políticas de Despacho y Logística CEDI
                  </h3>
                  <span className="text-xs text-[#7f765f]">Manual Operativo Pintuco Colombia</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#f6eddb] text-[#7f765f] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#4d4632] leading-relaxed">
              <div className="p-3 bg-[#fcf3e0] rounded-xl border border-[#ebe2cf]">
                <strong className="text-[#1f1b10] block mb-0.5">1. Despacho Urbano Express (Bogotá & Sabana)</strong>
                Entregas confirmadas antes de las 12:00 PM se programan con ventana de entrega el mismo día o primera hora del día hábil siguiente (4 a 6 horas).
              </div>
              <div className="p-3 bg-[#fcf3e0] rounded-xl border border-[#ebe2cf]">
                <strong className="text-[#1f1b10] block mb-0.5">2. Bloqueo de Lote Tintométrico</strong>
                Toda reserva de bases colorimétricas queda protegida físicamente durante 48 horas continuas. Vencido el plazo sin pago o confirmación de obra, el stock se libera en SAP R/3.
              </div>
              <div className="p-3 bg-[#fcf3e0] rounded-xl border border-[#ebe2cf]">
                <strong className="text-[#1f1b10] block mb-0.5">3. Garantía de Calidad y Cero Derrames</strong>
                Flota especializada con sujeción antivuelco, empaques precintados de fábrica y certificado de lote físico adjunto a la remisión.
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="px-5 py-2.5 bg-[#ffd100] text-[#0d4788] rounded-xl text-xs font-black cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: VER RESERVAS ACTIVAS
          =================================================================== */}
      {showActiveReservesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-[#ebe2cf] animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd100] flex items-center justify-center text-[#0d4788]">
                  <BookmarkCheck className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1f1b10]">
                    Reservas Activas • Proyecto {request?.id || 'PTC-2024-8924'}
                  </h3>
                  <span className="text-xs text-[#7f765f]">
                    {reservedItems.length} referencias protegidas en SAP
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActiveReservesModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#f6eddb] text-[#7f765f] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {reservedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#fcf3e0] rounded-xl flex items-center justify-between text-xs border border-[#ebe2cf]"
                >
                  <div className="flex items-center gap-3">
                    {item.colorHex ? (
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-black/10"
                        style={{ backgroundColor: item.colorHex }}
                      ></span>
                    ) : (
                      <Package className="w-4 h-4 text-[#2f5ea1] shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-[#1f1b10]">{item.name}</p>
                      <span className="text-[11px] text-[#7f765f]">{item.detail}</span>
                    </div>
                  </div>
                  <span className="font-bold text-[#2f5ea1] bg-white px-2 py-0.5 rounded-md shadow-2xs">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#ebe2cf]/60">
              <span className="text-xs text-[#7f765f]">
                Garantía activa por <strong>{hours}h {mins}m</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowActiveReservesModal(false)}
                className="px-5 py-2.5 bg-[#ffd100] text-[#0d4788] rounded-xl text-xs font-black cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
