import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  sendWelcomeEmail,
  sendInvoiceEmail,
  sendProjectStatusEmail,
} from "./serverEmailService";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Server-side Gemini AI Client with User-Agent telemetry
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
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

// PostgreSQL Connection Pool (Render PostgreSQL or any standard Postgres URI)
let dbPool: any = null;

function getDbPool() {
  if (dbPool) return dbPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  // Import pg dynamically or use standard Pool
  const { Pool } = require("pg");
  const isSslNeeded = connectionString.includes("render.com") || process.env.NODE_ENV === "production" || connectionString.includes("sslmode=require");
  dbPool = new Pool({
    connectionString,
    ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
  });
  return dbPool;
}

// Auto-initialize Render PostgreSQL schema on startup
async function initDatabaseTables() {
  const pool = getDbPool();
  if (!pool) {
    console.log("ℹ️ [Database] No DATABASE_URL detectada. Usando almacenamiento local/memoria.");
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
      `);
      console.log("✅ [Render PostgreSQL] Tablas 'users', 'project_requests' y 'direct_orders' listas y verificadas.");
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error("⚠️ [Render PostgreSQL] Error al inicializar tablas:", err.message);
  }
}

// Render PostgreSQL Status Endpoint
app.get("/api/db/status", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({
      configured: false,
      connected: false,
      provider: "Render PostgreSQL",
      message: "DATABASE_URL no configurada en las variables de entorno de Render",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const result = await pool.query("SELECT NOW() as current_time, version() as version;");
    return res.json({
      configured: true,
      connected: true,
      provider: "Render PostgreSQL",
      serverTime: result.rows[0]?.current_time,
      version: result.rows[0]?.version?.split(" ")?.slice(0, 2)?.join(" "),
      message: "Conectado exitosamente a la base de datos PostgreSQL de Render",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      configured: true,
      connected: false,
      provider: "Render PostgreSQL",
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Render PostgreSQL: Read & Sync Project Requests
app.get("/api/db/projects", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, projects: [] });
  }

  try {
    const result = await pool.query("SELECT * FROM project_requests ORDER BY created_at DESC;");
    const formatted = result.rows.map((row: any) => ({
      id: row.id,
      clientName: row.client_name,
      clientEmail: row.client_email,
      clientPhone: row.client_phone,
      clientType: row.client_type,
      surfaceType: row.surface_type,
      environment: row.environment,
      condition: row.condition,
      areaM2: Number(row.area_m2),
      city: row.city,
      comments: row.comments,
      status: row.status,
      assignedAdvisor: row.assigned_advisor,
      aiDiagnosis: row.ai_diagnosis,
      formulation: row.formulation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    return res.json({ success: true, projects: formatted });
  } catch (err: any) {
    console.error("Error fetching projects from PostgreSQL:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Render PostgreSQL: Upsert Project Request
app.post("/api/db/projects", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, message: "No DATABASE_URL configured" });
  }

  const p = req.body;
  if (!p || !p.id || !p.clientName) {
    return res.status(400).json({ success: false, error: "Datos de proyecto incompletos" });
  }

  try {
    await pool.query(
      `INSERT INTO project_requests (
        id, client_name, client_email, client_phone, client_type,
        surface_type, environment, condition, area_m2, city,
        comments, status, assigned_advisor, ai_diagnosis, formulation, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
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
        updated_at = NOW();`,
      [
        p.id,
        p.clientName,
        p.clientEmail || null,
        p.clientPhone || null,
        p.clientType || 'Particular',
        p.surfaceType || 'Pared',
        p.environment || 'Interior',
        p.condition || 'Nuevo',
        p.areaM2 || 0,
        p.city || 'Bogotá',
        p.comments || null,
        p.status || 'Registrada',
        p.assignedAdvisor || null,
        JSON.stringify(p.aiDiagnosis || null),
        JSON.stringify(p.formulation || null),
      ]
    );
    return res.json({ success: true, id: p.id });
  } catch (err: any) {
    console.error("Error upserting project into PostgreSQL:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Render PostgreSQL: Read & Sync Direct Orders
app.get("/api/db/orders", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, orders: [] });
  }

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
    console.error("Error fetching orders from PostgreSQL:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Render PostgreSQL: Insert Direct Order with Email Invoice
app.post("/api/db/orders", async (req, res) => {
  const pool = getDbPool();
  const o = req.body;
  if (!o || !o.id || !o.sapOrderCode) {
    return res.status(400).json({ success: false, error: "Datos de orden incompletos" });
  }

  // Trigger invoice email asynchronously regardless of DB mode
  if (o.customerEmail) {
    sendInvoiceEmail({
      id: o.id,
      sapOrderCode: o.sapOrderCode,
      customerName: o.customerName || "Cliente Pintuco",
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone || "",
      deliveryAddress: o.deliveryAddress || "Dirección registrada",
      deliveryCity: o.deliveryCity || "Colombia",
      paymentMethod: o.paymentMethod || "PSE",
      subtotal: Number(o.subtotal) || 0,
      discount: Number(o.discount) || 0,
      iva: Number(o.iva) || 0,
      shipping: Number(o.shipping) || 0,
      total: Number(o.total) || 0,
      status: o.status || "Pagado y Confirmado",
      items: o.items || [],
    }).catch((err) => console.error("Error enviando factura por correo:", err));
  }

  if (!pool) {
    return res.json({ success: true, fallback: true, id: o.id, sapOrderCode: o.sapOrderCode });
  }

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
        o.id,
        o.sapOrderCode,
        o.customerName || "Cliente Pintuco",
        o.customerEmail || "",
        o.customerPhone || "",
        o.deliveryAddress || "",
        o.deliveryCity || "",
        o.paymentMethod || "PSE",
        o.subtotal || 0,
        o.discount || 0,
        o.iva || 0,
        o.shipping || 0,
        o.total || 0,
        o.status || "Pagado y Confirmado",
        JSON.stringify(o.items || []),
      ]
    );
    return res.json({ success: true, id: o.id, sapOrderCode: o.sapOrderCode });
  } catch (err: any) {
    console.error("Error inserting order into PostgreSQL:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Render PostgreSQL: Register User with Welcome Email
app.post("/api/auth/register", async (req, res) => {
  const pool = getDbPool();
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

  const userId = id || `USR-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

  // Trigger welcome email asynchronously
  sendWelcomeEmail({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    role: role || "Constructora / Arquitecto",
    documentType: documentType || "NIT",
    documentNumber: documentNumber || "",
    phone: phone || "",
    city: city || "Bogotá",
    companyName: companyName || undefined,
  }).catch((err) => console.error("Error enviando correo de bienvenida:", err));

  if (!pool) {
    // Local / fallback mode when no DATABASE_URL configured
    return res.json({
      success: true,
      fallback: true,
      user: {
        id: userId,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: role || "Constructora / Arquitecto",
        documentType: documentType || "NIT",
        documentNumber: documentNumber || "",
        phone: phone || "",
        city: city || "Bogotá",
        companyName: companyName || null,
        createdAt: new Date().toISOString().split("T")[0],
      },
    });
  }

  try {
    // Check if email already registered
    const existing = await pool.query("SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;", [
      email.trim(),
    ]);

    if (existing.rows && existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: "El correo electrónico ya se encuentra registrado en ColorLink Pintuco.",
      });
    }

    const query = `
      INSERT INTO users (
        id, full_name, email, password_hash, role, document_type,
        document_number, phone, city, company_name, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING id, full_name, email, role, document_type, document_number, phone, city, company_name, created_at;
    `;

    const result = await pool.query(query, [
      userId,
      fullName.trim(),
      email.trim().toLowerCase(),
      password, // Stored credential
      role || "Constructora / Arquitecto",
      documentType || "NIT",
      documentNumber || "",
      phone || "",
      city || "Bogotá",
      companyName || null,
    ]);

    const created = result.rows[0];
    return res.json({
      success: true,
      user: {
        id: created.id,
        fullName: created.full_name,
        email: created.email,
        role: created.role,
        documentType: created.document_type,
        documentNumber: created.document_number,
        phone: created.phone,
        city: created.city,
        companyName: created.company_name,
        createdAt: created.created_at,
      },
    });
  } catch (err: any) {
    console.error("Error registering user in Render PostgreSQL:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Notifications: Send Project Status Update Email
app.post("/api/notifications/project-status", async (req, res) => {
  const { project, previousStatus, newStatus } = req.body || {};
  if (!project || !project.clientEmail) {
    return res.status(400).json({ success: false, error: "Proyecto o correo de cliente no especificado" });
  }

  try {
    const result = await sendProjectStatusEmail({
      id: project.id,
      clientName: project.clientName || "Cliente Pintuco",
      clientEmail: project.clientEmail,
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

// Notifications: Test Email Configuration (Resend & SMTP Diagnostic Endpoint)
app.post("/api/test/email", async (req, res) => {
  const { toEmail } = req.body || {};
  const targetEmail = toEmail || process.env.SMTP_USER || "test@colorlink.com";

  try {
    const result = await sendWelcomeEmail({
      fullName: "Prueba Técnica de Notificaciones",
      email: targetEmail,
      role: "Especialista Técnico Pintuco",
      city: "Medellín / Bogotá",
    });
    return res.json({
      success: true,
      result,
      resendConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== ""),
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      providerUsed: result.provider || (result.simulated ? "Simulator" : "Unknown"),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Render PostgreSQL: Login User
app.post("/api/auth/login", async (req, res) => {
  const pool = getDbPool();
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Correo y contraseña son requeridos" });
  }

  if (!pool) {
    return res.json({ success: false, fallback: true, message: "No DATABASE_URL configured" });
  }

  try {
    const result = await pool.query(
      "SELECT id, full_name, email, password_hash, role, document_type, document_number, phone, city, company_name, avatar_url, created_at FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1;",
      [email.trim()]
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    const row = result.rows[0];
    if (row.password_hash && row.password_hash !== password) {
      return res.status(401).json({ success: false, error: "Contraseña incorrecta" });
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
  } catch (err: any) {
    console.error("Error logging in with PostgreSQL:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Render PostgreSQL: Upsert User Profile
app.post("/api/db/users", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true });
  }

  const u = req.body;
  if (!u || !u.email) {
    return res.status(400).json({ success: false, error: "Datos de usuario incompletos" });
  }

  const userId = u.id || `USR-${Date.now()}`;

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
        u.email.toLowerCase(),
        u.role || "Cliente Particular",
        u.documentType || "Cédula de Ciudadanía",
        u.documentNumber || "",
        u.phone || "",
        u.city || "Bogotá",
        u.companyName || null,
      ]
    );
    return res.json({ success: true, id: userId });
  } catch (err: any) {
    console.error("Error upserting user in PostgreSQL:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Render PostgreSQL: Get All Users (Admin / Registry)
app.get("/api/db/users", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.json({ success: false, fallback: true, users: [] });
  }

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
    console.error("Error fetching users from PostgreSQL:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
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

    // If Gemini is available, we call gemini-3.8-flash with structured reasoning
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
          model: "gemini-3.8-flash",
          contents,
          config: {
            responseMimeType: "application/json",
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

// ColorLink Technical Advisor Chatbot endpoint
app.post("/api/colorlink/chat", async (req, res) => {
  try {
    const { message, projectContext } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      try {
        const systemInstruction = `Eres "ColorLink AI", el asesor experto y asistente técnico de recubrimientos de Pintuco Colombia.
Tu misión es asistir a ingenieros, contratistas, arquitectos y clientes en la selección técnica de pinturas, cálculos de rendimiento, formulaciones especiales, protocolos de calidad, tiempos de secado y resolución de patologías de recubrimiento (ampollamiento, eflorescencia, caleo, corrosión).
Sé claro, conciso, profesional y cita productos reales Pintuco (Viniltex, Koraza, Pintulux, Madetec, Sellomax, Aquablock, Epóxicos, Uretanos).`;

        const contents = `Contexto del proyecto actual: ${JSON.stringify(projectContext || {})}
Pregunta del usuario: ${message}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction,
          },
        });

        return res.json({ reply: response.text || "Disculpa, no pude procesar la consulta técnica." });
      } catch (geminiChatErr) {
        console.warn("Gemini chat error, using fallback reply:", geminiChatErr);
      }
    }

    // Responsive fallback reply
    const replies: Record<string, string> = {
      default: `Para tu proyecto con Pintuco en el ecosistema ColorLink, te recomendamos utilizar un sistema multicapa: primero aplicar 1 mano de Sellador/Imprimante Sellomax® para uniformizar la absorción, seguido de 2 manos de Viniltex® Avanzado (en interiores) o Koraza® Máxima Protección (en exteriores). Esto garantiza una cobertura de hasta 35 m²/galón y una durabilidad certificada.`,
    };

    return res.json({ reply: replies.default });
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
