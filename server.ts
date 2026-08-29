import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

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

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ColorLink - Pintuco AI Intelligent Ecosystem" });
});

// AI Diagnostic & Technical Formulation endpoint
app.post("/api/colorlink/diagnose", async (req, res) => {
  try {
    const {
      clientName,
      surfaceType,
      condition,
      environment,
      areaM2,
      city,
      comments,
      photoBase64,
    } = req.body;

    const ai = getGeminiClient();

    // If Gemini is available, we call gemini-3.7-flash with structured reasoning
    if (ai) {
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
        model: "gemini-3.7-flash",
        contents,
        config: {
          responseMimeType: "application/json",
        },
      });

      const text = response.text || "{}";
      try {
        const parsed = JSON.parse(text);
        return res.json({ success: true, diagnosis: parsed, aiPowered: true });
      } catch (err) {
        console.error("Error parsing Gemini JSON:", err);
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
    res.status(500).json({ success: false, error: error?.message || "Internal server error" });
  }
});

// ColorLink Technical Advisor Chatbot endpoint
app.post("/api/colorlink/chat", async (req, res) => {
  try {
    const { message, projectContext } = req.body;
    const ai = getGeminiClient();

    if (ai) {
      const systemInstruction = `Eres "ColorLink AI", el asesor experto y asistente técnico de recubrimientos de Pintuco Colombia.
Tu misión es asistir a ingenieros, contratistas, arquitectos y clientes en la selección técnica de pinturas, cálculos de rendimiento, formulaciones especiales, protocolos de calidad, tiempos de secado y resolución de patologías de recubrimiento (ampollamiento, eflorescencia, caleo, corrosión).
Sé claro, conciso, profesional y cita productos reales Pintuco (Viniltex, Koraza, Pintulux, Madetec, Sellomax, Aquablock, Epóxicos, Uretanos).`;

      const contents = `Contexto del proyecto actual: ${JSON.stringify(projectContext || {})}
Pregunta del usuario: ${message}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents,
        config: {
          systemInstruction,
        },
      });

      return res.json({ reply: response.text || "Disculpa, no pude procesar la consulta técnica." });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ColorLink Server running on http://localhost:${PORT}`);
  });
}

startServer();
