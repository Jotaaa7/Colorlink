import React, { useState, useEffect } from 'react';
import { UserProfile, DirectCartItem, DirectOrder } from '../types';
import { PINTUCO_CATALOG, PintucoCatalogItem } from '../data/pintucoProducts';
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  Filter,
  Package,
  Plus,
  Minus,
  Trash2,
  Check,
  CreditCard,
  Building2,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  FileText,
  Palette,
  ExternalLink,
  MessageCircle,
  Download,
  AlertCircle,
  Sparkles,
  ChevronRight,
  BadgePercent,
  MapPin,
  Lock,
  Phone,
  Mail,
  User,
} from 'lucide-react';
import { ColorSelectorModal, ColorSelectionResult } from './ColorSelectorModal';

interface DirectStoreScreenProps {
  currentUser: UserProfile | null;
  onOpenLogin: () => void;
  onNavigateToRequest: () => void;
  onNavigateToProjectStatus: () => void;
  externalOpenCartTrigger?: boolean;
}

// Preset color options for quick color selection in store
const STORE_PRESET_COLORS = [
  { name: 'Blanco Lienzo', hex: '#f7f5ed', code: '100-B' },
  { name: 'Salmón Terracota', hex: '#df8c72', code: '248-A' },
  { name: 'Gris Urbano', hex: '#8c9297', code: '310-G' },
  { name: 'Verde Salvia', hex: '#7d8c7c', code: '155-V' },
  { name: 'Mostaza Colonial', hex: '#d4a03e', code: '218-M' },
  { name: 'Azul Zafiro', hex: '#254b80', code: '405-Z' },
  { name: 'Blanco Puro', hex: '#ffffff', code: '001-B' },
  { name: 'Negro Grafito', hex: '#2b2b2b', code: '900-N' },
];

export const DirectStoreScreen: React.FC<DirectStoreScreenProps> = ({
  currentUser,
  onOpenLogin,
  onNavigateToRequest,
  onNavigateToProjectStatus,
  externalOpenCartTrigger,
}) => {
  // Store navigation & views
  const [storeTab, setStoreTab] = useState<'catalog' | 'my_orders'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  // Cart State (persisted in localStorage)
  const [cartItems, setCartItems] = useState<DirectCartItem[]>(() => {
    try {
      const saved = localStorage.getItem('colorlink_direct_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders History State (persisted in localStorage)
  const [ordersHistory, setOrdersHistory] = useState<DirectOrder[]>(() => {
    try {
      const saved = localStorage.getItem('colorlink_direct_orders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // UI Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductSpec, setSelectedProductSpec] = useState<PintucoCatalogItem | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<DirectOrder | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Per-product selection state maps (SKU -> state)
  const [productPresentations, setProductPresentations] = useState<Record<string, 'Cuarto (1/4 Gal)' | 'Galón (1 Gal)' | 'Caneca (5 Gal)' | 'Unidad / Kit'>>({});
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  const [productSelectedColors, setProductSelectedColors] = useState<Record<string, { name: string; hex: string; code: string }>>({});

  // Color modal target for custom color wheel
  const [customColorModalSku, setCustomColorModalSku] = useState<string | null>(null);

  // Sync external open cart trigger
  useEffect(() => {
    if (externalOpenCartTrigger) {
      setIsCartOpen(true);
    }
  }, [externalOpenCartTrigger]);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('colorlink_direct_cart', JSON.stringify(cartItems));
      window.dispatchEvent(new CustomEvent('colorlink_cart_change'));
    } catch (e) {
      console.warn('Could not save cart in localStorage', e);
    }
  }, [cartItems]);

  // Persist orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('colorlink_direct_orders', JSON.stringify(ordersHistory));
    } catch (e) {
      console.warn('Could not save orders in localStorage', e);
    }
  }, [ordersHistory]);

  const triggerToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => {
      setNotificationToast(null);
    }, 3500);
  };

  // Categories list
  const categories = [
    'Todas',
    'Arquitectónica',
    'Construcción',
    'Metal',
    'Madera',
    'Industrial y Alto Desempeño',
    'Herramientas y Accesorios',
  ];

  // Presentation multiplier and price logic
  const getPresentationMultiplier = (pres: string) => {
    switch (pres) {
      case 'Cuarto (1/4 Gal)':
        return 0.32;
      case 'Caneca (5 Gal)':
        return 4.6; // 8% bulk discount compared to 5 separate gallons
      case 'Unidad / Kit':
      case 'Galón (1 Gal)':
      default:
        return 1.0;
    }
  };

  const getProductPrice = (item: PintucoCatalogItem, pres: string) => {
    if (item.category === 'Herramientas y Accesorios') {
      return item.priceCOP;
    }
    const mult = getPresentationMultiplier(pres);
    return Math.round(item.priceCOP * mult);
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filtered Catalog
  const filteredCatalog = PINTUCO_CATALOG.filter((item) => {
    const matchesCategory =
      selectedCategory === 'Todas' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Presentation getter & setter helpers
  const getSelectedPresentation = (item: PintucoCatalogItem) => {
    if (item.category === 'Herramientas y Accesorios') {
      return 'Unidad / Kit';
    }
    return productPresentations[item.sku] || 'Galón (1 Gal)';
  };

  const setSelectedPresentation = (sku: string, pres: 'Cuarto (1/4 Gal)' | 'Galón (1 Gal)' | 'Caneca (5 Gal)' | 'Unidad / Kit') => {
    setProductPresentations((prev) => ({ ...prev, [sku]: pres }));
  };

  const getProductQty = (sku: string) => productQuantities[sku] || 1;
  const setProductQty = (sku: string, qty: number) => {
    setProductQuantities((prev) => ({ ...prev, [sku]: Math.max(1, qty) }));
  };

  const getProductColor = (sku: string) => {
    return productSelectedColors[sku] || STORE_PRESET_COLORS[0];
  };

  const setProductColor = (sku: string, color: { name: string; hex: string; code: string }) => {
    setProductSelectedColors((prev) => ({ ...prev, [sku]: color }));
  };

  // Add to cart handler
  const handleAddToCart = (item: PintucoCatalogItem, openCartAfter = false) => {
    const pres = getSelectedPresentation(item);
    const qty = getProductQty(item.sku);
    const unitPrice = getProductPrice(item, pres);
    const color = item.hasColors ? getProductColor(item.sku) : undefined;
    const cartItemId = `${item.sku}-${pres}-${color ? color.code : 'std'}`;

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((it) => it.id === cartItemId);
      if (existingIdx >= 0) {
        const copy = [...prev];
        const updatedQty = copy[existingIdx].quantity + qty;
        copy[existingIdx] = {
          ...copy[existingIdx],
          quantity: updatedQty,
          totalCOP: updatedQty * unitPrice,
        };
        return copy;
      } else {
        const newCartItem: DirectCartItem = {
          id: cartItemId,
          sku: item.sku,
          name: item.name,
          category: item.category,
          image: item.image,
          presentation: pres,
          quantity: qty,
          unitPriceCOP: unitPrice,
          totalCOP: qty * unitPrice,
          hasColors: item.hasColors,
          selectedColorName: color?.name,
          selectedColorHex: color?.hex,
          selectedColorCode: color?.code,
        };
        return [newCartItem, ...prev];
      }
    });

    triggerToast(`"${item.name}" añadido al carrito (${qty} ${pres})`);
    if (openCartAfter) {
      setIsCartOpen(true);
    }
  };

  // Direct Buy (1-Click) handler: adds and triggers checkout immediately
  const handleBuyNow = (item: PintucoCatalogItem) => {
    handleAddToCart(item, false);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  // Update item qty in cart
  const handleUpdateCartQty = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.id === id) {
            const newQty = Math.max(1, it.quantity + delta);
            return {
              ...it,
              quantity: newQty,
              totalCOP: newQty * it.unitPriceCOP,
            };
          }
          return it;
        })
        .filter((it) => it.quantity > 0)
    );
  };

  // Remove from cart
  const handleRemoveFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
    triggerToast('Producto eliminado del carrito');
  };

  // Cart financial summary
  const subtotalCOP = cartItems.reduce((acc, it) => acc + it.totalCOP, 0);
  const promoDiscountCOP = Math.round(subtotalCOP * 0.05); // 5% direct store launch promo
  const baseTaxableCOP = subtotalCOP - promoDiscountCOP;
  const taxCOP = Math.round(baseTaxableCOP * 0.19);
  // Free shipping over $150,000 COP
  const shippingCostCOP = subtotalCOP >= 150000 || subtotalCOP === 0 ? 0 : 18000;
  const totalPayableCOP = baseTaxableCOP + taxCOP + shippingCostCOP;
  const totalCartCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  // Checkout form state
  const [checkoutName, setCheckoutName] = useState(currentUser?.fullName || '');
  const [checkoutDocType, setCheckoutDocType] = useState(currentUser?.documentType || 'Cédula de Ciudadanía');
  const [checkoutDocNumber, setCheckoutDocNumber] = useState(currentUser?.documentNumber || '');
  const [checkoutEmail, setCheckoutEmail] = useState(currentUser?.email || '');
  const [checkoutPhone, setCheckoutPhone] = useState(currentUser?.phone || '');
  const [checkoutCity, setCheckoutCity] = useState(currentUser?.city || 'Bogotá DC');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutDetails, setCheckoutDetails] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'PSE' | 'Tarjeta de Crédito' | 'Contraentrega'>('PSE');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Pre-fill user data if user logs in later
  useEffect(() => {
    if (currentUser) {
      if (!checkoutName) setCheckoutName(currentUser.fullName);
      if (!checkoutEmail) setCheckoutEmail(currentUser.email);
      if (!checkoutPhone) setCheckoutPhone(currentUser.phone);
      if (!checkoutDocNumber) setCheckoutDocNumber(currentUser.documentNumber);
      if (!checkoutCity) setCheckoutCity(currentUser.city);
    }
  }, [currentUser]);

  // Execute Checkout & Generate Direct Order
  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!checkoutName || !checkoutAddress || !checkoutPhone) {
      triggerToast('Por favor completa los campos de nombre, dirección y celular');
      return;
    }

    setIsProcessingCheckout(true);

    setTimeout(() => {
      const randomOrderNum = Math.floor(1000 + Math.random() * 9000);
      const randomSapNum = Math.floor(700000 + Math.random() * 99999);
      const newOrder: DirectOrder = {
        orderId: `PED-DIR-${new Date().getFullYear()}-${randomOrderNum}`,
        sapOrderNumber: `SAP-SO-${randomSapNum}`,
        createdAt: new Date().toISOString(),
        items: [...cartItems],
        customer: {
          fullName: checkoutName,
          documentType: checkoutDocType,
          documentNumber: checkoutDocNumber || '22091482',
          email: checkoutEmail || 'cliente@pintuco.com',
          phone: checkoutPhone,
        },
        shipping: {
          city: checkoutCity,
          address: checkoutAddress,
          details: checkoutDetails,
          estimatedDeliveryHours: 24,
          shippingCostCOP,
        },
        paymentMethod: checkoutPaymentMethod,
        subtotalCOP,
        taxCOP,
        shippingCOP: shippingCostCOP,
        totalCOP: totalPayableCOP,
        status: 'Confirmado',
      };

      setOrdersHistory((prev) => [newOrder, ...prev]);
      setConfirmedOrder(newOrder);
      setCartItems([]);
      setIsProcessingCheckout(false);
      setIsCheckoutOpen(false);
      triggerToast(`¡Pedido ${newOrder.orderId} emitido exitosamente!`);
    }, 1200);
  };

  // Color modal selection applied to catalog item
  const handleApplyCustomColor = (result: ColorSelectionResult) => {
    if (!customColorModalSku) return;
    setProductColor(customColorModalSku, {
      name: result.name,
      hex: result.hex,
      code: result.code,
    });
    setCustomColorModalSku(null);
    triggerToast(`Tono personalizado "${result.name}" aplicado`);
  };

  return (
    <div className="min-h-screen bg-[#fff8f0] text-[#1f1b10] py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1f1b10] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#ffd100]/30 text-xs sm:text-sm font-bold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-[#ffd100]" />
          <span>{notificationToast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ================= HERO / STORE BANNER ================= */}
        <div className="relative bg-gradient-to-br from-[#1f1b10] via-[#2f2715] to-[#121008] text-white rounded-3xl p-6 sm:p-10 shadow-xl overflow-hidden border border-[#d1c6ab]/20">
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-[#ffd100]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-10 bottom-0 w-64 h-40 bg-[#2f5ea1]/20 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#ffd100] text-[#0d4788] text-xs font-black uppercase tracking-wider shadow-xs flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Tienda Oficial Pintuco Express</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-semibold backdrop-blur-xs border border-white/15">
                  Compra Directa Sin Proyecto
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight text-white">
                Adquiere Pinturas, Recubrimientos & Herramientas de Fábrica
              </h1>

              <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-xl">
                ¿Solo necesitas pintura, esmaltes o herramientas para tu obra o casa? Compra directamente sin necesidad de formular diagnósticos ni radicar proyectos técnicos. Despacho express desde el CEDI más cercano.
              </p>

              {/* Trust Badges */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-white/90">
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#ffd100]" />
                  <span>Envío Gratis desde $150.000 COP</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#86efac]" />
                  <span>Garantía de Fábrica Pintuco</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#ffd100]" />
                  <span>Entrega en 24 a 48 Horas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#93c5fd]" />
                  <span>PSE, Tarjeta y Contraentrega</span>
                </div>
              </div>
            </div>

            {/* Quick Cart & View Toggle Widget */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="px-6 py-4 rounded-2xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] font-black text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-between gap-4 cursor-pointer"
                id="btn-store-view-cart"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5 text-[#0d4788]" />
                    {totalCartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#ba1a1a] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                        {totalCartCount}
                      </span>
                    )}
                  </div>
                  <span>Mi Carrito</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold block opacity-80">
                    {totalCartCount} {totalCartCount === 1 ? 'producto' : 'productos'}
                  </span>
                  <span className="text-sm font-black font-mono">
                    {formatCOP(totalPayableCOP)}
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/15">
                <button
                  type="button"
                  onClick={() => setStoreTab('catalog')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    storeTab === 'catalog'
                      ? 'bg-white text-[#1f1b10] shadow-xs'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Catálogo ({filteredCatalog.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStoreTab('my_orders')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    storeTab === 'my_orders'
                      ? 'bg-white text-[#1f1b10] shadow-xs'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  <span>Mis Pedidos</span>
                  {ordersHistory.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#ffd100] text-[#0d4788] rounded-full text-[10px] font-black">
                      {ordersHistory.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TAB 1: PRODUCT CATALOG ================= */}
        {storeTab === 'catalog' && (
          <div className="space-y-6">
            {/* Search and Category Filter Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#ebe2cf] shadow-xs flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7f765f]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre (ej: Viniltex, Koraza, Pintulux), SKU o aplicación..."
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
                        ? 'bg-[#ffd100] text-[#0d4788] shadow-xs'
                        : 'bg-[#f6eddb] text-[#4d4632] hover:bg-[#ebe2cf]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCatalog.map((prod) => {
                const currentPres = getSelectedPresentation(prod);
                const currentQty = getProductQty(prod.sku);
                const currentPrice = getProductPrice(prod, currentPres);
                const currentColor = prod.hasColors ? getProductColor(prod.sku) : undefined;
                const isTool = prod.category === 'Herramientas y Accesorios';

                return (
                  <div
                    key={prod.sku}
                    className="bg-white rounded-3xl border border-[#ebe2cf] overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Product Image & Badges */}
                      <div className="relative h-48 bg-[#1f1b10] overflow-hidden group">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"></div>

                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-lg bg-white/95 text-[#1f1b10] text-[10px] font-black uppercase tracking-wider backdrop-blur-xs shadow-xs">
                            {prod.category}
                          </span>
                          {prod.hasColors && (
                            <span className="px-2 py-0.5 rounded-md bg-[#ffd100] text-[#0d4788] text-[10px] font-bold">
                              Tinturable
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex items-baseline justify-between text-white">
                          <span className="font-mono text-xs font-bold text-[#ffe07f]">
                            SKU: {prod.sku}
                          </span>
                          <span className="text-lg font-black font-mono text-white">
                            {formatCOP(currentPrice)}
                            <span className="text-[10px] font-normal text-white/80 ml-1">
                              / {currentPres.split(' ')[0]}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Product Content Details */}
                      <div className="p-5 space-y-4">
                        <div>
                          <h3 className="text-base font-black text-[#1f1b10] leading-snug">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-[#4d4632] mt-1 line-clamp-2 leading-relaxed">
                            {prod.description}
                          </p>
                        </div>

                        {/* Presentation Selector */}
                        {!isTool ? (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-bold text-[#725c00] uppercase tracking-wider block">
                              Selecciona Presentación:
                            </span>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(['Cuarto (1/4 Gal)', 'Galón (1 Gal)', 'Caneca (5 Gal)'] as const).map(
                                (pres) => (
                                  <button
                                    key={pres}
                                    type="button"
                                    onClick={() => setSelectedPresentation(prod.sku, pres)}
                                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all text-center border cursor-pointer ${
                                      currentPres === pres
                                        ? 'bg-[#ffd100] text-[#0d4788] border-[#ffd100] shadow-xs'
                                        : 'bg-[#fcf3e0] text-[#4d4632] border-[#ebe2cf] hover:bg-[#f6eddb]'
                                    }`}
                                  >
                                    <span>{pres.split(' ')[0]}</span>
                                    <span className="block text-[9px] font-normal opacity-85">
                                      {pres.includes('1/4') ? '0.25 Gal' : pres.includes('5') ? '5 Gal (-8%)' : '1 Gal'}
                                    </span>
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-[#fcf3e0] text-xs font-semibold text-[#725c00] flex items-center justify-between">
                            <span>Presentación:</span>
                            <strong className="text-[#1f1b10]">Kit Completo de Aplicación</strong>
                          </div>
                        )}

                        {/* Color Selector for Tintable Products */}
                        {prod.hasColors && (
                          <div className="space-y-2 p-3 rounded-2xl bg-[#fcf3e0] border border-[#ebe2cf]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#1f1b10] flex items-center gap-1.5">
                                <Palette className="w-3.5 h-3.5 text-[#2f5ea1]" />
                                <span>Color Seleccionado:</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setCustomColorModalSku(prod.sku)}
                                className="text-[11px] font-bold text-[#2f5ea1] hover:underline cursor-pointer"
                              >
                                Rueda de Color & Código →
                              </button>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <span
                                className="w-6 h-6 rounded-lg border border-black/20 shadow-inner shrink-0"
                                style={{ backgroundColor: currentColor?.hex || '#f7f5ed' }}
                              />
                              <div className="text-xs truncate">
                                <strong className="text-[#1f1b10] block truncate">
                                  {currentColor?.name || 'Blanco Lienzo'}
                                </strong>
                                <span className="text-[10px] text-[#7f765f] font-mono">
                                  Código: {currentColor?.code || '100-B'} • {currentColor?.hex || '#f7f5ed'}
                                </span>
                              </div>
                            </div>

                            {/* Preset color swatches bar */}
                            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                              {STORE_PRESET_COLORS.map((col) => (
                                <button
                                  key={col.code}
                                  type="button"
                                  onClick={() => setProductColor(prod.sku, col)}
                                  className={`w-6 h-6 rounded-md border transition-transform cursor-pointer shrink-0 ${
                                    currentColor?.code === col.code
                                      ? 'scale-110 ring-2 ring-[#0d4788] border-white shadow-xs'
                                      : 'border-black/20 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: col.hex }}
                                  title={`${col.name} (${col.code})`}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Specs mini-grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-[#f6eddb]/50 border border-[#ebe2cf] text-[#4d4632]">
                          <div>
                            <span className="text-[#7f765f] block">Rendimiento:</span>
                            <strong className="text-[#1f1b10]">{prod.coverageM2PerGal} m²/gal</strong>
                          </div>
                          <div>
                            <span className="text-[#7f765f] block">Secado al tacto:</span>
                            <strong className="text-[#1f1b10]">{prod.dryingTimeTouch}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Buy Actions Footer */}
                    <div className="p-5 pt-0 space-y-3">
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#ebe2cf]">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#7f765f]">Cant:</span>
                          <div className="inline-flex items-center bg-[#fcf3e0] border border-[#d1c6ab] rounded-xl p-0.5">
                            <button
                              type="button"
                              onClick={() => setProductQty(prod.sku, currentQty - 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#7f765f] hover:text-[#1f1b10] hover:bg-[#ebe2cf] cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-[#1f1b10]">
                              {currentQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setProductQty(prod.sku, currentQty + 1)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#7f765f] hover:text-[#1f1b10] hover:bg-[#ebe2cf] cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-[#7f765f] block">Subtotal Ítem:</span>
                          <span className="text-base font-black text-[#1f1b10] font-mono">
                            {formatCOP(currentPrice * currentQty)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedProductSpec(prod)}
                          className="p-2.5 rounded-xl border border-[#d1c6ab] hover:bg-[#f6eddb] text-[#4d4632] hover:text-[#1f1b10] text-xs font-bold transition-colors flex items-center justify-center cursor-pointer"
                          title="Ver Ficha Técnica"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddToCart(prod)}
                          className="flex-1 py-3 rounded-xl bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] text-xs font-black transition-colors flex items-center justify-center gap-1.5 border border-[#d1c6ab] shadow-2xs cursor-pointer"
                        >
                          <ShoppingCart className="w-4 h-4 text-[#725c00]" />
                          <span>Añadir al Carrito</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleBuyNow(prod)}
                          className="flex-1 py-3 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <span>Comprar Ya</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: MY DIRECT ORDERS HISTORY ================= */}
        {storeTab === 'my_orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#ebe2cf] shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#ebe2cf]">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-[#1f1b10]">
                    Mis Compras Directas
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7f765f] mt-0.5">
                    Historial de pedidos despachados sin solicitud de proyecto vinculada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStoreTab('catalog')}
                  className="px-4 py-2.5 rounded-xl bg-[#ffd100] text-[#0d4788] text-xs font-black hover:bg-[#ffc800] transition-colors flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <Plus className="w-4 h-4" />
                  <span>Comprar Más Productos</span>
                </button>
              </div>

              {ordersHistory.length === 0 ? (
                <div className="py-16 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-[#f6eddb] text-[#725c00] flex items-center justify-center mx-auto shadow-inner">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1f1b10]">
                      No has realizado compras directas todavía
                    </h3>
                    <p className="text-xs text-[#7f765f] max-w-md mx-auto mt-1">
                      Explora el catálogo y adquiere pinturas oficiales Pintuco con entrega rápida a domicilio.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStoreTab('catalog')}
                    className="px-6 py-3 rounded-2xl bg-[#ffd100] text-[#0d4788] text-xs font-black shadow-xs hover:bg-[#ffc800] transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Ir al Catálogo de Productos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#ebe2cf] mt-4">
                  {ordersHistory.map((ord) => (
                    <div key={ord.orderId} className="py-6 first:pt-2 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fcf3e0] p-4 rounded-2xl border border-[#ebe2cf]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-black text-[#2f5ea1]">
                              {ord.orderId}
                            </span>
                            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#d1c6ab] font-bold text-[#7f765f]">
                              {ord.sapOrderNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] text-[10px] font-bold">
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#7f765f] mt-1">
                            Emitido el {new Date(ord.createdAt).toLocaleDateString('es-CO')} • Entrega estimada: {ord.shipping.city}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-left sm:text-right">
                            <span className="text-[10px] text-[#7f765f] block">Total Pagado:</span>
                            <strong className="text-base font-black text-[#1f1b10] font-mono">
                              {formatCOP(ord.totalCOP)}
                            </strong>
                          </div>

                          <button
                            type="button"
                            onClick={() => setConfirmedOrder(ord)}
                            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#ebe2cf] text-[#1f1b10] text-xs font-bold transition-colors border border-[#d1c6ab] flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-[#2f5ea1]" />
                            <span>Ver Recibo</span>
                          </button>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {ord.items.map((it) => (
                          <div
                            key={it.id}
                            className="p-3 rounded-xl bg-white border border-[#ebe2cf] flex items-center gap-3 text-xs"
                          >
                            <img
                              src={it.image}
                              alt={it.name}
                              className="w-12 h-12 rounded-lg object-cover shrink-0 border border-black/10"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-[#1f1b10] truncate">{it.name}</h4>
                              <p className="text-[11px] text-[#7f765f]">
                                {it.presentation} • Cant: {it.quantity}
                              </p>
                              {it.selectedColorName && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full border border-black/20"
                                    style={{ backgroundColor: it.selectedColorHex }}
                                  />
                                  <span className="text-[10px] text-[#4d4632]">
                                    {it.selectedColorName} ({it.selectedColorCode})
                                  </span>
                                </div>
                              )}
                            </div>
                            <span className="font-mono font-bold text-[#1f1b10] shrink-0">
                              {formatCOP(it.totalCOP)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ================= FLOATING CART BUTTON ================= */}
      {cartItems.length > 0 && !isCartOpen && (
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-full bg-[#ffd100] text-[#0d4788] font-black text-sm shadow-2xl hover:bg-[#ffc800] transition-all flex items-center gap-3 border-2 border-white cursor-pointer hover:scale-105"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 text-[#0d4788]" />
            <span className="absolute -top-2 -right-2 bg-[#ba1a1a] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {totalCartCount}
            </span>
          </div>
          <span>Ver Carrito ({formatCOP(totalPayableCOP)})</span>
        </button>
      )}

      {/* ================= CART DRAWER / MODAL ================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-[#ebe2cf] animate-in slide-in-from-right duration-200">
            {/* Cart Header */}
            <div className="p-5 border-b border-[#ebe2cf] bg-[#fff8f0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#ffd100] text-[#0d4788] flex items-center justify-center font-bold">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1f1b10]">
                    Carrito de Compras Directo
                  </h3>
                  <span className="text-xs text-[#7f765f]">
                    {totalCartCount} {totalCartCount === 1 ? 'ítem' : 'ítems'} seleccionados
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Body: Items list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {cartItems.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#fcf3e0] text-[#725c00] flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1f1b10]">Tu carrito está vacío</h4>
                  <p className="text-xs text-[#7f765f] max-w-xs mx-auto">
                    Agrega pinturas, barnices o accesorios de aplicación para continuar con tu compra directa.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="px-5 py-2 rounded-xl bg-[#ffd100] text-[#0d4788] text-xs font-bold cursor-pointer"
                  >
                    Ver Catálogo
                  </button>
                </div>
              ) : (
                cartItems.map((it) => (
                  <div
                    key={it.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#ebe2cf] shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={it.image}
                        alt={it.name}
                        className="w-14 h-14 rounded-xl object-cover shrink-0 border border-black/10"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-[#1f1b10] truncate">
                            {it.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(it.id)}
                            className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1 rounded-md transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-[11px] text-[#2f5ea1] font-bold block">
                          {it.presentation}
                        </span>
                        {it.selectedColorName && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: it.selectedColorHex }}
                            />
                            <span className="text-[10px] text-[#4d4632]">
                              {it.selectedColorName} ({it.selectedColorCode})
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#ebe2cf]/70 text-xs">
                      <div className="inline-flex items-center bg-[#fcf3e0] border border-[#d1c6ab] rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(it.id, -1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-[#7f765f] hover:text-[#1f1b10] hover:bg-[#ebe2cf] cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-[#1f1b10]">
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(it.id, 1)}
                          className="w-6 h-6 rounded flex items-center justify-center text-[#7f765f] hover:text-[#1f1b10] hover:bg-[#ebe2cf] cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-[#7f765f] block">
                          {formatCOP(it.unitPriceCOP)} c/u
                        </span>
                        <strong className="text-sm font-black text-[#1f1b10] font-mono">
                          {formatCOP(it.totalCOP)}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer: Financial Ledger & Checkout */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-[#ebe2cf] bg-[#fcf3e0]/80 space-y-3 shrink-0">
                <div className="space-y-1.5 text-xs text-[#4d4632]">
                  <div className="flex justify-between items-center">
                    <span>Subtotal Productos:</span>
                    <span className="font-mono text-[#1f1b10] font-bold">
                      {formatCOP(subtotalCOP)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[#ba1a1a]">
                    <span>Descuento Tienda Directa (-5%):</span>
                    <span className="font-mono">-{formatCOP(promoDiscountCOP)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>IVA (19%):</span>
                    <span className="font-mono text-[#1f1b10] font-bold">
                      {formatCOP(taxCOP)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <span>Costo de Despacho:</span>
                      {shippingCostCOP === 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Gratis
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-[#1f1b10]">
                      {shippingCostCOP === 0 ? '$0' : formatCOP(shippingCostCOP)}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-[#d1c6ab] my-1"></div>

                <div className="flex justify-between items-center text-[#1f1b10]">
                  <span className="text-sm font-black">TOTAL A PAGAR:</span>
                  <span className="text-xl font-black text-[#2f5ea1] font-mono">
                    {formatCOP(totalPayableCOP)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] text-sm font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-cart-proceed-checkout"
                >
                  <Lock className="w-4 h-4" />
                  <span>Proceder al Pago / Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= CHECKOUT MODAL ================= */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#ebe2cf] overflow-hidden">
            {/* Checkout Header */}
            <div className="p-6 border-b border-[#ebe2cf] bg-[#fff8f0] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ffd100] text-[#0d4788] flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1f1b10]">
                    Checkout Seguro • Compra Directa Pintuco
                  </h3>
                  <p className="text-xs text-[#7f765f]">
                    Despacho express a domicilio sin intermediarios
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleConfirmCheckout} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: Customer Data */}
              <div className="space-y-3">
                <span className="text-xs font-black uppercase text-[#725c00] tracking-wider block">
                  1. Datos del Comprador
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[#4d4632] font-bold mb-1">
                      Nombre Completo o Razón Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      placeholder="Ej: Andrés Cepeda / Diseños Andinos SAS"
                      className="w-full p-2.5 rounded-xl bg-[#f6eddb]/40 border border-[#d1c6ab] text-[#1f1b10] focus:outline-none focus:border-[#725c00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4d4632] font-bold mb-1">
                      Tipo de Documento *
                    </label>
                    <select
                      value={checkoutDocType}
                      onChange={(e) => setCheckoutDocType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#f6eddb]/40 border border-[#d1c6ab] text-[#1f1b10] focus:outline-none focus:border-[#725c00]"
                    >
                      <option value="Cédula de Ciudadanía">Cédula de Ciudadanía</option>
                      <option value="NIT">NIT (Empresas)</option>
                      <option value="Cédula de Extranjería">Cédula de Extranjería</option>
                      <option value="Pasaporte">Pasaporte</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#4d4632] font-bold mb-1">
                      Número de Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={checkoutDocNumber}
                      onChange={(e) => setCheckoutDocNumber(e.target.value)}
                      placeholder="Ej: 1024589210"
                      className="w-full p-2.5 rounded-xl bg-[#f6eddb]/40 border border-[#d1c6ab] text-[#1f1b10] focus:outline-none focus:border-[#725c00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4d4632] font-bold mb-1">
                      Teléfono Celular *
                    </label>
                    <input
                      type="tel"
                      required
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      placeholder="Ej: 312 458 9201"
                      className="w-full p-2.5 rounded-xl bg-[#f6eddb]/40 border border-[#d1c6ab] text-[#1f1b10] focus:outline-none focus:border-[#725c00]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#4d4632] font-bold mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={checkoutEmail}
                      onChange={(e) => setCheckoutEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full p-2.5 rounded-xl bg-[#f6eddb]/40 border border-[#d1c6ab] text-[#1f1b10] focus:outline-none focus:border-[#725c00]"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Shipping Info */}
              <div className="space-y-3 pt-2 border-t border-[#ebe2cf]">
                <span className="text-xs font-black uppercase text-[#725c00] tracking-wider block">
                  2. Dirección de Entrega en Colombia
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[#4d4632] font-bold mb-1">
                      Ciudad de Destino *
                    </label>
                    <select
                      value={checkoutCity}
                      onChange={(e) => setCheckoutCity(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#f6eddb]/40 border border-[#d1c6ab] text-[#1f1b10] focus:outline-none focus:border-[#725c00]"
                    >
                      <option value="Bogotá DC">Bogotá DC</option>
                      <option value="Medellín / Valle de Aburrá">Medellín / Valle de Aburrá</option>
                      <option value="Cali / Yumbo">Cali / Yumbo</option>
                      <option value="Barranquilla / Soledad">Barranquilla / Soledad</option>
                      <option value="Bucaramanga">Bucaramanga</option>
                      <option value="Cartagena">Cartagena</option>
                      <option value="Pereira">Pereira</option>
                      <option value="Manizales">Manizales</option>
                      <option value="Ibagué">Ibagué</option>
                      <option value="Cúcuta">Cúcuta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#4d4632] font-bold mb-1">
                      Dirección Exacta de Obra o Residencia *
                    </label>
                    <input
                      type="text"
                      required
                      value={checkoutAddress}
                      onChange={(e) => setCheckoutAddress(e.target.value)}
                      placeholder="Ej: Calle 127 # 19-45, Apto 402"
                      className="w-full p-2.5 rounded-xl bg-[#f6eddb]/40 border border-[#d1c6ab] text-[#1f1b10] focus:outline-none focus:border-[#725c00]"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-[#4d4632] font-bold mb-1">
                      Barrio o Instrucciones Especiales de Entrega:
                    </label>
                    <input
                      type="text"
                      value={checkoutDetails}
                      onChange={(e) => setCheckoutDetails(e.target.value)}
                      placeholder="Ej: Edificio Torres del Parque, portería 2. Recibe Maestro Juan."
                      className="w-full p-2.5 rounded-xl bg-[#f6eddb]/40 border border-[#d1c6ab] text-[#1f1b10] focus:outline-none focus:border-[#725c00]"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="space-y-3 pt-2 border-t border-[#ebe2cf]">
                <span className="text-xs font-black uppercase text-[#725c00] tracking-wider block">
                  3. Método de Pago Seguro
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {[
                    { id: 'PSE', title: 'PSE / Transferencia', desc: 'Bancolombia, Nequi, Davivienda, etc.' },
                    { id: 'Tarjeta de Crédito', title: 'Tarjeta Crédito / Débito', desc: 'Visa, Mastercard, American Express' },
                    { id: 'Contraentrega', title: 'Contraentrega en Obra', desc: 'Pago al recibir en efectivo o datáfono' },
                  ].map((pay) => (
                    <label
                      key={pay.id}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        checkoutPaymentMethod === pay.id
                          ? 'border-[#725c00] bg-[#fff9ea] shadow-xs'
                          : 'border-[#ebe2cf] hover:border-[#d1c6ab] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#1f1b10]">{pay.title}</span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={checkoutPaymentMethod === pay.id}
                          onChange={() => setCheckoutPaymentMethod(pay.id as any)}
                          className="accent-[#725c00]"
                        />
                      </div>
                      <p className="text-[11px] text-[#7f765f]">{pay.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Items Review Strip */}
              <div className="p-4 rounded-2xl bg-[#fcf3e0] border border-[#ebe2cf] space-y-2">
                <span className="text-[11px] font-bold text-[#725c00] uppercase block">
                  Resumen de Compra ({cartItems.length} productos):
                </span>
                <div className="max-h-28 overflow-y-auto divide-y divide-[#ebe2cf]/50 text-xs">
                  {cartItems.map((it) => (
                    <div key={it.id} className="py-1.5 flex justify-between items-center">
                      <span className="truncate pr-2">
                        {it.name} ({it.presentation}) x{it.quantity}
                      </span>
                      <strong className="font-mono">{formatCOP(it.totalCOP)}</strong>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-[#d1c6ab] flex justify-between items-center text-sm font-black text-[#1f1b10]">
                  <span>Total Liquidado con IVA:</span>
                  <span className="font-mono text-[#2f5ea1] text-base">
                    {formatCOP(totalPayableCOP)}
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb] cursor-pointer"
                >
                  Volver al Carrito
                </button>
                <button
                  type="submit"
                  disabled={isProcessingCheckout}
                  className="flex-1 py-3.5 rounded-xl bg-[#ffd100] text-[#0d4788] text-xs font-black shadow-md hover:bg-[#ffc800] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  id="btn-confirm-direct-order"
                >
                  {isProcessingCheckout ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0d4788] border-t-transparent rounded-full animate-spin"></div>
                      <span>Procesando Orden SAP...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#0d4788]" />
                      <span>Confirmar y Pagar Pedido</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ORDER SUCCESS & RECEIPT MODAL ================= */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#ebe2cf] animate-in fade-in zoom-in-95 duration-200">
            {/* Success Header */}
            <div className="text-center space-y-2 pb-6 border-b border-[#ebe2cf]">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider block">
                ¡Compra Directa Confirmada!
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#1f1b10]">
                Tu pedido Pintuco ha sido radicado en SAP
              </h3>
              <p className="text-xs text-[#7f765f] max-w-md mx-auto">
                No requeriste proyecto técnico previo. Tu orden pasará directo a dispensado en CEDI y despacho express.
              </p>
            </div>

            {/* Receipt Content */}
            <div className="py-6 space-y-4 text-xs text-[#1f1b10]">
              <div className="p-4 rounded-2xl bg-[#fcf3e0] border border-[#ebe2cf] flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-[#7f765f] uppercase font-bold block">
                    Número de Pedido Directo
                  </span>
                  <strong className="text-base font-mono text-[#2f5ea1]">
                    {confirmedOrder.orderId}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#7f765f] uppercase font-bold block">
                    Referencia SAP S/4HANA
                  </span>
                  <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-[#d1c6ab]">
                    {confirmedOrder.sapOrderNumber}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#ebe2cf]">
                  <span className="text-[#7f765f] block">Titular:</span>
                  <strong className="text-[#1f1b10]">{confirmedOrder.customer.fullName}</strong>
                  <p className="text-[10px] text-[#7f765f]">{confirmedOrder.customer.phone}</p>
                </div>
                <div className="p-3 rounded-xl bg-white border border-[#ebe2cf]">
                  <span className="text-[#7f765f] block">Destino de Despacho:</span>
                  <strong className="text-[#1f1b10]">{confirmedOrder.shipping.city}</strong>
                  <p className="text-[10px] text-[#7f765f] truncate">{confirmedOrder.shipping.address}</p>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <span className="text-[11px] font-bold text-[#725c00] uppercase block mb-2">
                  Productos y Recubrimientos Comprados:
                </span>
                <div className="divide-y divide-[#ebe2cf] border border-[#ebe2cf] rounded-xl overflow-hidden bg-white">
                  {confirmedOrder.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={it.image}
                          alt={it.name}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-black/10"
                        />
                        <div>
                          <strong className="block text-xs text-[#1f1b10]">{it.name}</strong>
                          <span className="text-[10px] text-[#7f765f]">
                            {it.presentation} • Cant: {it.quantity}
                            {it.selectedColorName ? ` • ${it.selectedColorName}` : ''}
                          </span>
                        </div>
                      </div>
                      <span className="font-mono font-bold">{formatCOP(it.totalCOP)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-3.5 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] space-y-1">
                <div className="flex justify-between text-xs text-[#4d4632]">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatCOP(confirmedOrder.subtotalCOP)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#4d4632]">
                  <span>IVA (19%):</span>
                  <span className="font-mono">{formatCOP(confirmedOrder.taxCOP)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#4d4632]">
                  <span>Despacho a Domicilio:</span>
                  <span className="font-mono">
                    {confirmedOrder.shippingCOP === 0 ? 'Gratis' : formatCOP(confirmedOrder.shippingCOP)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#d1c6ab] flex justify-between items-center text-sm font-black text-[#1f1b10]">
                  <span>TOTAL PAGADO:</span>
                  <span className="font-mono text-[#2f5ea1] text-base">
                    {formatCOP(confirmedOrder.totalCOP)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Imprimir Recibo PDF</span>
              </button>

              <a
                href={`https://wa.me/573124589201?text=Hola,%20acabo%20de%20hacer%20el%20pedido%20directo%20${confirmedOrder.orderId}%20en%20Pintuco%20Store.%20Quiero%20hacer%20seguimiento%20del%20despacho.`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Soporte</span>
              </a>

              <button
                type="button"
                onClick={() => setConfirmedOrder(null)}
                className="flex-1 py-3 rounded-xl bg-[#ffd100] hover:bg-[#ffc800] text-[#0d4788] text-xs font-black transition-colors flex items-center justify-center cursor-pointer"
              >
                <span>Cerrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TECHNICAL SPEC SHEET MODAL ================= */}
      {selectedProductSpec && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#ebe2cf] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#ebe2cf] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffd100] text-[#0d4788] flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#1f1b10]">
                    Ficha Técnica Oficial Pintuco
                  </h3>
                  <span className="text-xs text-[#7f765f] font-mono">
                    SKU: {selectedProductSpec.sku}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductSpec(null)}
                className="w-8 h-8 rounded-full bg-[#f6eddb] hover:bg-[#ebe2cf] text-[#1f1b10] flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-lg font-black text-[#1f1b10] mb-1">
                  {selectedProductSpec.name}
                </h4>
                <p className="text-[#4d4632] leading-relaxed">
                  {selectedProductSpec.description}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#fcf3e0] border border-[#ebe2cf] space-y-3">
                <span className="text-[10px] font-bold text-[#7f765f] uppercase tracking-wider block">
                  Propiedades Físicas & Desempeño
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[#7f765f] block">Rendimiento Teórico:</span>
                    <strong className="text-sm text-[#2f5ea1]">{selectedProductSpec.coverageM2PerGal} m²/gal</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Precio Base Oficial:</span>
                    <strong className="text-sm font-mono">{formatCOP(selectedProductSpec.priceCOP)}</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Sólidos por Volumen:</span>
                    <strong>{selectedProductSpec.solidsByVolume}%</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Emisiones VOC:</span>
                    <strong>{selectedProductSpec.voc}</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Secado al Tacto (25°C):</span>
                    <strong>{selectedProductSpec.dryingTimeTouch}</strong>
                  </div>
                  <div>
                    <span className="text-[#7f765f] block">Tiempo para Repinte:</span>
                    <strong>{selectedProductSpec.dryingTimeRecoat}</strong>
                  </div>
                </div>
              </div>

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
                onClick={() => setSelectedProductSpec(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#d1c6ab] text-xs font-bold text-[#4d4632] hover:bg-[#f6eddb] cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAddToCart(selectedProductSpec);
                  setSelectedProductSpec(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#ffd100] text-[#0d4788] text-xs font-black hover:bg-[#ffc800] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Añadir al Carrito</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CUSTOM COLOR WHEEL MODAL ================= */}
      {customColorModalSku && (
        <ColorSelectorModal
          isOpen={!!customColorModalSku}
          onClose={() => setCustomColorModalSku(null)}
          productName={
            PINTUCO_CATALOG.find((p) => p.sku === customColorModalSku)?.name || 'Pintura Pintuco'
          }
          productSku={customColorModalSku}
          initialMode="custom_wheel"
          initialHex={productSelectedColors[customColorModalSku]?.hex || '#df8c72'}
          initialName={productSelectedColors[customColorModalSku]?.name || 'Salmón Terracota'}
          initialCode={productSelectedColors[customColorModalSku]?.code || '248-A'}
          onApplyColor={handleApplyCustomColor}
        />
      )}
    </div>
  );
};
