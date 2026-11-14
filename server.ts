import express from "express";
import crypto from "crypto";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import {
  sendWelcomeEmail,
  sendRegistrationVerificationEmail,
  sendInvoiceEmail,
  sendProjectStatusEmail,
  sendSupportTicketEmail,
  sendPasswordResetEmail,
  getResendStatus,
  getSmtpStatus,
  getBrevoStatus,
  getLastSmtpError,
  getLastBrevoError,
  getRecentEmailLogs,
} from "./serverEmailService";

// Helper to prevent email dispatch from blocking HTTP responses for too long
async function withEmailTimeout<T>(promise: Promise<T>, fallback: T, ms = 11000): Promise<T> {
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  } catch {
    return fallback;
  }
}

// In-memory store for password reset codes (email -> { code, expiresAt, used })
const passwordResetCodes = new Map<string, { code: string; expiresAt: number; used: boolean }>();

// In-memory store for registration email verification (email -> { code, token, expiresAt, verified })
const emailVerifications = new Map<
  string,
  { code: string; token: string; expiresAt: number; verified: boolean }
>();

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Server-side Gemini AI Client with User-Agent telemetry
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// In-Memory Mock Database Store (Active when no external database or on fallback)
const mockUsers = new Map<string, any>([
  [
    "proyectos@andinasas.com",
    {
      id: "USR-ANDINA-01",
      fullName: "Constructora Andina SAS",
      email: "proyectos@andinasas.com",
      password_hash: "andina2026",
      role: "Constructora / Arquitecto",
      documentType: "NIT",
      documentNumber: "900.584.210-7",
      phone: "+57 (310) 845-9920",
      city: "Bogotá",
      companyName: "Constructora Andina SAS",
      avatarUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-01-15",
    },
  ],
  [
    "cmendoza@pintuco.com",
    {
      id: "USR-TECNICO-02",
      fullName: "Ing. Carlos Mendoza (Pintuco QA)",
      email: "cmendoza@pintuco.com",
      password_hash: "pintuco2026",
      role: "Especialista Técnico Pintuco",
      documentType: "Cédula de Ciudadanía",
      documentNumber: "1.020.455.890",
      phone: "+57 (300) 412-5588",
      city: "Medellín / Rionegro",
      companyName: "Pintuco Colombia S.A.S.",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      createdAt: "2025-11-20",
    },
  ],
  [
    "david.recubrimientos@gmail.com",
    {
      id: "USR-MAESTRO-03",
      fullName: "David Valencia (Pintor Maestro Certificado)",
      email: "david.recubrimientos@gmail.com",
      password_hash: "maestro2026",
      role: "Contratista / Maestro",
      documentType: "Cédula de Ciudadanía",
      documentNumber: "71.298.432",
      phone: "+57 (312) 670-3411",
      city: "Cali",
      companyName: "Soluciones & Acabados Valencia",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      createdAt: "2026-03-01",
    },
  ],
]);

const mockProjects = new Map<string, any>([
  [
    "REQ-2026-7841",
    {
      id: "REQ-2026-7841",
      client: {
        fullName: "Constructora & Diseños Andinos SAS",
        email: "contacto@disenosandinos.co",
        phone: "+57 (601) 745-8900",
        documentType: "NIT",
        documentNumber: "900.584.210-7",
      },
      clientName: "Constructora & Diseños Andinos SAS",
      clientEmail: "contacto@disenosandinos.co",
      clientPhone: "+57 (601) 745-8900",
      clientType: "Empresa / Obra",
      surfaceType: "Pared",
      environment: "interior",
      condition: "Nuevo",
      areaM2: 180,
      city: "Bogotá DC",
      address: "Calle 100 # 19-61, Piso 5",
      comments: "Acabado de alta lavabilidad para recepción y salas de juntas.",
      additionalDetails: "Acabado de alta lavabilidad para recepción y salas de juntas.",
      status: "Inventario Asignado",
      assignedAdvisor: "Ing. Carlos Mendoza (Pintuco QA)",
      diagnosis: {
        diagnosticSummary: "Superficie de mampostería interior nueva en obra civil.",
        recommendedProducts: [
          {
            name: "Viniltex® Avanzado Antibacterial",
            type: "Acabado Principal",
            sku: "PT-VX-1010",
            coverageM2PerGal: 35,
            recommendedCoats: 2,
            totalGallonsNeeded: 11,
            estimatedCostCOP: 1039500,
            reason: "Alta lavabilidad y certificado antibacterial.",
          },
        ],
        surfacePreparation: [
          "Limpieza de polvo y partículas sueltas.",
          "Aplicación de Sellomax para sellar porosidad.",
        ],
        applicationAdvice: {
          recommendedTools: ["Rodillo microfibra 3/8", "Brocha nylon 2.5\""],
          dilution: "10% agua limpia",
          dryingTimeTouch: "1 hora",
          dryingTimeBetweenCoats: "3 horas",
          cureTime: "7 días",
        },
        qualityCheckpoints: ["Verificar secado previo"],
        operationalAlert: "Stock confirmado en CEDI Bogotá",
        environmentalFactor: "Clima frío moderado",
      },
      aiDiagnosis: {
        diagnosticSummary: "Superficie de mampostería interior nueva en obra civil.",
        recommendedProducts: [
          {
            name: "Viniltex® Avanzado Antibacterial",
            type: "Acabado Principal",
            sku: "PT-VX-1010",
            coverageM2PerGal: 35,
            recommendedCoats: 2,
            totalGallonsNeeded: 11,
            estimatedCostCOP: 1039500,
            reason: "Alta lavabilidad y certificado antibacterial.",
          },
        ],
      },
      quotation: {
        quoteNumber: "COT-PT-2026-7841",
        date: "22/08/2026",
        validUntil: "06/09/2026",
        items: [
          {
            sku: "PT-VX-1010",
            name: "Viniltex® Avanzado Antibacterial",
            type: "Pintura Acabado",
            unit: "Caneca (5 Gal) x 2 + Galón x 1",
            quantity: 11,
            unitPriceCOP: 94500,
            totalCOP: 1039500,
          },
        ],
        subtotalCOP: 1039500,
        discountCOP: 51975,
        taxCOP: 187630,
        laborEstimateCOP: 0,
        logisticsCOP: 0,
        totalCOP: 1175155,
        paymentTerms: "Crédito Corporativo 30 días",
        estimatedLeadDays: 2,
      },
      createdAt: "2026-08-22T09:15:00Z",
      updatedAt: "2026-08-22T09:15:00Z",
    },
  ],
]);

const mockOrders = new Map<string, any>();

// PostgreSQL Connection Pool (Render PostgreSQL or any standard Postgres URI)
let dbPool: any = null;

function getDbPool() {
  if (dbPool) return dbPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  try {
    // Import pg dynamically or use standard Pool
    const { Pool } = require("pg");
    const isSslNeeded = connectionString.includes("render.com") || process.env.NODE_ENV === "production" || connectionString.includes("sslmode=require");
    dbPool = new Pool({
      connectionString,
      ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
      connectionTimeoutMillis: 3000,
    });
    return dbPool;
  } catch (err: any) {
    console.warn("DB not connected — mock active:", err.message);
    return null;
  }
}

// Auto-initialize Render PostgreSQL schema on startup
async function initDatabaseTables() {
  const pool = getDbPool();
  if (!pool) {
    console.log("ℹ️ [Database] Almacenamiento local/memoria activo (Mock DB).");
    return;
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS project_requests (
          id VARCHAR(100) PRIMARY KEY,
          client_name VARCHAR(255) NOT NULL,
          client_email VARCHAR(255),
          client_phone VARCHAR(50),
          client_type VARCHAR(50),
          surface_type VARCHAR(100),
          environment VARCHAR(50),
          condition VARCHAR(100),
          area_m2 NUMERIC,
          city VARCHAR(100),
          comments TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'Registrada',
          assigned_advisor VARCHAR(255),
          ai_diagnosis JSONB,
          formulation JSONB,
          data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS direct_orders (
          id VARCHAR(100) PRIMARY KEY,
          sap_order_code VARCHAR(100) NOT NULL UNIQUE,
          customer_name VARCHAR(255) NOT NULL,
          customer_email VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(50),
          delivery_address TEXT NOT NULL,
          delivery_city VARCHAR(100) NOT NULL,
          payment_method VARCHAR(50) NOT NULL,
          subtotal NUMERIC NOT NULL,
          discount NUMERIC NOT NULL DEFAULT 0,
          iva NUMERIC NOT NULL DEFAULT 0,
          shipping NUMERIC NOT NULL DEFAULT 0,
          total NUMERIC NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'Pagado y Confirmado',
          items JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(100) PRIMARY KEY,
          full_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash TEXT,
          role VARCHAR(100) NOT NULL DEFAULT 'Cliente Particular',
          document_type VARCHAR(50),
          document_number VARCHAR(100),
          phone VARCHAR(50),
          city VARCHAR(100),
          company_name VARCHAR(255),
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS password_resets (
          email VARCHAR(255) PRIMARY KEY,
          code VARCHAR(20) NOT NULL,
          expires_at BIGINT NOT NULL,
          used BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS email_verifications (
          email VARCHAR(255) PRIMARY KEY,
          code VARCHAR(20) NOT NULL,
          token VARCHAR(128) NOT NULL,
          expires_at BIGINT NOT NULL,
          verified BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      // Ensure data JSONB column and email_verified column exist
      await client.query("ALTER TABLE project_requests ADD COLUMN IF NOT EXISTS data JSONB;");
      await client.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;");

      console.log("✅ [Render PostgreSQL] Tablas 'users', 'project_requests', 'direct_orders', 'password_resets' y 'email_verifications' listas y verificadas.");
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn("⚠️ [Render PostgreSQL] Aviso conexión BD (usando fallback en memoria):", err.message);
  }
}

// Render PostgreSQL Status Endpoint
app.get("/api/db/status", async (req, res) => {
  const pool = getDbPool();
  if (pool) {
    try {
      const result = await pool.query("SELECT NOW() as current_time, version() as version;");
      return res.json({
        configured: true,
        connected: true,
        provider: "Render PostgreSQL",
        serverTime: result.rows[0]?.current_time,
        version: result.rows[0]?.version?.split(" ")?.slice(0, 2)?.join(" "),
        message: "Conectado exitosamente a la base de datos PostgreSQL",
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn("PostgreSQL query check notice, using in-memory status:", err.message);
    }
  }

  return res.json({
    configured: false,
    connected: true,
    provider: "In-Memory Database (Mock Active)",
    message: "Almacenamiento en memoria activo para AI Studio.",
    timestamp: new Date().toISOString(),
  });
});

// Render PostgreSQL: Read & Sync Project Requests
app.get("/api/db/projects", async (req, res) => {
  const pool = getDbPool();
  if (pool) {
    try {
      const result = await pool.query("SELECT * FROM project_requests ORDER BY created_at DESC;");
      const formatted = result.rows.map((row: any) => {
        let fullData: any = {};
        if (row.data) {
          try {
            fullData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
          } catch {
            fullData = {};
          }
        }

        const clientObj = fullData.client || {
          fullName: row.client_name || "Cliente ColorLink",
          email: row.client_email || "",
          phone: row.client_phone || "",
          documentType: row.client_type || "Cédula de Ciudadanía",
          documentNumber: fullData.client?.documentNumber || "",
        };

        const diagnosisObj = fullData.diagnosis || row.ai_diagnosis;
        const quotationObj = fullData.quotation || row.formulation;

        return {
          ...fullData,
          id: row.id,
          client: clientObj,
          clientName: row.client_name || clientObj.fullName,
          clientEmail: row.client_email || clientObj.email,
          clientPhone: row.client_phone || clientObj.phone,
          clientType: row.client_type || clientObj.documentType,
          surfaceType: row.surface_type || fullData.surfaceType || "Pared",
          environment: row.environment || fullData.environment || "interior",
          condition: row.condition || fullData.condition || "Nuevo",
          areaM2: Number(row.area_m2) || fullData.areaM2 || 45,
          city: row.city || fullData.city || "Bogotá",
          address: fullData.address || "Dirección registrada",
          comments: row.comments || fullData.comments || fullData.additionalDetails || "",
          additionalDetails: fullData.additionalDetails || row.comments || "",
          status: row.status || fullData.status || "Registrada",
          assignedAdvisor: row.assigned_advisor || fullData.assignedAdvisor || null,
          diagnosis: diagnosisObj,
          aiDiagnosis: diagnosisObj,
          quotation: quotationObj,
          formulation: quotationObj,
          plantStocks: fullData.plantStocks || [],
          productionOrder: fullData.productionOrder,
          createdAt: row.created_at || fullData.createdAt || new Date().toISOString(),
          updatedAt: row.updated_at || fullData.updatedAt || new Date().toISOString(),
        };
      });
      return res.json({ success: true, projects: formatted });
    } catch (err: any) {
      console.warn("Error fetching projects from PostgreSQL, falling back to mock:", err.message);
    }
  }

  // Fallback to in-memory store
  const inMemory = Array.from(mockProjects.values()).map((p: any) => ({
    ...p,
    client: p.client || {
      fullName: p.clientName || "Cliente ColorLink",
      email: p.clientEmail || "",
      phone: p.clientPhone || "",
      documentType: p.clientType || "NIT",
      documentNumber: "",
    },
    surfaceType: p.surfaceType || "Pared",
    environment: p.environment || "interior",
    condition: p.condition || "Nuevo",
    areaM2: p.areaM2 || 45,
    city: p.city || "Bogotá",
    status: p.status || "Registrada",
  }));

  return res.json({ success: true, projects: inMemory });
});

// Render PostgreSQL: Upsert Project Request
app.post("/api/db/projects", async (req, res) => {
  const p = req.body;
  const projectId = p?.id;
  const clientName = p?.client?.fullName || p?.clientName;
  const clientEmail = p?.client?.email || p?.clientEmail;
  const clientPhone = p?.client?.phone || p?.clientPhone;
  const clientType = p?.client?.documentType || p?.clientType || "Particular";

  if (!p || !projectId || !clientName) {
    return res.status(400).json({ success: false, error: "Datos de proyecto incompletos" });
  }

  const normalizedProject = {
    ...p,
    id: projectId,
    client: p.client || {
      fullName: clientName,
      email: clientEmail || "",
      phone: clientPhone || "",
      documentType: clientType,
      documentNumber: p.client?.documentNumber || "",
    },
    clientName,
    clientEmail,
    clientPhone,
    clientType,
    surfaceType: p.surfaceType || "Pared",
    environment: p.environment || "interior",
    condition: p.condition || "Nuevo",
    areaM2: Number(p.areaM2) || 45,
    city: p.city || "Bogotá",
    address: p.address || "Dirección registrada",
    comments: p.comments || p.additionalDetails || "",
    additionalDetails: p.additionalDetails || p.comments || "",
    status: p.status || "Registrada",
    assignedAdvisor: p.assignedAdvisor || null,
    diagnosis: p.diagnosis || p.aiDiagnosis,
    aiDiagnosis: p.aiDiagnosis || p.diagnosis,
    quotation: p.quotation || p.formulation,
    formulation: p.formulation || p.quotation,
    updatedAt: new Date().toISOString(),
    createdAt: p.createdAt || new Date().toISOString(),
  };

  // Update in-memory mock store
  mockProjects.set(projectId, normalizedProject);

  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO project_requests (
          id, client_name, client_email, client_phone, client_type,
          surface_type, environment, condition, area_m2, city,
          comments, status, assigned_advisor, ai_diagnosis, formulation, data, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        ON CONFLICT (id) DO UPDATE SET
          client_name = EXCLUDED.client_name,
          client_email = EXCLUDED.client_email,
          client_phone = EXCLUDED.client_phone,
          client_type = EXCLUDED.client_type,
          surface_type = EXCLUDED.surface_type,
          environment = EXCLUDED.environment,
          condition = EXCLUDED.condition,
          area_m2 = EXCLUDED.area_m2,
          city = EXCLUDED.city,
          comments = EXCLUDED.comments,
          status = EXCLUDED.status,
          assigned_advisor = EXCLUDED.assigned_advisor,
          ai_diagnosis = EXCLUDED.ai_diagnosis,
          formulation = EXCLUDED.formulation,
          data = EXCLUDED.data,
          updated_at = NOW();`,
        [
          projectId,
          clientName,
          clientEmail || null,
          clientPhone || null,
          clientType,
          normalizedProject.surfaceType,
          normalizedProject.environment,
          normalizedProject.condition,
          normalizedProject.areaM2,
          normalizedProject.city,
          normalizedProject.comments || null,
          normalizedProject.status,
          normalizedProject.assignedAdvisor || null,
          JSON.stringify(normalizedProject.diagnosis || null),
          JSON.stringify(normalizedProject.quotation || null),
          JSON.stringify(normalizedProject),
        ]
      );
    } catch (err: any) {
      console.warn("PostgreSQL upsert project warning (saved in-memory):", err.message);
    }
  }

  return res.json({ success: true, id: projectId });
});

// Render PostgreSQL: Read & Sync Direct Orders
app.get("/api/db/orders", async (req, res) => {
  const pool = getDbPool();
  if (pool) {
    try {
      const result = await pool.query("SELECT * FROM direct_orders ORDER BY created_at DESC;");
      const formatted = result.rows.map((row: any) => ({
        id: row.id,
        sapOrderCode: row.sap_order_code,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        deliveryAddress: row.delivery_address,
        deliveryCity: row.delivery_city,
        paymentMethod: row.payment_method,
        subtotal: Number(row.subtotal),
        discount: Number(row.discount),
        iva: Number(row.iva),
        shipping: Number(row.shipping),
        total: Number(row.total),
        status: row.status,
        items: row.items,
        createdAt: row.created_at,
      }));
      return res.json({ success: true, orders: formatted });
    } catch (err: any) {
      console.warn("Error fetching orders from PostgreSQL, using mock:", err.message);
    }
  }

  return res.json({ success: true, orders: Array.from(mockOrders.values()) });
});

// Render PostgreSQL: Insert Direct Order with Email Invoice
app.post("/api/db/orders", async (req, res) => {
  const o = req.body;
  if (!o) {
    return res.status(400).json({ success: false, error: "Datos de orden vacíos" });
  }

  const orderId = o.id || o.orderId || `PED-${Date.now()}`;
  const sapOrderCode = o.sapOrderCode || o.sapOrderNumber || `SAP-${Math.floor(100000 + Math.random() * 900000)}`;
  const customerName = o.customerName || o.customer?.fullName || "Cliente Pintuco";
  const customerEmail = o.customerEmail || o.customer?.email;
  const customerPhone = o.customerPhone || o.customer?.phone || "";
  const deliveryAddress = o.deliveryAddress || o.shipping?.address || "Dirección registrada";
  const deliveryCity = o.deliveryCity || o.shipping?.city || "Colombia";
  const paymentMethod = o.paymentMethod || "PSE";
  const subtotal = Number(o.subtotal ?? o.subtotalCOP) || 0;
  const discount = Number(o.discount) || 0;
  const iva = Number(o.iva ?? o.taxCOP) || 0;
  const shipping = Number(o.shipping ?? o.shippingCOP) || 0;
  const total = Number(o.total ?? o.totalCOP) || 0;
  const status = o.status || "Pagado y Confirmado";
  const items = o.items || [];

  const normalizedOrder = {
    id: orderId,
    sapOrderCode,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddress,
    deliveryCity,
    paymentMethod,
    subtotal,
    discount,
    iva,
    shipping,
    total,
    status,
    items,
    createdAt: o.createdAt || new Date().toISOString(),
  };

  // Update in-memory store
  mockOrders.set(orderId, normalizedOrder);

  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO direct_orders (
          id, sap_order_code, customer_name, customer_email, customer_phone,
          delivery_address, delivery_city, payment_method, subtotal, discount,
          iva, shipping, total, status, items
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          customer_phone = EXCLUDED.customer_phone;`,
        [
          orderId,
          sapOrderCode,
          customerName,
          customerEmail || "",
          customerPhone,
          deliveryAddress,
          deliveryCity,
          paymentMethod,
          subtotal,
          discount,
          iva,
          shipping,
          total,
          status,
          JSON.stringify(items),
        ]
      );
    } catch (err: any) {
      console.warn("PostgreSQL order insert warning (saved in-memory):", err.message);
    }
  }

  // Trigger invoice email to customer email and include delivery status in response
  let emailResult: any = null;
  if (customerEmail) {
    emailResult = await withEmailTimeout(
      sendInvoiceEmail({
        id: orderId,
        sapOrderCode,
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        deliveryCity,
        paymentMethod,
        subtotal,
        discount,
        iva,
        shipping,
        total,
        status,
        items,
      }),
      { success: true, simulated: true, provider: "Simulator", diagnostic: "Envío en proceso en segundo plano." }
    );
  }

  return res.json({ success: true, id: orderId, sapOrderCode, emailResult });
});

// Notifications: Send or Resend Direct Order Invoice Email
app.post("/api/notifications/invoice", async (req, res) => {
  const { order, targetEmail } = req.body || {};
  const recipientEmail = (targetEmail || order?.customerEmail || order?.customer?.email || "").trim();
  if (!order || !recipientEmail) {
    return res.status(400).json({ success: false, error: "Orden o correo electrónico de destino no especificado" });
  }

  try {
    const result = await sendInvoiceEmail({
      id: order.id || order.orderId || `PED-${Date.now()}`,
      sapOrderCode: order.sapOrderCode || order.sapOrderNumber || "SAP-000000",
      customerName: order.customerName || order.customer?.fullName || "Cliente Pintuco",
      customerEmail: recipientEmail,
      customerPhone: order.customerPhone || order.customer?.phone || "",
      deliveryAddress: order.deliveryAddress || order.shipping?.address || "Dirección registrada",
      deliveryCity: order.deliveryCity || order.shipping?.city || "Colombia",
      paymentMethod: order.paymentMethod || "PSE",
      subtotal: Number(order.subtotal ?? order.subtotalCOP) || 0,
      discount: Number(order.discount) || 0,
      iva: Number(order.iva ?? order.taxCOP) || 0,
      shipping: Number(order.shipping ?? order.shippingCOP) || 0,
      total: Number(order.total ?? order.totalCOP) || 0,
      status: order.status || "Pagado y Confirmado",
      items: order.items || [],
    });

    return res.json({ success: true, result });
  } catch (err: any) {
    console.error("Error enviando factura por correo:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: Resolve public base URL for email links
function getPublicBaseUrl(req: express.Request): string {
  const envUrl = (process.env.APP_URL || "").trim().replace(/\/$/, "");
  if (envUrl) return envUrl;
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.get("host");
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

// Helper: Activate verified user and dispatch welcome email
async function finalizeVerifiedRegistration(normalizedEmail: string) {
  const pool = getDbPool();
  let userObj: any = null;

  if (pool) {
    try {
      await pool.query("UPDATE email_verifications SET verified = TRUE WHERE LOWER(email) = LOWER($1);", [
        normalizedEmail,
      ]);
      const upd = await pool.query(
        `UPDATE users SET email_verified = TRUE, updated_at = NOW()
         WHERE LOWER(email) = LOWER($1)
         RETURNING id, full_name, email, role, document_type, document_number, phone, city, company_name, avatar_url, created_at;`,
        [normalizedEmail]
      );
      if (upd.rows && upd.rows.length > 0) {
        const row = upd.rows[0];
        userObj = {
          id: row.id,
          fullName: row.full_name,
          email: row.email,
          role: row.role,
          documentType: row.document_type,
          documentNumber: row.document_number,
          phone: row.phone,
          city: row.city,
          companyName: row.company_name,
          avatarUrl: row.avatar_url,
          createdAt: row.created_at,
          emailVerified: true,
        };
      }
    } catch (err: any) {
      console.warn("PostgreSQL finalizeVerifiedRegistration notice:", err.message);
    }
  }

  const memRec = emailVerifications.get(normalizedEmail);
  if (memRec) {
    memRec.verified = true;
    emailVerifications.set(normalizedEmail, memRec);
  }

  const mockUser = mockUsers.get(normalizedEmail);
  if (mockUser) {
    mockUser.emailVerified = true;
    mockUsers.set(normalizedEmail, mockUser);
    if (!userObj) {
      userObj = {
        id: mockUser.id,
        fullName: mockUser.fullName,
        email: mockUser.email,
        role: mockUser.role,
        documentType: mockUser.documentType,
        documentNumber: mockUser.documentNumber,
        phone: mockUser.phone,
        city: mockUser.city,
        companyName: mockUser.companyName,
        avatarUrl: mockUser.avatarUrl,
        createdAt: mockUser.createdAt,
        emailVerified: true,
      };
    }
  }

  let welcomeEmailResult: any = null;
  if (userObj) {
    welcomeEmailResult = await withEmailTimeout(
      sendWelcomeEmail({
        fullName: userObj.fullName,
        email: userObj.email,
        role: userObj.role,
        documentType: userObj.documentType,
        documentNumber: userObj.documentNumber,
        phone: userObj.phone,
        city: userObj.city,
        companyName: userObj.companyName || undefined,
      }),
      { success: true, simulated: true, provider: "Simulator", diagnostic: "Correo de bienvenida en proceso." }
    );
  }

  return { user: userObj, welcomeEmailResult };
}

// Render PostgreSQL: Register User -> Sends Verification Email First
app.post("/api/auth/register", async (req, res) => {
  const {
    id,
    fullName,
    email,
    password,
    role,
    documentType,
    documentNumber,
    phone,
    city,
    companyName,
  } = req.body || {};

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, error: "Nombre, correo y contraseña son obligatorios" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const userId = id || `USR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  // Check if a verified account already exists in mockUsers
  const existingMock = mockUsers.get(normalizedEmail);
  if (existingMock && existingMock.emailVerified !== false) {
    return res.status(409).json({
      success: false,
      error: "El correo electrónico ya se encuentra registrado en ColorLink Pintuco.",
    });
  }

  const createdUser = {
    id: existingMock?.id || userId,
    fullName: fullName.trim(),
    email: normalizedEmail,
    password_hash: password,
    role: role || "Constructora / Arquitecto",
    documentType: documentType || "NIT",
    documentNumber: documentNumber || "",
    phone: phone || "",
    city: city || "Bogotá",
    companyName: companyName || null,
    createdAt: new Date().toISOString().split("T")[0],
    emailVerified: false,
  };

  const pool = getDbPool();
  if (pool) {
    try {
      const existing = await pool.query(
        "SELECT id, email, email_verified FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
        [normalizedEmail]
      );

      if (existing.rows && existing.rows.length > 0) {
        if (existing.rows[0].email_verified !== false) {
          return res.status(409).json({
            success: false,
            error: "El correo electrónico ya se encuentra registrado en ColorLink Pintuco.",
          });
        }
        // Pending unverified registration: update with latest registration data and resend verification
        createdUser.id = existing.rows[0].id;
        await pool.query(
          `UPDATE users
           SET full_name = $2, password_hash = $3, role = $4, document_type = $5,
               document_number = $6, phone = $7, city = $8, company_name = $9,
               email_verified = FALSE, updated_at = NOW()
           WHERE LOWER(email) = LOWER($1);`,
          [
            normalizedEmail,
            createdUser.fullName,
            password,
            createdUser.role,
            createdUser.documentType,
            createdUser.documentNumber,
            createdUser.phone,
            createdUser.city,
            createdUser.companyName,
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO users (
            id, full_name, email, password_hash, role, document_type,
            document_number, phone, city, company_name, email_verified, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, NOW(), NOW());`,
          [
            createdUser.id,
            createdUser.fullName,
            normalizedEmail,
            password,
            createdUser.role,
            createdUser.documentType,
            createdUser.documentNumber,
            createdUser.phone,
            createdUser.city,
            createdUser.companyName,
          ]
        );
      }
    } catch (err: any) {
      console.warn("PostgreSQL register notice (saved in-memory):", err.message);
    }
  }

  // Save pending unverified user in memory
  mockUsers.set(normalizedEmail, createdUser);

  // Create verification OTP code + token
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + 30 * 60 * 1000;

  emailVerifications.set(normalizedEmail, { code, token, expiresAt, verified: false });

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO email_verifications (email, code, token, expires_at, verified, created_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW())
         ON CONFLICT (email) DO UPDATE
           SET code = EXCLUDED.code, token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, verified = FALSE, created_at = NOW();`,
        [normalizedEmail, code, token, expiresAt]
      );
    } catch (err: any) {
      console.warn("PostgreSQL email_verifications insert notice:", err.message);
    }
  }

  const baseUrl = getPublicBaseUrl(req);
  const verificationUrl = `${baseUrl}/api/auth/verify-registration-link?email=${encodeURIComponent(
    normalizedEmail
  )}&token=${encodeURIComponent(token)}`;

  const emailResult = await withEmailTimeout(
    sendRegistrationVerificationEmail({
      fullName: createdUser.fullName,
      email: normalizedEmail,
      code,
      verificationUrl,
      role: createdUser.role,
      expiresMinutes: 30,
    }),
    {
      success: true,
      simulated: true,
      provider: "Simulator",
      diagnostic: "Correo de verificación en proceso.",
    }
  );

  return res.json({
    success: true,
    requiresVerification: true,
    email: normalizedEmail,
    emailResult,
    user: {
      id: createdUser.id,
      fullName: createdUser.fullName,
      email: createdUser.email,
      role: createdUser.role,
      documentType: createdUser.documentType,
      documentNumber: createdUser.documentNumber,
      phone: createdUser.phone,
      city: createdUser.city,
      companyName: createdUser.companyName,
      createdAt: createdUser.createdAt,
      emailVerified: false,
    },
  });
});

// Auth: Confirm Registration with 6-digit OTP code (or token)
app.post("/api/auth/verify-registration", async (req, res) => {
  const { email, code, token } = req.body || {};
  if (!email || (!code && !token)) {
    return res.status(400).json({
      success: false,
      error: "Correo electrónico y código de verificación son obligatorios.",
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedCode = code ? String(code).trim() : "";
  const normalizedToken = token ? String(token).trim() : "";

  let record: { code: string; token: string; expiresAt: number; verified: boolean } | null = null;
  const pool = getDbPool();

  if (pool) {
    try {
      const dbRes = await pool.query(
        "SELECT code, token, expires_at, verified FROM email_verifications WHERE LOWER(email) = LOWER($1) LIMIT 1;",
        [normalizedEmail]
      );
      if (dbRes.rows && dbRes.rows.length > 0) {
        record = {
          code: dbRes.rows[0].code,
          token: dbRes.rows[0].token,
          expiresAt: Number(dbRes.rows[0].expires_at),
          verified: Boolean(dbRes.rows[0].verified),
        };
      }
    } catch (err: any) {
      console.warn("PostgreSQL email_verifications lookup notice:", err.message);
    }
  }

  if (!record) {
    record = emailVerifications.get(normalizedEmail) || null;
  }

  if (!record) {
    return res.status(400).json({
      success: false,
      error: "No encontramos una solicitud de verificación activa para este correo. Solicita un nuevo código.",
    });
  }

  if (record.verified) {
    const finalized = await finalizeVerifiedRegistration(normalizedEmail);
    return res.json({
      success: true,
      verified: true,
      alreadyVerified: true,
      user: finalized.user,
      welcomeEmailResult: finalized.welcomeEmailResult,
    });
  }

  if (Date.now() > record.expiresAt) {
    return res.status(400).json({
      success: false,
      error: "El código de verificación ha expirado. Haz clic en Reenviar código para recibir uno nuevo.",
    });
  }

  const matchesCode = normalizedCode && record.code === normalizedCode;
  const matchesToken = normalizedToken && record.token === normalizedToken;
  if (!matchesCode && !matchesToken) {
    return res.status(400).json({
      success: false,
      error: "El código de verificación es incorrecto. Verifica tu correo e inténtalo de nuevo.",
    });
  }

  const finalized = await finalizeVerifiedRegistration(normalizedEmail);
  return res.json({
    success: true,
    verified: true,
    message: "¡Correo confirmado con éxito! Tu cuenta en ColorLink Pintuco está activa.",
    user: finalized.user,
    welcomeEmailResult: finalized.welcomeEmailResult,
  });
});

// Auth: One-click confirmation link clicked from verification email
app.get("/api/auth/verify-registration-link", async (req, res) => {
  const emailParam = String(req.query.email || "").trim().toLowerCase();
  const tokenParam = String(req.query.token || "").trim();

  if (!emailParam || !tokenParam) {
    return res
      .status(400)
      .send("<h2>Enlace de verificación inválido</h2><p>Faltan parámetros de confirmación.</p>");
  }

  let record: { token: string; expiresAt: number; verified: boolean } | null = null;
  const pool = getDbPool();
  if (pool) {
    try {
      const dbRes = await pool.query(
        "SELECT token, expires_at, verified FROM email_verifications WHERE LOWER(email) = LOWER($1) LIMIT 1;",
        [emailParam]
      );
      if (dbRes.rows && dbRes.rows.length > 0) {
        record = {
          token: dbRes.rows[0].token,
          expiresAt: Number(dbRes.rows[0].expires_at),
          verified: Boolean(dbRes.rows[0].verified),
        };
      }
    } catch (err: any) {
      console.warn("PostgreSQL verify-link notice:", err.message);
    }
  }
  if (!record) {
    record = emailVerifications.get(emailParam) || null;
  }

  const appUrl = getPublicBaseUrl(req);
  if (!record || record.token !== tokenParam) {
    return res.status(400).send(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>ColorLink Pintuco</title></head><body style="font-family:sans-serif;background:#fff8f0;padding:40px;text-align:center;"><div style="max-width:480px;margin:auto;background:#fff;padding:32px;border-radius:16px;border:1px solid #ebe2cf;"><h2 style="color:#991b1b;">Enlace inválido o expirado</h2><p style="color:#4d4632;">Por favor solicita un nuevo correo de verificación desde ColorLink.</p><a href="${appUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ffd100;color:#0d4788;font-weight:bold;text-decoration:none;border-radius:999px;">Volver a ColorLink</a></div></body></html>`);
  }

  if (!record.verified && Date.now() > record.expiresAt) {
    return res.status(400).send(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>ColorLink Pintuco</title></head><body style="font-family:sans-serif;background:#fff8f0;padding:40px;text-align:center;"><div style="max-width:480px;margin:auto;background:#fff;padding:32px;border-radius:16px;border:1px solid #ebe2cf;"><h2 style="color:#92400e;">El enlace ha expirado</h2><p style="color:#4d4632;">Regresa a ColorLink y solicita un nuevo código de confirmación.</p><a href="${appUrl}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#ffd100;color:#0d4788;font-weight:bold;text-decoration:none;border-radius:999px;">Volver a ColorLink</a></div></body></html>`);
  }

  await finalizeVerifiedRegistration(emailParam);
  return res.status(200).send(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Registro Confirmado - ColorLink Pintuco</title></head><body style="font-family:sans-serif;background:#fff8f0;padding:40px;text-align:center;"><div style="max-width:500px;margin:auto;background:#fff;padding:36px;border-radius:20px;border:1px solid #ebe2cf;box-shadow:0 8px 30px rgba(0,0,0,0.06);"><div style="width:56px;height:56px;border-radius:50%;background:#dcfce7;color:#166534;font-size:28px;line-height:56px;margin:0 auto 16px;">✓</div><h1 style="color:#0d4788;margin:0 0 10px;font-size:22px;">¡Registro Confirmado con Éxito!</h1><p style="color:#4d4632;font-size:14px;line-height:1.6;">Tu correo <strong>${emailParam}</strong> ha sido verificado y tu cuenta en <strong>ColorLink Pintuco</strong> ya se encuentra activa. También te enviamos tu correo de bienvenida.</p><a href="${appUrl}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:#ffd100;color:#0d4788;font-weight:800;text-decoration:none;border-radius:999px;">Ir a ColorLink Pintuco</a></div></body></html>`);
});

// Auth: Resend verification email for a pending registration
app.post("/api/auth/resend-verification", async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ success: false, error: "Correo electrónico inválido." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const pool = getDbPool();
  let userFullName = "Usuario ColorLink";
  let userRole = "Constructora / Arquitecto";

  if (pool) {
    try {
      const dbUser = await pool.query(
        "SELECT full_name, role, email_verified FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
        [normalizedEmail]
      );
      if (dbUser.rows && dbUser.rows.length > 0) {
        if (dbUser.rows[0].email_verified === true) {
          return res.json({
            success: true,
            alreadyVerified: true,
            message: "Esta cuenta ya se encuentra verificada. Puedes iniciar sesión.",
          });
        }
        userFullName = dbUser.rows[0].full_name || userFullName;
        userRole = dbUser.rows[0].role || userRole;
      }
    } catch (err: any) {
      console.warn("PostgreSQL resend-verification lookup notice:", err.message);
    }
  }

  const mockUser = mockUsers.get(normalizedEmail);
  if (mockUser) {
    if (mockUser.emailVerified === true) {
      return res.json({
        success: true,
        alreadyVerified: true,
        message: "Esta cuenta ya se encuentra verificada. Puedes iniciar sesión.",
      });
    }
    userFullName = mockUser.fullName || userFullName;
    userRole = mockUser.role || userRole;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = Date.now() + 30 * 60 * 1000;

  emailVerifications.set(normalizedEmail, { code, token, expiresAt, verified: false });

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO email_verifications (email, code, token, expires_at, verified, created_at)
         VALUES ($1, $2, $3, $4, FALSE, NOW())
         ON CONFLICT (email) DO UPDATE
           SET code = EXCLUDED.code, token = EXCLUDED.token, expires_at = EXCLUDED.expires_at, verified = FALSE, created_at = NOW();`,
        [normalizedEmail, code, token, expiresAt]
      );
    } catch (err: any) {
      console.warn("PostgreSQL resend-verification insert notice:", err.message);
    }
  }

  const baseUrl = getPublicBaseUrl(req);
  const verificationUrl = `${baseUrl}/api/auth/verify-registration-link?email=${encodeURIComponent(
    normalizedEmail
  )}&token=${encodeURIComponent(token)}`;

  const emailResult = await withEmailTimeout(
    sendRegistrationVerificationEmail({
      fullName: userFullName,
      email: normalizedEmail,
      code,
      verificationUrl,
      role: userRole,
      expiresMinutes: 30,
    }),
    {
      success: true,
      simulated: true,
      provider: "Simulator",
      diagnostic: "Correo de verificación reenviado.",
    }
  );

  return res.json({
    success: true,
    message: `Hemos reenviado el código de verificación a ${normalizedEmail}.`,
    emailResult,
  });
});

// Auth: Check if a pending registration was verified (e.g. via email link)
app.post("/api/auth/verification-status", async (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, error: "Correo requerido" });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const pool = getDbPool();

  if (pool) {
    try {
      const result = await pool.query(
        "SELECT id, full_name, email, role, document_type, document_number, phone, city, company_name, avatar_url, created_at, email_verified FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
        [normalizedEmail]
      );
      if (result.rows && result.rows.length > 0 && result.rows[0].email_verified === true) {
        const row = result.rows[0];
        return res.json({
          success: true,
          verified: true,
          user: {
            id: row.id,
            fullName: row.full_name,
            email: row.email,
            role: row.role,
            documentType: row.document_type,
            documentNumber: row.document_number,
            phone: row.phone,
            city: row.city,
            companyName: row.company_name,
            avatarUrl: row.avatar_url,
            createdAt: row.created_at,
            emailVerified: true,
          },
        });
      }
    } catch (err: any) {
      console.warn("PostgreSQL verification-status notice:", err.message);
    }
  }

  const mockUser = mockUsers.get(normalizedEmail);
  const memRec = emailVerifications.get(normalizedEmail);
  if ((mockUser && mockUser.emailVerified === true) || memRec?.verified) {
    return res.json({
      success: true,
      verified: true,
      user: mockUser
        ? {
            id: mockUser.id,
            fullName: mockUser.fullName,
            email: mockUser.email,
            role: mockUser.role,
            documentType: mockUser.documentType,
            documentNumber: mockUser.documentNumber,
            phone: mockUser.phone,
            city: mockUser.city,
            companyName: mockUser.companyName,
            avatarUrl: mockUser.avatarUrl,
            createdAt: mockUser.createdAt,
            emailVerified: true,
          }
        : undefined,
    });
  }

  return res.json({ success: true, verified: false });
});

// Notifications: Send Project Status Update Email
app.post("/api/notifications/project-status", async (req, res) => {
  const { project, previousStatus, newStatus } = req.body || {};
  const clientEmail = project?.clientEmail || project?.client?.email;
  const clientName = project?.clientName || project?.client?.fullName || "Cliente Pintuco";

  if (!project || !clientEmail) {
    return res.status(400).json({ success: false, error: "Proyecto o correo de cliente no especificado" });
  }

  try {
    const result = await sendProjectStatusEmail({
      id: project.id,
      clientName,
      clientEmail,
      surfaceType: project.surfaceType,
      city: project.city,
      status: newStatus || project.status,
      previousStatus: previousStatus,
      assignedAdvisor: project.assignedAdvisor,
      areaM2: project.areaM2,
      trackingNumber: project.trackingNumber,
      assignedCarrier: project.assignedCarrier,
      comments: project.comments,
    });
    return res.json({ success: true, result });
  } catch (err: any) {
    console.error("Error enviando notificación de estado de proyecto:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Notifications: Get Status & Diagnostic Info (Resend, Brevo & SMTP)
app.get("/api/notifications/status", (req, res) => {
  const resend = getResendStatus();
  const smtp = getSmtpStatus();
  const brevo = getBrevoStatus();
  const lastSmtpError = getLastSmtpError();
  const lastBrevoError = getLastBrevoError();
  const canSendToAnyEmail = Boolean(brevo.isConfigured || smtp.isConfigured || resend.hasCustomDomain);

  return res.json({
    success: true,
    resend,
    smtp,
    brevo,
    lastSmtpError,
    lastBrevoError,
    canSendToAnyEmail,
    activeMode: brevo.isConfigured
      ? "Brevo HTTPS API (Puerto 443 - Envío directo a Outlook/Gmail/cualquier correo)"
      : brevo.isSmtpKeyMistake
      ? "BREVO_API_KEY inválida (usaste clave xsmtpsib- SMTP en vez de xkeysib- API)"
      : smtp.isConfigured
      ? `SMTP (${smtp.isGmail ? "Gmail" : smtp.host} - Envío directo a cualquier correo)`
      : resend.isConfigured
      ? resend.hasCustomDomain
        ? "Resend con Dominio Propio (Envío a cualquier correo)"
        : "Resend Sandbox Relay (Entrega en cuenta registrada)"
      : "Ethereal Test SMTP (Vista previa real en navegador)",
    recentLogs: getRecentEmailLogs(),
  });
});

// Notifications: Test Email Configuration (Resend, Brevo & SMTP Diagnostic Endpoint)
app.post("/api/test/email", async (req, res) => {
  const { toEmail } = req.body || {};
  const targetEmail = toEmail ? toEmail.trim() : (process.env.RESEND_ACCOUNT_EMAIL || process.env.RESEND_TEST_EMAIL || "");
  if (!targetEmail) {
    return res.status(400).json({
      success: false,
      message: "Debes ingresar un correo electrónico destinatario para realizar la prueba.",
    });
  }
  const resendStatus = getResendStatus();
  const smtpStatus = getSmtpStatus();
  const brevoStatus = getBrevoStatus();

  try {
    const emailPromise = sendWelcomeEmail({
      fullName: "Prueba Técnica ColorLink Pintuco",
      email: targetEmail,
      role: "Especialista Técnico Pintuco",
      city: "Medellín / Bogotá",
    });

    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error("Tiempo de espera agotado (12 segundos) conectando al servidor de correo.")), 12000)
    );

    const result = await Promise.race([emailPromise, timeoutPromise]);

    const isRedirected = Boolean(result.redirected);
    const brevoFailedNotice = result.brevoError ? ` Nota Brevo: ${result.brevoError}.` : "";
    const smtpFailedNotice = result.smtpError ? ` Nota SMTP: ${result.smtpError}.` : "";
    const message = result.success
      ? isRedirected
        ? `Correo redirigido a ${result.redirectedTo} por Resend Sandbox (para: ${result.originalTo}).${brevoFailedNotice}${smtpFailedNotice}`
        : `Correo de prueba entregado exitosamente a ${targetEmail} vía ${result.provider}${brevoFailedNotice}${smtpFailedNotice}`
      : result.error || "No se pudo entregar el correo";

    return res.json({
      success: result.success,
      result,
      resendStatus,
      smtpStatus,
      brevoStatus,
      lastSmtpError: getLastSmtpError(),
      lastBrevoError: getLastBrevoError(),
      canSendToAnyEmail: Boolean(brevoStatus.isConfigured || smtpStatus.isConfigured || resendStatus.hasCustomDomain),
      providerUsed: result.provider || (result.simulated ? "Simulator" : "Unknown"),
      message,
    });
  } catch (err: any) {
    console.error("Test email error/timeout:", err.message);
    return res.status(200).json({
      success: false,
      resendStatus,
      smtpStatus,
      brevoStatus,
      lastSmtpError: getLastSmtpError(),
      lastBrevoError: getLastBrevoError(),
      canSendToAnyEmail: Boolean(brevoStatus.isConfigured || smtpStatus.isConfigured || resendStatus.hasCustomDomain),
      providerUsed: "Error",
      message: err.message || "Error procesando envío de prueba",
      result: {
        success: false,
        simulated: false,
        error: err.message,
        diagnostic: "Si usas Gmail SMTP, comprueba que la contraseña de aplicación no tenga espacios y que la verificación en dos pasos siga activa en Google.",
      },
    });
  }
});

// Notifications: Support Ticket Email Endpoint
app.post("/api/support/ticket", async (req, res) => {
  const { fullName, email, phone, subject, message } = req.body || {};
  if (!email || !subject) {
    return res.status(400).json({ success: false, error: "Correo y asunto son requeridos" });
  }

  try {
    const result = await sendSupportTicketEmail({
      fullName: fullName || "Cliente ColorLink",
      email: email.trim(),
      phone: phone || "",
      subject: subject.trim(),
      message: message || "Sin mensaje adicional",
    });

    return res.json({ success: true, result });
  } catch (err: any) {
    console.error("Error sending support ticket email:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Render PostgreSQL: Login User
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Correo y contraseña son requeridos" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const pool = getDbPool();

  if (pool) {
    try {
      const result = await pool.query(
        "SELECT id, full_name, email, password_hash, role, document_type, document_number, phone, city, company_name, avatar_url, created_at, email_verified FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
        [normalizedEmail]
      );

      if (result.rows && result.rows.length > 0) {
        const row = result.rows[0];
        if (row.password_hash && row.password_hash !== password) {
          return res.status(401).json({ success: false, error: "Contraseña incorrecta" });
        }

        if (row.email_verified === false) {
          return res.status(403).json({
            success: false,
            requiresVerification: true,
            email: row.email,
            error: "Tu cuenta aún no ha sido verificada. Revisa tu correo electrónico para confirmar tu registro.",
          });
        }

        return res.json({
          success: true,
          user: {
            id: row.id,
            fullName: row.full_name,
            email: row.email,
            role: row.role,
            documentType: row.document_type,
            documentNumber: row.document_number,
            phone: row.phone,
            city: row.city,
            companyName: row.company_name,
            avatarUrl: row.avatar_url,
            createdAt: row.created_at,
          },
        });
      }
    } catch (err: any) {
      console.warn("PostgreSQL login notice (falling back to mock users):", err.message);
    }
  }

  // In-memory mock users verification
  const mockUser = mockUsers.get(normalizedEmail);
  if (mockUser) {
    if (mockUser.password_hash && mockUser.password_hash !== password) {
      return res.status(401).json({ success: false, error: "Contraseña incorrecta" });
    }
    if (mockUser.emailVerified === false) {
      return res.status(403).json({
        success: false,
        requiresVerification: true,
        email: mockUser.email,
        error: "Tu cuenta aún no ha sido verificada. Revisa tu correo electrónico para confirmar tu registro.",
      });
    }
    return res.json({
      success: true,
      user: {
        id: mockUser.id,
        fullName: mockUser.fullName,
        email: mockUser.email,
        role: mockUser.role,
        documentType: mockUser.documentType,
        documentNumber: mockUser.documentNumber,
        phone: mockUser.phone,
        city: mockUser.city,
        companyName: mockUser.companyName,
        avatarUrl: mockUser.avatarUrl,
        createdAt: mockUser.createdAt,
      },
    });
  }

  return res.status(404).json({ success: false, error: "Usuario no encontrado" });
});

// Auth: Forgot Password (Send 6-digit verification code via email)
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ success: false, error: "Por favor ingresa un correo electrónico válido." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let userFullName = "";
  let userFound = false;

  const pool = getDbPool();
  if (pool) {
    try {
      const result = await pool.query(
        "SELECT full_name FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
        [normalizedEmail]
      );
      if (result.rows && result.rows.length > 0) {
        userFound = true;
        userFullName = result.rows[0].full_name || "Usuario ColorLink";
      }
    } catch (err: any) {
      console.warn("PostgreSQL forgot-password lookup notice:", err.message);
    }
  }

  if (!userFound) {
    const mockUser = mockUsers.get(normalizedEmail);
    if (mockUser) {
      userFound = true;
      userFullName = mockUser.fullName || "Usuario ColorLink";
    }
  }

  if (!userFound) {
    // Allow recovery code dispatch even if user was only cached in client localStorage previously
    userFullName = normalizedEmail.split("@")[0].replace(/[._]/g, " ");
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;

  passwordResetCodes.set(normalizedEmail, { code, expiresAt, used: false });

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO password_resets (email, code, expires_at, used, created_at)
         VALUES ($1, $2, $3, FALSE, NOW())
         ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, used = FALSE, created_at = NOW();`,
        [normalizedEmail, code, expiresAt]
      );
    } catch (err: any) {
      console.warn("PostgreSQL password_resets insert notice:", err.message);
    }
  }

  try {
    const emailResult = await withEmailTimeout(
      sendPasswordResetEmail({
        fullName: userFullName || "Usuario ColorLink",
        email: normalizedEmail,
        code,
        expiresMinutes: 15,
      }),
      { success: true, simulated: true, provider: "Simulator", diagnostic: "Código enviado." }
    );

    return res.json({
      success: true,
      message: `Hemos enviado un código de verificación de 6 dígitos a ${normalizedEmail}.`,
      emailResult,
    });
  } catch (err: any) {
    console.error("Error enviando correo de recuperación:", err.message);
    return res.status(500).json({ success: false, error: "Error enviando el correo de recuperación." });
  }
});

// Auth: Reset Password with 6-digit code
app.post("/api/auth/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body || {};

  if (!email || !code || !newPassword) {
    return res.status(400).json({
      success: false,
      error: "Correo, código de verificación y nueva contraseña son obligatorios.",
    });
  }

  if (typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: "La nueva contraseña debe tener al menos 6 caracteres.",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = String(code).trim();
  const pool = getDbPool();

  let record: { code: string; expiresAt: number; used: boolean } | null = null;

  if (pool) {
    try {
      const dbRes = await pool.query(
        "SELECT code, expires_at, used FROM password_resets WHERE LOWER(email) = LOWER($1) LIMIT 1;",
        [normalizedEmail]
      );
      if (dbRes.rows && dbRes.rows.length > 0) {
        record = {
          code: dbRes.rows[0].code,
          expiresAt: Number(dbRes.rows[0].expires_at),
          used: Boolean(dbRes.rows[0].used),
        };
      }
    } catch (err: any) {
      console.warn("PostgreSQL password_resets lookup notice:", err.message);
    }
  }

  if (!record) {
    record = passwordResetCodes.get(normalizedEmail) || null;
  }

  if (!record || record.used) {
    return res.status(400).json({
      success: false,
      error: "No hay un código activo para este correo o ya fue utilizado. Solicita uno nuevo.",
    });
  }

  if (Date.now() > record.expiresAt) {
    return res.status(400).json({
      success: false,
      error: "El código de verificación ha expirado. Solicita uno nuevo.",
    });
  }

  if (record.code !== normalizedCode) {
    return res.status(400).json({
      success: false,
      error: "El código de verificación es incorrecto. Verifica tu correo e inténtalo de nuevo.",
    });
  }

  // Mark code used
  passwordResetCodes.set(normalizedEmail, { ...record, used: true });
  if (pool) {
    try {
      await pool.query("UPDATE password_resets SET used = TRUE WHERE LOWER(email) = LOWER($1);", [normalizedEmail]);
      await pool.query(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2);",
        [newPassword, normalizedEmail]
      );
    } catch (err: any) {
      console.warn("PostgreSQL password update notice:", err.message);
    }
  }

  const existingMock = mockUsers.get(normalizedEmail);
  if (existingMock) {
    mockUsers.set(normalizedEmail, { ...existingMock, password_hash: newPassword });
  }

  return res.json({
    success: true,
    message: "Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión.",
  });
});

// Render PostgreSQL: Upsert User Profile
app.post("/api/db/users", async (req, res) => {
  const u = req.body;
  if (!u || !u.email) {
    return res.status(400).json({ success: false, error: "Datos de usuario incompletos" });
  }

  const normalizedEmail = u.email.trim().toLowerCase();
  const userId = u.id || `USR-${Date.now()}`;
  const existing = mockUsers.get(normalizedEmail) || {};

  mockUsers.set(normalizedEmail, {
    ...existing,
    id: userId,
    fullName: u.fullName || existing.fullName || "Usuario Pintuco",
    email: normalizedEmail,
    role: u.role || existing.role || "Cliente Particular",
    documentType: u.documentType || existing.documentType || "Cédula de Ciudadanía",
    documentNumber: u.documentNumber || existing.documentNumber || "",
    phone: u.phone || existing.phone || "",
    city: u.city || existing.city || "Bogotá",
    companyName: u.companyName || existing.companyName || null,
  });

  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO users (
          id, full_name, email, role, document_type, document_number, phone, city, company_name, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role,
          phone = EXCLUDED.phone,
          city = EXCLUDED.city,
          company_name = EXCLUDED.company_name,
          updated_at = NOW();`,
        [
          userId,
          u.fullName || "Usuario Pintuco",
          normalizedEmail,
          u.role || "Cliente Particular",
          u.documentType || "Cédula de Ciudadanía",
          u.documentNumber || "",
          u.phone || "",
          u.city || "Bogotá",
          u.companyName || null,
        ]
      );
    } catch (err: any) {
      console.warn("PostgreSQL upsert user warning (saved in-memory):", err.message);
    }
  }

  return res.json({ success: true, id: userId });
});

// Render PostgreSQL: Get All Users (Admin / Registry)
app.get("/api/db/users", async (req, res) => {
  const pool = getDbPool();
  if (pool) {
    try {
      const result = await pool.query(
        "SELECT id, full_name, email, role, document_type, document_number, phone, city, company_name, created_at FROM users ORDER BY created_at DESC;"
      );
      const users = result.rows.map((row: any) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        role: row.role,
        documentType: row.document_type,
        documentNumber: row.document_number,
        phone: row.phone,
        city: row.city,
        companyName: row.company_name,
        createdAt: row.created_at,
      }));
      return res.json({ success: true, users });
    } catch (err: any) {
      console.warn("Error fetching users from PostgreSQL, using mock:", err.message);
    }
  }

  return res.json({ success: true, users: Array.from(mockUsers.values()) });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ColorLink - Pintuco AI Intelligent Ecosystem", database: dbPool ? "PostgreSQL Connected" : "Local Ready" });
});

// AI Diagnostic & Technical Formulation endpoint
app.post("/api/colorlink/diagnose", async (req, res) => {
  const {
    clientName,
    surfaceType,
    condition,
    environment,
    areaM2,
    city,
    comments,
    photoBase64,
  } = req.body || {};

  try {
    const ai = getGeminiClient();

    // If Gemini is available, call gemini-4-hydrogen with structured reasoning
    if (ai) {
      try {
        const prompt = `Eres el Asistente Técnico y Especialista en Recubrimientos de Pintuco para el Ecosistema ColorLink.
Analiza la siguiente solicitud de proyecto de pintura y recubrimiento y genera un diagnóstico técnico experto, recomendación de productos oficiales Pintuco, cálculo de rendimiento, preparación de superficie y pasos operacionales.

DATOS DEL PROYECTO:
- Cliente: ${clientName || "Cliente"}
- Tipo de Superficie: ${surfaceType || "Pared"}
- Condición actual: ${condition || "Nuevo"}
- Ambiente: ${environment || "Interior"}
- Área a recubrir: ${areaM2 || 0} m²
- Ubicación / Ciudad: ${city || "Colombia"}
- Comentarios o preferencias: ${comments || "Ninguno"}
${photoBase64 ? "- Se adjuntó registro fotográfico para análisis visual de textura, porosidad o degradación." : ""}

Responde en formato JSON válido con la siguiente estructura exacta:
{
  "diagnosticSummary": "Resumen técnico profesional del estado de la superficie y requerimiento",
  "recommendedProducts": [
    {
      "name": "Nombre de producto Pintuco (ej. Viniltex Avanzado, Koraza, Pintulux 3 en 1, Epóxico, etc.)",
      "type": "Acabado principal / Imprimante / Sellador / Impermeabilizante",
      "sku": "Código SKU sugerido (ej. PT-VN-1001)",
      "coverageM2PerGal": 35,
      "recommendedCoats": 2,
      "totalGallonsNeeded": 3.5,
      "estimatedCostCOP": 145000,
      "reason": "Justificación técnica de por qué es el producto ideal para estas condiciones"
    }
  ],
  "surfacePreparation": [
    "Paso 1 de preparación de superficie (limpieza, lijado, desengrase, etc.)",
    "Paso 2...",
    "Paso 3..."
  ],
  "applicationAdvice": {
    "recommendedTools": ["Rodillo de microfibra 3/8", "Brocha nylon", "Equipo Airless (opcional)"],
    "dilution": "Máximo 10-15% con agua limpia",
    "dryingTimeTouch": "1 - 2 horas",
    "dryingTimeBetweenCoats": "4 - 6 horas",
    "cureTime": "7 días para curado total y lavabilidad"
  },
  "qualityCheckpoints": [
    "Prueba de adherencia previa",
    "Control de humedad de sustrato (< 12%)",
    "Espesor de película húmeda (WFT) y seca (DFT)"
  ],
  "operationalAlert": "Nota operacional para producción/despacho (ej: alta rotación en planta, sugerir tinturado computarizado en punto de venta)",
  "environmentalFactor": "Consideraciones climáticas para ${city || "la zona"} (humedad relativa, temperatura de aplicación recomendada 10°C - 35°C)"
}`;

        const contents: any[] = [];
        if (photoBase64 && typeof photoBase64 === "string" && photoBase64.includes("base64,")) {
          const mimeType = photoBase64.substring(photoBase64.indexOf(":") + 1, photoBase64.indexOf(";"));
          const data = photoBase64.split("base64,")[1];
          contents.push({
            inlineData: {
              mimeType,
              data,
            },
          });
        }
        contents.push(prompt);

        const response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents,
          config: {
            responseMimeType: "application/json",
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(text);
        if (parsed && Array.isArray(parsed.recommendedProducts) && parsed.recommendedProducts.length > 0) {
          return res.json({ success: true, diagnosis: parsed, aiPowered: true });
        }
      } catch (geminiErr) {
        console.warn("Gemini diagnosis generation warning, falling back to deterministic Pintuco engine:", geminiErr);
      }
    }

    // High quality deterministic fallback if no API key or on parse fallback
    const area = Number(areaM2) || 25;
    const isExterior = environment === "exterior";
    const isMetal = surfaceType?.toLowerCase().includes("metal");
    const isWood = surfaceType?.toLowerCase().includes("madera");
    const isFloor = surfaceType?.toLowerCase().includes("piso");

    let primaryProduct = isExterior
      ? "Koraza® Máxima Protección"
      : isMetal
      ? "Pintulux® 3 en 1 Anticorrosivo"
      : isWood
      ? "Madetec® Barniz Poliuretano"
      : isFloor
      ? "Pintura para Tráfico y Pisos Pintuco"
      : "Viniltex® Avanzado Antibacterial";

    let sku = isExterior ? "PT-KZ-4020" : isMetal ? "PT-PL-3001" : "PT-VX-1010";
    let coverage = isExterior ? 28 : isMetal ? 30 : 35;
    let coats = condition?.toLowerCase().includes("dañado") || condition?.toLowerCase().includes("repintar") ? 3 : 2;
    let gallons = Math.max(1, Math.ceil(((area * coats) / coverage) * 10) / 10);
    let unitPrice = isExterior ? 128000 : isMetal ? 98000 : 89000;

    const fallbackDiagnosis = {
      diagnosticSummary: `Superficie tipo ${surfaceType || "Pared"} en ambiente ${environment || "Interior"} con condición '${condition || "Nuevo"}'. Requiere sistema de recubrimiento Pintuco de alto desempeño con preparación previa para garantizar adherencia y durabilidad mínima de 5 a 10 años.`,
      recommendedProducts: [
        {
          name: primaryProduct,
          type: "Acabado Principal",
          sku,
          coverageM2PerGal: coverage,
          recommendedCoats: coats,
          totalGallonsNeeded: gallons,
          estimatedCostCOP: gallons * unitPrice,
          reason: `Formulado con polímeros acrílicos de última generación y alta resistencia para ${environment || "este tipo de ambiente"}.`,
        },
        {
          name: "Sellomax® / Imprimante Acrílico Pintuco",
          type: "Imprimante y Sellador",
          sku: "PT-SM-2005",
          coverageM2PerGal: 40,
          recommendedCoats: 1,
          totalGallonsNeeded: Math.max(1, Math.ceil((area / 40) * 10) / 10),
          estimatedCostCOP: Math.max(1, Math.ceil(area / 40)) * 62000,
          reason: "Sella la porosidad del sustrato, uniformiza la absorción y maximiza el rendimiento del acabado.",
        },
      ],
      surfacePreparation: [
        "1. Limpieza profunda: Eliminar polvo, grasa, moho o partículas sueltas con desengrasante biodegradable.",
        "2. Lijado y nivelación: Lijar suavemente con grano 180 para crear perfil de anclaje uniforme.",
        "3. Aplicación de Sellador: Aplicar 1 mano de Sellomax para sellar porosidad.",
      ],
      applicationAdvice: {
        recommendedTools: ["Rodillo microfibra Pintuco Pro 3/8", "Brocha Cerda Natural 2.5\"", "Bandeja dosificadora"],
        dilution: "Diluir con agua limpia máximo al 10% para primera mano, 5% para segunda mano.",
        dryingTimeTouch: "45 a 60 minutos",
        dryingTimeBetweenCoats: "2 a 4 horas",
        cureTime: "7 días para máxima lavabilidad y resistencia química",
      },
      qualityCheckpoints: [
        "Verificar que la humedad del muro sea menor al 12% antes de pintar.",
        "Comprobar espesor de película húmeda (WFT recomendado 4.0 - 5.0 mils).",
        "Inspeccionar homogeneidad del color y ausencia de traslapes visibles con luz rasante.",
      ],
      operationalAlert: "Disponible con stock inmediato en centros de distribución de " + (city || "Bogotá") + ". Lote de producción validado por control de calidad.",
      environmentalFactor: "Temperatura ideal de aplicación: 12°C - 32°C. Humedad relativa recomendada menor al 80%.",
    };

    return res.json({ success: true, diagnosis: fallbackDiagnosis, aiPowered: false });
  } catch (error: any) {
    console.error("Error in diagnose endpoint:", error);
    // Even in error, return a valid diagnosis structure so client never crashes
    return res.json({
      success: true,
      diagnosis: {
        diagnosticSummary: `Evaluación Pintuco para ${surfaceType || 'superficie'} en ${city || 'Colombia'}.`,
        recommendedProducts: [
          {
            name: "Viniltex® Avanzado Antibacterial",
            type: "Acabado Principal",
            sku: "PT-VX-1010",
            coverageM2PerGal: 35,
            recommendedCoats: 2,
            totalGallonsNeeded: Math.max(1, Math.ceil(((Number(areaM2) || 20) * 2) / 35)),
            estimatedCostCOP: 94500 * Math.max(1, Math.ceil(((Number(areaM2) || 20) * 2) / 35)),
            reason: "Alta lavabilidad y durabilidad garantizada Pintuco.",
          },
        ],
        surfacePreparation: ["Limpiar superficie de polvo", "Lijar suavemente"],
        applicationAdvice: {
          recommendedTools: ["Rodillo", "Brocha"],
          dilution: "10% agua",
          dryingTimeTouch: "1 hora",
          dryingTimeBetweenCoats: "3 horas",
          cureTime: "7 días",
        },
        qualityCheckpoints: ["Verificar secado"],
        operationalAlert: "Despacho programado",
        environmentalFactor: "Clima estándar",
      },
      aiPowered: false,
    });
  }
});

// ColorLink Technical Advisor Chatbot endpoint - Natural-language AI restricted to Pintuco/ColorLink services
app.post("/api/colorlink/chat", async (req, res) => {
  try {
    const { message, projectContext, history } = req.body || {};
    const userQuery = (message || "").trim();

    if (!userQuery) {
      return res.status(400).json({ error: "El mensaje no puede estar vacío" });
    }

    const ai = getGeminiClient();
    let geminiFallbackReason: string | undefined;

    // 1. PRIMARY ENGINE: Natural-Language Multi-Turn Conversation via Gemini (gemini-4-hydrogen)
    if (ai) {
      try {
        const contextSummary =
          projectContext && Object.keys(projectContext).length > 0
            ? `\nCONTEXTO ACTUAL DEL PROYECTO DEL USUARIO EN PANTALLA:\n- Cliente: ${projectContext.clientName || "N/A"}\n- Superficie: ${projectContext.surfaceType || "General"}\n- Área: ${projectContext.areaM2 || "No especificada"} m²\n- Ciudad: ${projectContext.city || "Colombia"}\n- Condición: ${projectContext.condition || "General"}\n- Ambiente: ${projectContext.environment || "Interior"}\n`
            : "";

        const systemInstruction = `Eres "ColorLink Bot", el Asistente Técnico y Comercial Oficial de Pintuco Colombia en la plataforma ColorLink.
Responde siempre en español natural, cercano, claro y conversacional (no suenes robótico ni uses respuestas genéricas repetitivas). Entiende preguntas coloquiales, errores de ortografía, referencias contextuales del historial (ej: "¿y cuánto me vale?", "¿para 40 metros?", "¿y si llueve?") y haz cálculos exactos cuando el usuario dé medidas.

CATÁLOGO Y PRECIOS DE REFERENCIA EN COLORLINK (COP por galón aprox.):
- Viniltex® Avanzado Antibacterial (SKU PT-VX-1010): $94.500 COP | Rendimiento: 35 m²/gal (2 manos rec.) | Interiores, drywall, salas, habitaciones, baños y cocinas. Secado tacto 30-45 min, entre manos 2-4 h.
- Koraza® Máxima Protección 10 Años (SKU PT-KZ-4020): $138.000 COP | Rendimiento: 28 m²/gal | Fachadas, muros exteriores, lluvia/UV. Secado tacto 1 h, entre manos 4-6 h.
- Pintulux® 3 en 1 Anticorrosivo (SKU PT-PL-3001): $105.000 COP | Rendimiento: 32 m²/gal | Metales, rejas, portones, estructuras.
- Madetec® Barniz Poliuretano Filtro UV (SKU PT-MD-5012): $98.000 COP | Rendimiento: 30 m²/gal (3 manos rec.) | Maderas interiores y exteriores.
- Pintuco EpoxiPoliamida Alto Desempeño (SKU PT-EP-8090): $215.000 COP | Rendimiento: 22 m²/gal | Pisos industriales, parqueaderos, bodegas, tanques.
- Sellomax® Imprimante y Sellador Acrílico (SKU PT-SM-2005): $62.000 COP | Rendimiento: 42 m²/gal (1 mano) | Sella porosidad en muro nuevo/estuco/drywall y ahorra hasta 25% de acabado.
- Aquablock® Membrana Impermeabilizante Fibrada (SKU PT-AQ-6001): $148.000 COP | Rendimiento: 15 m²/gal (3 manos rec.) | Terrazas, losas, humedad y microfisuras.

SERVICIOS Y FLUJOS DE LA PLATAFORMA COLORLINK:
- Nueva Solicitud: Diagnóstico IA de superficie + cálculo automático de galones y cotización formal.
- Tienda Directa ("Comprar Directo"): Compra inmediata sin crear proyecto (Cuarto 1/4 Gal, Galón, Caneca 5 Gal, Unidades/Kits) con pagos por PSE, Tarjeta de Crédito o Contraentrega, y envío de factura electrónica al correo.
- Estado del Proyecto: Seguimiento en tiempo real (Registrada → Analizada por IA → Cotizada → Inventario Asignado → En Producción → Aprobada QA → Completada).
- Plantas / CEDIs: Rionegro, Bogotá/Funza, Cali y Barranquilla.
- Soporte: Línea Nacional 01 8000 111 247 y WhatsApp Técnico +57 310 746 8899.

REGLA ESTRICTA DE ALCANCE (SOLO SERVICIO PINTUCO / COLORLINK):
- Responde libremente en lenguaje natural cualquier pregunta relacionada con: pintura, colores, decoración/combinación cromática de paredes o fachadas, cálculo de metros/galones/presupuesto, humedad/salitre/hongos/óxido/grietas, preparación de superficies, herramientas (rodillos, brochas, airless), tiempos de secado, o uso de ColorLink (pedidos, envíos, facturas, cotizaciones, seguimiento, cuentas).
- ÚNICAMENTE rechaza preguntas completamente ajenas a pintura, recubrimientos, construcción/remodelación de acabados o ColorLink (ej: recetas de cocina, programación/código, deportes, política, tareas escolares de matemáticas/historia, medicina, chistes/cuentos, horóscopo). En ese caso responde con cortesía en 2 líneas explicando que solo atiendes consultas de pinturas, recubrimientos y servicios ColorLink Pintuco.
${contextSummary}`;

        // Normalize multi-turn history so Gemini Chats receives alternating user -> model turns cleanly
        const normalizedHistory: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
        if (Array.isArray(history)) {
          for (const h of history.slice(-10)) {
            const text = typeof h?.text === "string" ? h.text.trim() : "";
            if (!text) continue;
            const role: "user" | "model" = h.sender === "user" ? "user" : "model";
            // Skip leading model greeting so history always starts with a user turn
            if (normalizedHistory.length === 0 && role === "model") continue;
            const prev = normalizedHistory[normalizedHistory.length - 1];
            if (prev && prev.role === role) {
              prev.parts[0].text += `\n${text}`;
            } else {
              normalizedHistory.push({ role, parts: [{ text }] });
            }
          }
          // History before chat.sendMessage should end with model if possible (or trim trailing user duplicate)
          if (
            normalizedHistory.length > 0 &&
            normalizedHistory[normalizedHistory.length - 1].role === "user" &&
            normalizedHistory[normalizedHistory.length - 1].parts[0].text === userQuery
          ) {
            normalizedHistory.pop();
          }
        }

        const chat = ai.chats.create({
          model: "gemini-4-hydrogen",
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
          ...(normalizedHistory.length > 0 ? { history: normalizedHistory } : {}),
        });

        const aiCall = chat.sendMessage({ message: userQuery });
        const timeoutCall = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini chat timeout (15s)")), 15000)
        );

        const response: any = await Promise.race([aiCall, timeoutCall]);
        const replyText = response?.text?.trim() || "";
        if (replyText) {
          return res.json({ reply: replyText, aiPowered: true });
        }
        geminiFallbackReason = "empty_response";
      } catch (geminiChatErr: any) {
        geminiFallbackReason = String(geminiChatErr?.message || geminiChatErr || "unknown_error").slice(0, 180);
        console.warn("⚠️ [ColorLink Chat Gemini fallback]:", geminiFallbackReason);
      }
    } else {
      geminiFallbackReason = "missing_api_key";
    }

    // 2. SMART NATURAL-LANGUAGE FALLBACK ENGINE (when GEMINI_API_KEY is not configured or temporarily unavailable)
    const normalizeText = (s: string) =>
      s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const cleanQuery = normalizeText(userQuery);
    const recentHistoryText = Array.isArray(history)
      ? normalizeText(
          history
            .slice(-4)
            .map((h: any) => h?.text || "")
            .join(" ")
        )
      : "";
    const combinedContext = `${cleanQuery} ${recentHistoryText}`;

    const offTopicTerms = [
      "receta", "cocinar", "arroz", "pastel", "pizza", "hamburguesa", "almuerzo", "desayuno", "cena",
      "codigo", "python", "javascript", "typescript", "react", "programar", "programacion", "software", "html", "css", "algoritmo",
      "futbol", "champions", "messi", "ronaldo", "mundial", "balon", "estadio",
      "politica", "presidente", "elecciones", "congreso", "alcalde", "senado", "guerra",
      "chiste", "cuento", "poema", "cancion", "musica", "cantar",
      "tarea", "algebra", "derivada", "integral", "quimica organica", "fisica cuantica",
      "filosofia", "astronomia", "horoscopo", "zodiaco",
      "novio", "novia", "casamiento",
      "pastilla", "medicamento", "enfermedad", "remedio casero", "dolor de cabeza",
      "perro", "gato", "mascota", "veterinario", "avion", "hotel", "turismo", "capital de",
    ];

    const paintContextHints = [
      "pint", "viniltex", "koraza", "pintulux", "madetec", "sellomax", "aquablock", "epox",
      "galon", "caneca", "cuarto", "brocha", "rodillo", "airless", "espatula", "lija",
      "muro", "pared", "techo", "fachada", "superficie", "sustrato", "humedad", "salitre", "moho", "hongo", "gotera",
      "oxido", "metal", "reja", "porton", "hierro", "acero", "madera", "puerta", "ventana", "deck", "mueble",
      "piso", "concreto", "estuco", "drywall", "cielo raso", "losa", "terraza", "balcon", "cubierta",
      "bano", "cocina", "sala", "habitacion", "cuarto", "pieza", "comedor", "apartamento", "casa", "bodega", "garaje",
      "secado", "rendimiento", "rinde", "metros", "m2", "color", "tono", "mate", "satinado", "brillante", "acabado",
      "colorlink", "pedido", "cotiz", "esmalte", "anticorrosivo", "imprimante", "sellador", "lavab",
      "dilu", "curado", "mano", "descascara", "ampolla", "caleo", "grieta", "fisura", "impermeabiliz",
      "recubrimiento", "precio", "cuesta", "vale", "presupuesto", "tienda", "comprar", "pago", "pse", "tarjeta",
      "contraentrega", "envio", "domicilio", "factura", "garantia", "estado", "asesor", "hola", "buen", "gracias",
      "saludos", "ayuda", "servicio", "pintuco", "remodel", "renovar", "mancha",
    ];

    const hasOffTopic = offTopicTerms.some((t) => cleanQuery.includes(t));
    const hasPaintContext = paintContextHints.some((k) => cleanQuery.includes(k));
    const isFollowUpQuestion =
      /\b(cuanto|cuantos|vale|cuesta|precio|manos|tiempo|secado|color|galon|litros|y si|mejor|para|ese|esa|eso|ahi)\b/.test(cleanQuery) &&
      paintContextHints.some((k) => recentHistoryText.includes(k));

    if (hasOffTopic && !hasPaintContext) {
      return res.json({
        reply:
          "Disculpa, como asesor técnico de **ColorLink Pintuco** solo puedo ayudarte con consultas sobre pinturas, recubrimientos, preparación de superficies, cálculo de materiales, colores y servicios de nuestra plataforma. ¿En qué proyecto de pintura te puedo asesorar?",
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    // Parse area in m² (supports "40 m2", "40 metros", "5x4", "5 por 4")
    const parseAreaM2 = (txt: string): number | null => {
      const dimMatch = txt.match(/(\d+(?:[.,]\d+)?)\s*(?:x|por|\*)\s*(\d+(?:[.,]\d+)?)/);
      if (dimMatch) {
        const w = parseFloat(dimMatch[1].replace(",", "."));
        const h = parseFloat(dimMatch[2].replace(",", "."));
        if (w > 0 && h > 0 && w * h <= 50000) return Math.round(w * h * 10) / 10;
      }
      const m2Match = txt.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|m²|metros?(?:\s*cuadrados?)?)/);
      if (m2Match) {
        const val = parseFloat(m2Match[1].replace(",", "."));
        if (val > 0 && val <= 100000) return val;
      }
      return null;
    };

    const detectedArea =
      parseAreaM2(cleanQuery) ||
      parseAreaM2(recentHistoryText) ||
      (projectContext?.areaM2 ? Number(projectContext.areaM2) : null);

    const coatsMatch = cleanQuery.match(/(\d)\s*manos?/);
    const requestedCoats = coatsMatch ? Math.min(4, Math.max(1, parseInt(coatsMatch[1], 10))) : null;

    const formatCOPVal = (val: number) =>
      new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);

    const buildAreaCalcText = (productName: string, yieldM2: number, pricePerGal: number, defaultCoats = 2) => {
      if (!detectedArea) return "";
      const coats = requestedCoats || defaultCoats;
      const exactGallons = (detectedArea * coats) / yieldM2;
      const neededGallons = Math.max(1, Math.ceil(exactGallons));
      const estTotal = neededGallons * pricePerGal;
      const sellomaxGallons = Math.max(1, Math.ceil(detectedArea / 42));
      return `\n\n📐 **Cálculo estimado para ${detectedArea} m² (${coats} manos):**\n• **${productName}:** necesitas aprox. **${neededGallons} ${neededGallons === 1 ? "galón" : "galones"}** (${exactGallons.toFixed(1)} gal teóricos a ${yieldM2} m²/gal) ≈ **${formatCOPVal(estTotal)} COP**.\n• Si el muro está nuevo o muy poroso, suma **${sellomaxGallons} ${sellomaxGallons === 1 ? "galón" : "galones"} de Sellomax®** (${formatCOPVal(sellomaxGallons * 62000)} COP) para ahorrar hasta un 25% de pintura.`;
    };

    // Greeting only
    if (/^(hola|buenas?|buenos dias|buenas tardes|buenas noches|saludos|que tal|hey)\b/.test(cleanQuery) && cleanQuery.length < 35) {
      return res.json({
        reply: `¡Hola! Soy **ColorLink Bot**, tu asesor técnico de Pintuco.\n\nCuéntame con tus propias palabras qué necesitas pintar o resolver — por ejemplo: *"quiero pintar una sala de 35 m²"*, *"tengo humedad en un muro del baño"*, *"cómo protejo una reja oxidada"* o dudas sobre pedidos en **Comprar Directo**. ¿En qué trabajamos hoy?`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/^(gracias|muchas gracias|excelente|perfecto|listo|ok|vale)\b/.test(cleanQuery) && cleanQuery.length < 35) {
      return res.json({
        reply: `¡Con mucho gusto! Si deseas calcular galones exactos, comparar acabados o generar una cotización formal, puedes usar **Nueva Solicitud** o comprar directo en **Comprar Directo**. Aquí sigo atento por si tienes otra pregunta.`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    // Check contextual / topic intents naturally
    if (/(humedad|salitre|moho|hongo|gotera|filtracion|eflorescencia|mancha negra|lluvia adentro)/.test(combinedContext)) {
      return res.json({
        reply: `Para resolver **humedad, salitre o moho** de raíz sin que vuelva a levantarse la pintura:\n\n1. **Corrige la fuente:** Repara filtraciones, tuberías o grietas exteriores antes de pintar.\n2. **Limpieza y desinfección:** Raspa pintura floja y lava con solución de hipoclorito (cloro diluido 1:3) para matar esporas de moho; enjuaga y deja secar 24–48 h.\n3. **Barrera antihumedad:** Aplica 2 manos de **Aquablock®** (espera 4 h entre manos).\n4. **Acabado:** Termina con **Viniltex® Baños y Cocinas** o **Viniltex® Avanzado Antibacterial** ($94.500 COP/gal).${buildAreaCalcText("Viniltex® Avanzado", 35, 94500, 2)}`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(terraza|balcon|cubierta|losa|teja|impermeabiliz)/.test(combinedContext)) {
      return res.json({
        reply: `Para impermeabilizar **terrazas, losas o cubiertas** expuestas a lluvia constante:\n\n• **Producto ideal:** **Aquablock® Membrana Impermeabilizante Fibrada** ($148.000 COP/gal, SKU \`PT-AQ-6001\`).\n• **Aplicación:** Superficie limpia y seca; 1ra mano diluida para imprimar + 2 manos puras cruzadas (total 3 manos, esperando 4–6 h entre capas).\n• **Rendimiento:** ~15 m²/galón sistema completo.${buildAreaCalcText("Aquablock® Membrana Fibrada", 15, 148000, 3)}`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(bano|cocina|vapor|grasa|ducha)/.test(combinedContext)) {
      return res.json({
        reply: `Para **baños y cocinas** (alta condensación de vapor y limpieza frecuente):\n\n• **Preparación clave:** En cocina desengrasa muy bien el muro antes de lijar; si hubo moho en baño, desinfecta con hipoclorito y deja secar.\n• **Recomendado:** **Viniltex® Avanzado Antibacterial** ($94.500 COP/gal, rinde 35 m²/gal) o **Viniltex® Baños y Cocinas** en acabado **Satinado**, porque resiste vapor, hongos y lavado frecuente.${buildAreaCalcText("Viniltex® Avanzado Antibacterial", 35, 94500, 2)}`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(metal|oxido|reja|porton|hierro|acero|estructura|soldadura|puerta metalica)/.test(combinedContext)) {
      return res.json({
        reply: `Para **metales, rejas o portones** (nuevos o con óxido):\n\n1. **Preparación:** Retira el óxido suelto con cepillo de alambre y lija grano 80–120; limpia polvo y grasa con solvente.\n2. **Producto recomendado:** **Pintulux® 3 en 1 Anticorrosivo** ($105.000 COP/gal, SKU \`PT-PL-3001\`) — actúa como anticorrosivo, imprimante y esmalte de acabado.\n3. **Aplicación:** 2 manos dejando secar **6 a 8 horas** entre cada una.\n*(Para estructuras industriales o tanques de alta exigencia química, usa **Pintuco EpoxiPoliamida** a $215.000 COP/gal).*${buildAreaCalcText("Pintulux® 3 en 1 Anticorrosivo", 32, 105000, 2)}`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(madera|mueble|closet|deck|pergola|barniz|laca|puerta de madera)/.test(combinedContext)) {
      return res.json({
        reply: `Para **madera, puertas, muebles o decks** te recomiendo la línea **Madetec® de Pintuco**:\n\n• **Producto destacado:** **Madetec® Barniz Poliuretano Filtro UV** ($98.000 COP/gal, rinde ~30 m²/gal).\n• **Preparación:** Lija siempre en el sentido de la veta (grano 180 y luego 240 para acabado fino) y retira todo el polvillo.\n• **Manos recomendadas:** 3 manos delgadas esperando **6 horas** entre cada mano.${buildAreaCalcText("Madetec® Barniz Poliuretano", 30, 98000, 3)}`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(piso|garaje|parqueadero|bodega|cancha|trafico|epox)/.test(combinedContext)) {
      return res.json({
        reply: `Para **pisos, garajes, bodegas o alto tráfico**:\n\n• **Sistema recomendado:** **Pintuco EpoxiPoliamida Alto Desempeño** ($215.000 COP/gal, SKU \`PT-EP-8090\`, rinde ~22 m²/gal a 2 manos).\n• **Requisitos clave:** El concreto debe estar completamente curado (mín. 28 días si es nuevo), libre de aceites y con poro abierto (lijado/lavado ácido). Secado entre manos: **12 a 24 horas**.${buildAreaCalcText("Pintuco EpoxiPoliamida", 22, 215000, 2)}`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(fachada|exterior|intemperie|sol directo|fisura|grieta|muro exterior)/.test(combinedContext)) {
      return res.json({
        reply: `Para **fachadas y muros exteriores** sometidos a sol y lluvia:\n\n• **Producto insignia:** **Koraza® Máxima Protección 10 Años** ($138.000 COP/gal, SKU \`PT-KZ-4020\`, rinde **28 m²/gal**).\n• **Si hay microfisuras:** Elige **Koraza® Elastomérica**, que puentea grietas leves evitando filtraciones.\n• **Secado:** 1 hora al tacto y **4 a 6 horas** entre manos.${buildAreaCalcText("Koraza® Máxima Protección", 28, 138000, 2)}`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(color|tono|combinar|mate|satinado|brillante|acabado|elegante|pequeno|iluminar)/.test(combinedContext)) {
      return res.json({
        reply: `Para elegir **color y acabado** en tu espacio:\n\n• **Acabado Mate:** Disimula imperfecciones del estuco y da un look elegante; ideal para techos, salas y habitaciones.\n• **Acabado Satinado:** Brillo suave y **máxima lavabilidad**; ideal para pasillos, cuartos infantiles, baños y cocinas.\n• **Consejo de color:** Tonos como *Blanco Lienzo*, *Arena Cálido* o *Gris Urbano* amplían visualmente espacios pequeños. Puedes probar combinaciones directamente en el **Selector de Color** dentro de **Nueva Solicitud** o **Comprar Directo**.`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(brocha|rodillo|airless|pistola|herramienta|dilu|agua|thinner|solvente|estuco|sellador|sellomax|drywall)/.test(combinedContext)) {
      return res.json({
        reply: `Guía rápida de **preparación, dilución y herramientas**:\n\n• **Muros nuevos / Drywall / Estuco:** Aplica primero 1 mano de **Sellomax®** ($62.000 COP/gal, rinde 42 m²/gal). Sella la porosidad y aumenta el rendimiento de la pintura hasta un 25%.\n• **Dilución:** En pinturas base agua (Viniltex / Koraza) diluye máximo **10% con agua limpia** en primera mano y **5%–10%** en segunda. En esmaltes (Pintulux) usa ajustador/solvente según ficha.\n• **Herramientas:** Rodillo de microfibra 3/8" para superficies lisas (3/4" si es rústica) y brocha de cerda sintética para recortes en agua.`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(secado|curado|tiempo|esperar|cuanto tarda|demora en secar|llueve)/.test(combinedContext)) {
      return res.json({
        reply: `Tiempos oficiales de **secado y curado**:\n\n• **Viniltex® (Interiores):** Al tacto en **30–45 min** | Segunda mano en **2–4 horas**.\n• **Koraza® (Exteriores):** Al tacto en **1 hora** | Segunda mano en **4–6 horas** (no aplicar si amenaza lluvia en las próximas 4 horas).\n• **Pintulux® / Madetec®:** Entre manos **6–8 horas**.\n• **Curado total (lavabilidad plena):** **7 a 14 días** (evita refregar el muro antes de ese tiempo).`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(sala|habitacion|cuarto|pieza|comedor|apartamento|casa|interior|oficina|techo|cielo raso|pared|muro|remodel|renovar)/.test(combinedContext) || detectedArea) {
      return res.json({
        reply: `Para pintar **interiores (sala, habitaciones, paredes o techos)** el sistema recomendado es:\n\n1. **Sellado (si el muro es nuevo o está estucado):** 1 mano de **Sellomax®** ($62.000 COP/gal, rinde 42 m²/gal).\n2. **Acabado:** 2 manos de **Viniltex® Avanzado Antibacterial** ($94.500 COP/gal, rinde **35 m²/gal**).\n3. **Tip técnico:** Lija suavemente con grano 180–220 para uniformar, limpia el polvo y deja **2 a 4 horas** entre manos.${buildAreaCalcText("Viniltex® Avanzado Antibacterial", 35, 94500, 2)}`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (/(precio|cuesta|vale|presupuesto|galon|rendimiento|rinde|comprar|tienda|pago|pse|tarjeta|contraentrega|envio|domicilio|factura|garantia|pedido|cotiz|estado|seguimiento|asesor|plantas|cedi|servicio|colorlink)/.test(combinedContext) || isFollowUpQuestion) {
      return res.json({
        reply: `En **ColorLink Pintuco** tienes dos caminos según lo que necesites:\n\n• **Comprar Directo (Sin proyecto):** Entra a *Comprar Directo*, elige presentación (**1/4 Gal, Galón o Caneca 5 Gal**) y color, paga con **PSE, Tarjeta o Contraentrega** y recibe tu **factura electrónica** por correo.\n• **Cotización Técnica con IA:** Crea una *Nueva Solicitud* con las medidas en m² y foto de tu superficie; podrás seguir el estado paso a paso en *Estado del Proyecto*.\n\n**Precios de referencia (por galón):** Viniltex Avanzado **$94.500** • Sellomax **$62.000** • Madetec **$98.000** • Pintulux 3 en 1 **$105.000** • Koraza **$138.000** • Aquablock **$148.000** • EpoxiPoliamida **$215.000 COP**.`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    if (!hasPaintContext && !isFollowUpQuestion) {
      return res.json({
        reply: `Disculpa, como asistente especializado de **ColorLink Pintuco** solo atiendo consultas sobre pinturas, recubrimientos, preparación de superficies, cálculo de galones/colores y servicios de nuestra plataforma. ¿Tienes algún proyecto de pintura en mente?`,
        aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
      });
    }

    return res.json({
      reply: `¡Claro! Cuéntame un poco más de detalle sobre tu superficie (por ejemplo si es **pared interior, fachada exterior, metal, madera, piso o terraza**, si tiene humedad/óxido y cuántos **m² aproximados** son) para recomendarte el producto Pintuco exacto, el paso a paso de preparación y los galones necesarios.`,
      aiPowered: false, ...(geminiFallbackReason ? { aiFallbackReason: geminiFallbackReason } : {}),
    });
  } catch (error: any) {
    console.error("Error in chat endpoint:", error);
    res.status(500).json({ error: "Error procesando chat de soporte técnico" });
  }
});

// Vite middleware configuration for Development and Static Serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Auto-initialize PostgreSQL tables if DATABASE_URL is configured
  await initDatabaseTables();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ColorLink Server running on http://localhost:${PORT}`);
  });
}

startServer();
