import React, { useState, useEffect } from 'react';
import { ActiveTab, ProjectRequest, AIDiagnosis, Quotation, UserProfile } from './types';
import { INITIAL_DEMO_REQUEST, PINTUCO_CATALOG } from './data/pintucoProducts';
import { Header } from './components/Header';
import { NewRequestForm } from './components/NewRequestForm';
import { ColorLinkEcosystem } from './components/ColorLinkEcosystem';
import { AuthScreen, DEMO_USERS } from './components/AuthScreen';
import { ProjectStatusScreen } from './components/ProjectStatusScreen';
import { AdvisorEvaluationScreen } from './components/AdvisorEvaluationScreen';
import { AdvisorInventoryScreen } from './components/AdvisorInventoryScreen';
import { DirectStoreScreen } from './components/DirectStoreScreen';
import { ServicesModal } from './components/ServicesModal';
import { SupportModal } from './components/SupportModal';
import { Footer } from './components/Footer';
import {
  getRemoteProjectRequests,
  saveRemoteProjectRequest,
  saveRemoteUserProfile,
  checkSupabaseConnection,
} from './services/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';
import {
  checkRenderDbStatus,
  fetchProjectsFromDb,
  saveProjectToDb,
  saveUserToDb,
} from './services/renderDbService';

function isAdvisorRole(role?: string): boolean {
  if (!role) return false;
  return (
    role.includes('Técnico') ||
    role.includes('Asesor') ||
    role.includes('Administrador') ||
    role.includes('Pintuco')
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('colorlink_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null; // User must log in first
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      const saved = localStorage.getItem('colorlink_user');
      if (saved) return 'new_request';
    } catch {
      // ignore
    }
    return 'login';
  });

  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [renderDbConnected, setRenderDbConnected] = useState<boolean | null>(null);

  // Clean request state per user - never mix demo projects with real clients
  const [currentRequest, setCurrentRequest] = useState<ProjectRequest | null>(() => {
    try {
      const savedUser = localStorage.getItem('colorlink_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (isAdvisorRole(u.role)) {
          return INITIAL_DEMO_REQUEST;
        }
        const userSavedReq = localStorage.getItem(`colorlink_user_request_${u.email}`);
        if (userSavedReq) {
          return JSON.parse(userSavedReq);
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isStoreCartOpen, setIsStoreCartOpen] = useState(false);

  // Cart count for direct store shopping
  const [cartItemsCount, setCartItemsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('colorlink_direct_cart');
      if (saved) {
        const items = JSON.parse(saved);
        return Array.isArray(items)
          ? items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0)
          : 0;
      }
    } catch {
      // ignore
    }
    return 0;
  });

  // Sync cart count across changes & events
  useEffect(() => {
    const handleCartSync = () => {
      try {
        const saved = localStorage.getItem('colorlink_direct_cart');
        if (saved) {
          const items = JSON.parse(saved);
          setCartItemsCount(
            Array.isArray(items)
              ? items.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0)
              : 0
          );
        } else {
          setCartItemsCount(0);
        }
      } catch {
        setCartItemsCount(0);
      }
    };

    window.addEventListener('storage', handleCartSync);
    window.addEventListener('colorlink_cart_change', handleCartSync);
    return () => {
      window.removeEventListener('storage', handleCartSync);
      window.removeEventListener('colorlink_cart_change', handleCartSync);
    };
  }, []);

  // Initialize and check database connections (Render PostgreSQL & Supabase)
  useEffect(() => {
    async function initDatabases() {
      // 1. Check Render PostgreSQL Backend API
      try {
        const dbStatus = await checkRenderDbStatus();
        setRenderDbConnected(dbStatus.connected);
        if (dbStatus.connected) {
          const pgProjects = await fetchProjectsFromDb();
          if (pgProjects && pgProjects.length > 0) {
            // Only set project if user is logged in
            const savedUserStr = localStorage.getItem('colorlink_user');
            if (savedUserStr) {
              const u = JSON.parse(savedUserStr);
              if (isAdvisorRole(u.role)) {
                setCurrentRequest(pgProjects[0]);
              } else {
                const userProject = pgProjects.find(
                  (p: any) =>
                    p.client?.email?.toLowerCase() === u.email?.toLowerCase() ||
                    p.clientEmail?.toLowerCase() === u.email?.toLowerCase()
                );
                if (userProject) {
                  setCurrentRequest(userProject);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Render PostgreSQL notice:', err);
        setRenderDbConnected(false);
      }

      // 2. Check Supabase
      if (isSupabaseConfigured()) {
        try {
          const status = await checkSupabaseConnection();
          setSupabaseConnected(status.connected);
          if (status.connected) {
            const remoteRequests = await getRemoteProjectRequests();
            if (remoteRequests && remoteRequests.length > 0) {
              const savedUserStr = localStorage.getItem('colorlink_user');
              if (savedUserStr) {
                const u = JSON.parse(savedUserStr);
                if (isAdvisorRole(u.role)) {
                  setCurrentRequest(remoteRequests[0]);
                } else {
                  const userReq = remoteRequests.find(
                    (p: any) => p.client?.email?.toLowerCase() === u.email?.toLowerCase()
                  );
                  if (userReq) {
                    setCurrentRequest(userReq);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('Error conectando con Supabase:', err);
          setSupabaseConnected(false);
        }
      } else {
        setSupabaseConnected(false);
      }
    }
    initDatabases();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('colorlink_user', JSON.stringify(user));
      // Load user's isolated project request
      if (isAdvisorRole(user.role)) {
        setCurrentRequest(INITIAL_DEMO_REQUEST);
      } else {
        const userSavedReq = localStorage.getItem(`colorlink_user_request_${user.email}`);
        setCurrentRequest(userSavedReq ? JSON.parse(userSavedReq) : null);
      }
    } catch {
      // ignore
    }
    // Asynchronously upsert profile into Supabase
    saveRemoteUserProfile(user).catch((err) =>
      console.warn('Supabase profile save notice:', err)
    );
    // Asynchronously upsert profile into Render PostgreSQL
    saveUserToDb(user).catch((err) =>
      console.warn('Render DB user save notice:', err)
    );
    setActiveTab('new_request');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRequest(null);
    try {
      localStorage.removeItem('colorlink_user');
    } catch {
      // ignore
    }
    setActiveTab('login');
  };

  const handleSwitchToAdvisorAccount = () => {
    const advisorUser =
      DEMO_USERS.find((u) => u.role === 'Especialista Técnico Pintuco') || DEMO_USERS[1];
    setCurrentUser(advisorUser);
    setCurrentRequest(INITIAL_DEMO_REQUEST);
    try {
      localStorage.setItem('colorlink_user', JSON.stringify(advisorUser));
    } catch {
      // ignore
    }
    setActiveTab('advisor_portal');
  };

  // Handle Submission of New Request
  const handleSubmitRequest = async (rawRequest: ProjectRequest) => {
    setIsProcessingAI(true);

    try {
      let diagnosis: AIDiagnosis | null = null;

      try {
        // Call Server-Side Gemini endpoint
        const response = await fetch('/api/colorlink/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: rawRequest.client.fullName,
            surfaceType: rawRequest.surfaceType,
            condition: rawRequest.condition,
            environment: rawRequest.environment,
            areaM2: rawRequest.areaM2,
            city: rawRequest.city,
            comments: rawRequest.additionalDetails,
            photoBase64: rawRequest.photoBase64,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (
            data?.diagnosis &&
            Array.isArray(data.diagnosis.recommendedProducts) &&
            data.diagnosis.recommendedProducts.length > 0
          ) {
            diagnosis = data.diagnosis;
          }
        }
      } catch (networkError) {
        console.warn('Network notice calling diagnosis endpoint, using deterministic formulation:', networkError);
      }

      // If diagnosis was not returned by API or recommendedProducts is missing, formulate robust Pintuco recommendation
      if (!diagnosis || !Array.isArray(diagnosis.recommendedProducts) || diagnosis.recommendedProducts.length === 0) {
        const area = Number(rawRequest.areaM2) || 25;
        const isExterior = rawRequest.environment === 'exterior';
        const isMetal = rawRequest.surfaceType?.toLowerCase().includes('metal');
        const isWood = rawRequest.surfaceType?.toLowerCase().includes('madera');
        const isFloor = rawRequest.surfaceType?.toLowerCase().includes('piso');

        const primaryProduct = isExterior
          ? 'Koraza® Máxima Protección 10 Años'
          : isMetal
          ? 'Pintulux® 3 en 1 Anticorrosivo'
          : isWood
          ? 'Madetec® Barniz Poliuretano'
          : isFloor
          ? 'Pintura para Tráfico y Pisos Pintuco'
          : 'Viniltex® Avanzado Antibacterial';

        const sku = isExterior ? 'PT-KZ-4020' : isMetal ? 'PT-PL-3001' : isWood ? 'PT-MD-5012' : 'PT-VX-1010';
        const coverage = isExterior ? 28 : isMetal ? 30 : 35;
        const coats = rawRequest.condition?.toLowerCase().includes('dañado') || rawRequest.condition?.toLowerCase().includes('repintar') ? 3 : 2;
        const gallons = Math.max(1, Math.ceil(((area * coats) / coverage) * 10) / 10);
        const unitPrice = isExterior ? 138000 : isMetal ? 105000 : 94500;

        diagnosis = {
          diagnosticSummary: `Superficie tipo ${rawRequest.surfaceType} en ambiente ${rawRequest.environment} (${rawRequest.city}) con condición '${rawRequest.condition}'. Se prescribe sistema de recubrimiento Pintuco de alto desempeño con sellado previo para garantizar adherencia, retención de color y máxima lavabilidad.`,
          recommendedProducts: [
            {
              name: primaryProduct,
              type: 'Acabado Principal',
              sku,
              coverageM2PerGal: coverage,
              recommendedCoats: coats,
              totalGallonsNeeded: gallons,
              estimatedCostCOP: gallons * unitPrice,
              reason: `Fórmula premium recomendada para ${rawRequest.surfaceType.toLowerCase()} en ambiente ${rawRequest.environment}.`,
            },
            {
              name: 'Sellomax® Imprimante y Sellador Acrílico',
              type: 'Imprimante Sellador',
              sku: 'PT-SM-2005',
              coverageM2PerGal: 40,
              recommendedCoats: 1,
              totalGallonsNeeded: Math.max(1, Math.ceil((area / 40) * 10) / 10),
              estimatedCostCOP: Math.max(1, Math.ceil(area / 40)) * 62000,
              reason: 'Sella porosidad del sustrato y optimiza el cubrimiento del acabado.',
            },
          ],
          surfacePreparation: [
            'Lijar suavemente la superficie para eliminar impurezas y crear perfil de anclaje.',
            'Limpiar polvo con paño húmedo libre de residuos.',
            'Aplicar 1 mano homogénea de Sellomax® y dejar secar 2 horas.',
          ],
          applicationAdvice: {
            recommendedTools: ['Rodillo Microfibra Cero Goteo 3/8"', 'Brocha Nylon 2"', 'Bandeja dosificadora'],
            dilution: 'Máximo 10% de agua potable para primera mano, 5% para segunda mano.',
            dryingTimeTouch: '40 minutos a 20°C',
            dryingTimeBetweenCoats: '3 horas',
            cureTime: '7 días para curado y lavado intensivo',
          },
          qualityCheckpoints: [
            'Medición de humedad relativa en muro (< 10%).',
            'Prueba de adherencia ASTM D3359 grado 5B.',
            'Control de colorimetría Delta E < 0.4 contra patrón formulado.',
          ],
          operationalAlert: `Lote reservado en Centro de Distribución ${rawRequest.city}. Tinturado computarizado disponible.`,
          environmentalFactor: `Condiciones de aplicación para ${rawRequest.city}: Temperatura recomendada entre 12°C y 32°C.`,
        };
      }

      // Generate matching commercial quotation with color specifications
      const quoteItems = diagnosis.recommendedProducts.map((p, idx) => {
        const isPaintWithColor =
          idx === 0 ||
          p.type.toLowerCase().includes('acabado') ||
          p.name.toLowerCase().includes('viniltex') ||
          p.name.toLowerCase().includes('koraza') ||
          p.name.toLowerCase().includes('pintulux') ||
          p.name.toLowerCase().includes('tráfico');

        const selectedColorName = isPaintWithColor
          ? rawRequest.selectedColorName || rawRequest.colorFamily || 'Arena Cálido'
          : undefined;
        const selectedColorHex = isPaintWithColor
          ? rawRequest.selectedColorHex || '#E28468'
          : undefined;
        const selectedColorCode = isPaintWithColor
          ? rawRequest.selectedColorCode || 'PT-102'
          : undefined;
        const selectedColorMode = isPaintWithColor
          ? rawRequest.selectedColorMode || 'suggestion'
          : undefined;

        const displayName = isPaintWithColor && selectedColorName
          ? `${p.name} (Tono ${selectedColorName})`
          : p.name;

        return {
          sku: p.sku,
          name: displayName,
          type: p.type,
          unit:
            p.totalGallonsNeeded >= 5
              ? `Caneca (5 Gal) x ${Math.floor(p.totalGallonsNeeded / 5)} + Gal x ${Math.ceil(p.totalGallonsNeeded % 5)}`
              : `Galón (${p.totalGallonsNeeded} Gal)`,
          quantity: p.totalGallonsNeeded,
          unitPriceCOP: Math.round(p.estimatedCostCOP / Math.max(1, p.totalGallonsNeeded)),
          totalCOP: p.estimatedCostCOP,
          hasColors: isPaintWithColor,
          selectedColorMode,
          selectedColorName,
          selectedColorHex,
          selectedColorCode,
          finishPreference: rawRequest.finishPreference || 'Mate',
        };
      });

      const subtotal = quoteItems.reduce((acc, curr) => acc + curr.totalCOP, 0);
      const discount = Math.round(subtotal * 0.05); // 5% ColorLink ecosystem discount
      const tax = Math.round((subtotal - discount) * 0.19); // 19% IVA
      const labor = Math.round(rawRequest.areaM2 * 6500); // 6,500 COP per m2 standard application
      const total = subtotal - discount + tax + labor;

      const quotation: Quotation = {
        quoteNumber: `COT-PT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toLocaleDateString('es-CO'),
        validUntil: new Date(Date.now() + 15 * 86400000).toLocaleDateString('es-CO') + ' (15 días)',
        items: quoteItems,
        subtotalCOP: subtotal,
        discountCOP: discount,
        taxCOP: tax,
        laborEstimateCOP: labor,
        logisticsCOP: 0,
        totalCOP: total,
        paymentTerms: 'Crédito 30 días / PSE / Tarjeta Crédito',
        estimatedLeadDays: rawRequest.city.toLowerCase().includes('bogota') || rawRequest.city.toLowerCase().includes('medellin') ? 1 : 2,
      };

      const completedRequest: ProjectRequest = {
        ...rawRequest,
        status: 'Cotizada',
        diagnosis,
        quotation,
        plantStocks: [
          {
            plantName: 'Planta Principal Rionegro (Antioquia)',
            city: 'Rionegro / Medellín',
            availableGallons: 5200,
            batchCode: 'LOTE-RN-2608-A4',
            leadTimeHours: 24,
            status: 'Inmediato',
          },
          {
            plantName: 'Centro de Distribución Central Calle 80',
            city: 'Bogotá DC',
            availableGallons: 1850,
            batchCode: 'LOTE-BG-2608-C9',
            leadTimeHours: 4,
            status: 'Inmediato',
          },
          {
            plantName: 'Centro Logístico Occidente (Yumbo)',
            city: 'Cali / Yumbo',
            availableGallons: 940,
            batchCode: 'LOTE-YB-2608-D2',
            leadTimeHours: 48,
            status: 'Inmediato',
          },
          {
            plantName: 'Planta Caribe (Barranquilla)',
            city: 'Barranquilla',
            availableGallons: 710,
            batchCode: 'LOTE-BQ-2608-B5',
            leadTimeHours: 48,
            status: 'Inmediato',
          },
        ],
        productionOrder: {
          orderId: `ORD-PROD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          sku: diagnosis.recommendedProducts[0]?.sku || 'PT-VX-1010',
          productName: diagnosis.recommendedProducts[0]?.name || 'Pintura Pintuco Pro',
          volumeGallons: diagnosis.recommendedProducts[0]?.totalGallonsNeeded || 5,
          plant: `Centro de Distribución ${rawRequest.city}`,
          targetDate: rawRequest.requiredDate,
          currentStep: 'Control de Calidad (QA)',
          progressPercentage: 85,
          qaMetrics: {
            viscosityKrebs: 99,
            densityGml: 1.35,
            deltaEColor: 0.31,
            dryFilmThicknessMils: 2.2,
            adhesionTapeASTM: '5B (Excelente)',
            finenessHegman: 7,
            approvedBy: 'Ing. Laboratorio Central Pintuco - Certificación ISO 9001',
            isPassed: true,
          },
        },
      };

      setCurrentRequest(completedRequest);
      try {
        if (currentUser?.email) {
          localStorage.setItem(
            `colorlink_user_request_${currentUser.email}`,
            JSON.stringify(completedRequest)
          );
        }
      } catch {
        // ignore
      }
      // Persist to Supabase database asynchronously
      saveRemoteProjectRequest(completedRequest).catch((err) =>
        console.warn('Supabase request save notice:', err)
      );
      // Persist to Render PostgreSQL database asynchronously
      saveProjectToDb(completedRequest).catch((err) =>
        console.warn('Render DB request save notice:', err)
      );
      setActiveTab('project_status');
    } catch (error) {
      console.error('Error submitting request:', error);
      // Complete with safe default request so status page works
      setCurrentRequest(rawRequest);
      setActiveTab('project_status');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleUpdateProjectRequest = (updatedRequest: ProjectRequest) => {
    setCurrentRequest(updatedRequest);
    try {
      if (currentUser?.email) {
        localStorage.setItem(
          `colorlink_user_request_${currentUser.email}`,
          JSON.stringify(updatedRequest)
        );
      }
    } catch {
      // ignore
    }
    saveRemoteProjectRequest(updatedRequest).catch((err) =>
      console.warn('Supabase update notice:', err)
    );
    saveProjectToDb(updatedRequest).catch((err) =>
      console.warn('Render DB request update notice:', err)
    );
  };

  return (
    <div className="min-h-screen bg-[#fff8f0] text-[#1f1b10] flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRequest={currentRequest}
        currentUser={currentUser}
        supabaseConnected={supabaseConnected}
        renderDbConnected={renderDbConnected}
        cartItemsCount={cartItemsCount}
        onOpenCart={() => {
          setActiveTab('direct_store');
          setIsStoreCartOpen(true);
        }}
        onLogout={handleLogout}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenServices={() => setIsServicesOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-grow">
        {activeTab === 'direct_store' ? (
          <DirectStoreScreen
            currentUser={currentUser}
            onOpenLogin={() => setActiveTab('login')}
            onNavigateToRequest={() => setActiveTab('new_request')}
            onNavigateToProjectStatus={() => setActiveTab('project_status')}
            externalOpenCartTrigger={isStoreCartOpen}
          />
        ) : !currentUser ? (
          /* Authentication Required Wall for New Request and Project Status */
          <AuthScreen
            initialMode={activeTab === 'register' ? 'register' : 'login'}
            reasonBanner={
              activeTab === 'new_request' || activeTab === 'project_status'
                ? 'Para acceder a Nueva Solicitud o consultar el Estado de tu Proyecto, por favor inicia sesión o regístrate en Pintuco ColorLink.'
                : undefined
            }
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRequest={() => setActiveTab('new_request')}
          />
        ) : activeTab === 'login' ? (
          <AuthScreen
            initialMode="login"
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRequest={() => setActiveTab('new_request')}
          />
        ) : activeTab === 'register' ? (
          <AuthScreen
            initialMode="register"
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRequest={() => setActiveTab('new_request')}
          />
        ) : activeTab === 'project_status' ? (
          <ProjectStatusScreen
            request={currentRequest}
            currentUser={currentUser}
            onNavigateToRequest={() => setActiveTab('new_request')}
            onNavigateToEcosystem={() => setActiveTab('ecosystem_hub')}
            onOpenSupport={() => setIsSupportOpen(true)}
            onNavigateToAdvisorPortal={() => setActiveTab('advisor_portal')}
            onUpdateProject={handleUpdateProjectRequest}
            onNavigateToStore={() => setActiveTab('direct_store')}
          />
        ) : activeTab === 'advisor_portal' ? (
          <AdvisorEvaluationScreen
            currentUser={currentUser}
            request={currentRequest}
            onSwitchToAdvisorAccount={handleSwitchToAdvisorAccount}
            onOpenLogin={() => setActiveTab('login')}
            onNavigateHome={() => setActiveTab('new_request')}
            onNavigateToInventory={() => setActiveTab('advisor_inventory')}
            onUpdateProject={handleUpdateProjectRequest}
          />
        ) : activeTab === 'advisor_inventory' ? (
          <AdvisorInventoryScreen
            currentUser={currentUser}
            request={currentRequest}
            onSwitchToAdvisorAccount={handleSwitchToAdvisorAccount}
            onOpenLogin={() => setActiveTab('login')}
            onNavigateHome={() => setActiveTab('new_request')}
            onNavigateToDiagnosis={() => setActiveTab('advisor_portal')}
            onUpdateProject={handleUpdateProjectRequest}
          />
        ) : activeTab === 'new_request' ? (
          <NewRequestForm
            onSubmitRequest={handleSubmitRequest}
            isProcessingAI={isProcessingAI}
            currentUser={currentUser}
            onNavigateToStore={() => setActiveTab('direct_store')}
          />
        ) : (
          currentRequest && (
            <ColorLinkEcosystem
              request={currentRequest}
              onBackToForm={() => setActiveTab('new_request')}
              onNavigateToStatus={() => setActiveTab('project_status')}
              onUpdateProject={handleUpdateProjectRequest}
            />
          )
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenServices={() => setIsServicesOpen(true)}
      />

      {/* Interactive Modals */}
      <ServicesModal
        isOpen={isServicesOpen}
        onClose={() => setIsServicesOpen(false)}
        onSelectService={() => setActiveTab(currentUser ? 'new_request' : 'login')}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
}

