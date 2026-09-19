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

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('new_request');
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('colorlink_user');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEMO_USERS[0]; // Default to Demo User (Constructora Andina) for immediate seamless experience
  });

  const [currentRequest, setCurrentRequest] = useState<ProjectRequest | null>(INITIAL_DEMO_REQUEST);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Initialize Supabase and check live database connection
  useEffect(() => {
    async function initSupabase() {
      if (isSupabaseConfigured()) {
        try {
          const status = await checkSupabaseConnection();
          setSupabaseConnected(status.connected);
          if (status.connected) {
            const remoteRequests = await getRemoteProjectRequests();
            if (remoteRequests && remoteRequests.length > 0) {
              setCurrentRequest(remoteRequests[0]);
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
    initSupabase();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('colorlink_user', JSON.stringify(user));
    } catch {
      // ignore
    }
    // Asynchronously upsert profile into Supabase
    saveRemoteUserProfile(user).catch((err) =>
      console.warn('Supabase profile save notice:', err)
    );
    setActiveTab('new_request');
  };

  const handleLogout = () => {
    setCurrentUser(null);
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

      const data = await response.json();
      const diagnosis: AIDiagnosis = data.diagnosis;

      // Generate matching commercial quotation
      const quoteItems = diagnosis.recommendedProducts.map((p) => ({
        sku: p.sku,
        name: p.name,
        type: p.type,
        unit: p.totalGallonsNeeded >= 5
          ? `Caneca (5 Gal) x ${Math.floor(p.totalGallonsNeeded / 5)} + Gal x ${Math.ceil(p.totalGallonsNeeded % 5)}`
          : `Galón (${p.totalGallonsNeeded} Gal)`,
        quantity: p.totalGallonsNeeded,
        unitPriceCOP: Math.round(p.estimatedCostCOP / Math.max(1, p.totalGallonsNeeded)),
        totalCOP: p.estimatedCostCOP,
      }));

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
        status: 'Aprobada QA',
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
      // Persist to Supabase database asynchronously
      saveRemoteProjectRequest(completedRequest).catch((err) =>
        console.warn('Supabase request save notice:', err)
      );
      setActiveTab('ecosystem_hub');
    } catch (error) {
      console.error('Error submitting request:', error);
      // Fallback transition
      setCurrentRequest(rawRequest);
      setActiveTab('ecosystem_hub');
    } finally {
      setIsProcessingAI(false);
    }
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
        onLogout={handleLogout}
        onOpenSupport={() => setIsSupportOpen(true)}
        onOpenServices={() => setIsServicesOpen(true)}
      />

      {/* Main Content Body */}
      <main className="flex-grow">
        {activeTab === 'login' ? (
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
            onNavigateToRequest={() => setActiveTab('new_request')}
            onNavigateToEcosystem={() => setActiveTab('ecosystem_hub')}
            onOpenSupport={() => setIsSupportOpen(true)}
            onNavigateToAdvisorPortal={() => setActiveTab('advisor_portal')}
          />
        ) : activeTab === 'advisor_portal' ? (
          <AdvisorEvaluationScreen
            currentUser={currentUser}
            request={currentRequest}
            onSwitchToAdvisorAccount={handleSwitchToAdvisorAccount}
            onOpenLogin={() => setActiveTab('login')}
            onNavigateHome={() => setActiveTab('new_request')}
            onNavigateToInventory={() => setActiveTab('advisor_inventory')}
          />
        ) : activeTab === 'advisor_inventory' ? (
          <AdvisorInventoryScreen
            currentUser={currentUser}
            request={currentRequest}
            onSwitchToAdvisorAccount={handleSwitchToAdvisorAccount}
            onOpenLogin={() => setActiveTab('login')}
            onNavigateHome={() => setActiveTab('new_request')}
            onNavigateToDiagnosis={() => setActiveTab('advisor_portal')}
          />
        ) : activeTab === 'new_request' ? (
          <NewRequestForm
            onSubmitRequest={handleSubmitRequest}
            isProcessingAI={isProcessingAI}
            currentUser={currentUser}
          />
        ) : (
          currentRequest && (
            <ColorLinkEcosystem
              request={currentRequest}
              onBackToForm={() => setActiveTab('new_request')}
              onNavigateToStatus={() => setActiveTab('project_status')}
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
        onSelectService={() => setActiveTab('new_request')}
      />

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </div>
  );
}

