import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Local JSON Database Persistence
const DB_FILE = path.join(process.cwd(), "db.json");

interface DbSchema {
  producers: any[];
  products: any[];
  orders: any[];
  users: any[];
  reviews?: any[];
  stories?: any[];
}

const DEFAULT_DB: DbSchema = {
  producers: [],
  products: [],
  orders: [],
  users: [],
  reviews: [],
  stories: [],
};

const FAKE_PRODUCER_IDS = new Set(["prod_vivian", "prod_leo"]);
const FAKE_USER_IDS = new Set(["usr_vivian", "usr_leo", "usr_julia"]);
const FAKE_REVIEW_IDS = new Set(["rev_1", "rev_2"]);
const FAKE_STORY_IDS = new Set(["story_vivian_1", "story_leo_1"]);

function buildProducerFromServerUser(user: any) {
  const producerId = user.producerId || user.farmId || `prod_${user.id}`;
  const cleanPhone = user.phone || "";
  const numericPhone = String(cleanPhone).replace(/\D/g, "");
  return {
    id: producerId,
    name: user.name || "Vendedor ConeQta",
    farmName: user.farmName || `Loja de ${user.name || "Vendedor"}`,
    tagline: `Produtos e serviços locais em ${user.neighborhood || "Queimados"}`,
    bio: `Empreendedor(a) local de ${user.neighborhood || "Queimados"}, RJ.`,
    story: "Bem-vindo ao meu espaço no ConeQta Queimados!",
    avatar: user.avatar || "",
    avatarBgColor: user.avatarBgColor || "#4E553D",
    coverImage: "",
    coverBgColor: user.coverBgColor || "#1F6B38",
    galleryImages: [],
    location: {
      city: user.city || "Queimados",
      state: "RJ",
      neighborhood: user.neighborhood || "Queimados",
      address: `${user.neighborhood || "Queimados"}, Queimados - RJ`,
      distanceKm: 1.0,
    },
    rating: 0,
    reviewCount: 0,
    certifications: [],
    phone: cleanPhone,
    whatsapp: numericPhone
      ? numericPhone.startsWith("55")
        ? numericPhone
        : `55${numericPhone}`
      : "",
    establishedYear: new Date().getFullYear(),
    harvestDays: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
    deliveryMethods: ["Retirada no Local"],
    specialty: "Comércio Local",
    viewsCount: 0,
    category: "outros",
  };
}

function readDb(): DbSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed: DbSchema = JSON.parse(data);
      const producers = (parsed.producers || []).filter((p: any) => !FAKE_PRODUCER_IDS.has(p.id));
      const users = (parsed.users || []).filter((u: any) => !FAKE_USER_IDS.has(u.id));
      const reviews = (parsed.reviews || []).filter(
        (r: any) => !FAKE_REVIEW_IDS.has(r.id) && !FAKE_PRODUCER_IDS.has(r.producerId)
      );
      const stories = (parsed.stories || []).filter(
        (s: any) => !FAKE_STORY_IDS.has(s.id) && !FAKE_PRODUCER_IDS.has(s.producerId)
      );
      return {
        ...parsed,
        producers,
        users,
        reviews,
        stories,
      };
    }
  } catch (err) {
    console.error("Erro ao ler db.json:", err);
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), "utf-8");
  return DEFAULT_DB;
}

function writeDb(db: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar db.json:", err);
  }
}

// Database API Endpoints for Entrepreneurs (Producers)
app.get("/api/producers", (_req, res) => {
  const db = readDb();
  const producers = [...(db.producers || [])];
  let changed = false;

  // Ensure every user registered with role === 'producer' is visible in producers
  for (const u of db.users || []) {
    if (u.role === "producer") {
      const targetId = u.producerId || u.farmId || `prod_${u.id}`;
      const exists = producers.some(
        (p: any) => p.id === targetId || p.id === u.id || (p.name && u.name && p.name === u.name && p.phone === u.phone)
      );
      if (!exists) {
        producers.unshift(buildProducerFromServerUser(u));
        changed = true;
      }
    }
  }

  if (changed) {
    db.producers = producers;
    writeDb(db);
  }

  res.json(producers);
});

app.get("/api/producers/:id", (req, res) => {
  const db = readDb();
  const producer = db.producers?.find((p) => p.id === req.params.id);
  if (!producer) {
    return res.status(404).json({ error: "Empreendedor não encontrado" });
  }
  res.json(producer);
});

app.put("/api/producers/:id", (req, res) => {
  const db = readDb();
  db.producers = db.producers || [];
  const index = db.producers.findIndex((p) => p.id === req.params.id);
  const updatedProducer = { ...req.body, id: req.params.id };

  if (index >= 0) {
    db.producers[index] = { ...db.producers[index], ...updatedProducer };
  } else {
    db.producers.unshift(updatedProducer);
  }
  writeDb(db);
  res.json({ success: true, producer: updatedProducer });
});

app.delete("/api/producers/:id", (req, res) => {
  const db = readDb();
  const targetId = req.params.id;
  db.producers = (db.producers || []).filter((p: any) => p.id !== targetId);
  db.products = (db.products || []).filter((p: any) => p.producerId !== targetId);
  db.stories = (db.stories || []).filter((s: any) => s.producerId !== targetId);
  db.reviews = (db.reviews || []).filter((r: any) => r.producerId !== targetId);
  writeDb(db);
  res.json({ success: true });
});

// Database API Endpoints for Registered Users (safe fields only on GET)
app.get("/api/users", (_req, res) => {
  const db = readDb();
  const safeUsers = (db.users || []).map(({ password: _pw, ...rest }) => rest);
  res.json(safeUsers);
});

app.post("/api/users", (req, res) => {
  const db = readDb();
  db.users = db.users || [];
  const incoming = req.body;
  if (!incoming || !incoming.id) {
    return res.status(400).json({ error: "Dados de usuário inválidos" });
  }
  const { password: _pw, ...safeUser } = incoming;
  const idx = db.users.findIndex((u: any) => u.id === incoming.id || (u.email && incoming.email && u.email.toLowerCase() === incoming.email.toLowerCase()));
  if (idx >= 0) {
    db.users[idx] = { ...db.users[idx], ...safeUser };
  } else {
    db.users.unshift(safeUser);
  }

  // Automatically create seller entry if role === 'producer'
  if (safeUser.role === "producer") {
    db.producers = db.producers || [];
    const targetId = safeUser.producerId || safeUser.farmId || `prod_${safeUser.id}`;
    if (!db.producers.some((p: any) => p.id === targetId)) {
      db.producers.unshift(buildProducerFromServerUser(safeUser));
    }
  }

  writeDb(db);
  res.json({ success: true, user: safeUser });
});

app.delete("/api/users/:id", (req, res) => {
  const db = readDb();
  const userId = req.params.id;
  const emailQuery = typeof req.query.email === "string" ? req.query.email.trim().toLowerCase() : "";
  const producerIdQuery = typeof req.query.producerId === "string" ? req.query.producerId.trim() : "";

  const targetUser = (db.users || []).find(
    (u: any) => u.id === userId || (emailQuery && u.email && String(u.email).toLowerCase() === emailQuery)
  );

  db.users = (db.users || []).filter((u: any) => {
    if (u.id === userId) return false;
    if (emailQuery && u.email && String(u.email).toLowerCase() === emailQuery) return false;
    return true;
  });

  const prodIds = new Set<string>([`prod_${userId}`, userId]);
  if (producerIdQuery) prodIds.add(producerIdQuery);
  if (targetUser) {
    if (targetUser.producerId) prodIds.add(targetUser.producerId);
    if (targetUser.farmId) prodIds.add(targetUser.farmId);
    prodIds.add(`prod_${targetUser.id}`);
    prodIds.add(targetUser.id);
  }

  db.producers = (db.producers || []).filter((p: any) => !prodIds.has(p.id));
  db.products = (db.products || []).filter((p: any) => !prodIds.has(p.producerId));
  db.stories = (db.stories || []).filter((s: any) => !prodIds.has(s.producerId));
  db.reviews = (db.reviews || []).filter((r: any) => !prodIds.has(r.producerId));

  writeDb(db);
  res.json({ success: true });
});

// Welcome & Registration Confirmation Email Endpoint
app.post("/api/auth/welcome-email", async (req, res) => {
  const { name, email, role, neighborhood } = req.body || {};
  if (!email || !name) {
    return res.status(400).json({ success: false, sent: false, error: "Nome e e-mail são obrigatórios." });
  }

  const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
  const roleLabel = role === "producer" ? "Vendedor / Comércio Local" : "Consumidor";
  const subject = "Bem-vindo(a) ao ConeQta! Seu cadastro foi realizado com sucesso";
  const textBody = [
    `Olá, ${name}!`,
    "",
    "Seja muito bem-vindo(a) ao ConeQta — conectando empreendedores de Queimados à população.",
    "Este e-mail confirma que o seu cadastro foi realizado com sucesso!",
    "",
    `• Perfil: ${roleLabel}`,
    `• Bairro: ${neighborhood || "Queimados, RJ"}`,
    `• E-mail cadastrado: ${email}`,
    "",
    `Acesse a plataforma quando quiser em: ${appUrl}`,
    "",
    "Equipe ConeQta • Queimados, RJ",
  ].join("\n");

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f6f2; padding: 24px; border-radius: 16px;">
      <div style="background: #1F6B38; color: #ffffff; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">CONEQTA</h1>
        <p style="margin: 6px 0 0; font-size: 13px; color: #d9f99d;">Queimados, RJ • Comércio Local e Agricultura Familiar</p>
      </div>
      <div style="background: #ffffff; padding: 28px; border-radius: 0 0 12px 12px; color: #292524;">
        <h2 style="margin-top: 0; color: #1F6B38;">Bem-vindo(a), ${name}!</h2>
        <p style="font-size: 15px; line-height: 1.6;">
          Seu cadastro no aplicativo <strong>ConeQta</strong> foi realizado e confirmado com sucesso.
        </p>
        <div style="background: #faf9f6; border: 1px solid #e7e5e4; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 14px;">
          <p style="margin: 4px 0;"><strong>Tipo de conta:</strong> ${roleLabel}</p>
          <p style="margin: 4px 0;"><strong>Bairro:</strong> ${neighborhood || "Queimados, RJ"}</p>
          <p style="margin: 4px 0;"><strong>E-mail:</strong> ${email}</p>
        </div>
        ${
          role === "producer"
            ? `<p style="font-size: 14px; line-height: 1.6;">Seu perfil de vendedor já está ativo e visível na lista de <strong>Vendedores &amp; Lojas</strong> para todos os visitantes do ConeQta. Acesse seu painel para adicionar produtos, serviços e fotos da sua loja.</p>`
            : `<p style="font-size: 14px; line-height: 1.6;">Agora você já pode explorar o catálogo local, descobrir lojas de Queimados, avaliar produtos e acompanhar os rankings.</p>`
        }
        <p style="margin-top: 24px;">
          <a href="${appUrl}" style="display: inline-block; background: #1F6B38; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 8px; font-size: 14px;">
            Acessar o ConeQta
          </a>
        </p>
        <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
        <p style="font-size: 12px; color: #78716c; margin: 0;">ConeQta • Conectando empreendedores de Queimados à população</p>
      </div>
    </div>
  `;

  const fromAddress = process.env.EMAIL_FROM || "ConeQta <no-reply@coneqta.app>";

  // Option 1: Resend API
  if (process.env.RESEND_API_KEY) {
    try {
      const resendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject,
          html: htmlBody,
          text: textBody,
        }),
      });
      if (resendResp.ok) {
        return res.json({ success: true, sent: true, provider: "resend" });
      }
      const errText = await resendResp.text();
      console.error("Resend error:", errText);
    } catch (err) {
      console.error("Resend request failed:", err);
    }
  }

  // Option 2: Nodemailer SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = Number(process.env.SMTP_PORT || 587);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });

      return res.json({ success: true, sent: true, provider: "smtp" });
    } catch (err: any) {
      console.error("Erro ao enviar e-mail via SMTP:", err);
      return res.status(500).json({
        success: false,
        sent: false,
        provider: "smtp",
        error: err?.message || "Falha ao enviar e-mail via SMTP",
      });
    }
  }

  return res.json({
    success: true,
    sent: false,
    reason: "EMAIL_PROVIDER_NOT_CONFIGURED",
  });
});

// Database API Endpoints for Products
app.get("/api/products", (_req, res) => {
  const db = readDb();
  res.json(db.products || []);
});

app.post("/api/products", (req, res) => {
  const db = readDb();
  const newProduct = {
    ...req.body,
    id: req.body.id || `prod_${Date.now()}`
  };
  db.products = db.products || [];
  db.products.unshift(newProduct);
  writeDb(db);
  res.json({ success: true, product: newProduct });
});

app.put("/api/products/:id", (req, res) => {
  const db = readDb();
  db.products = db.products || [];
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index >= 0) {
    db.products[index] = { ...db.products[index], ...req.body };
    writeDb(db);
    res.json({ success: true, product: db.products[index] });
  } else {
    res.status(404).json({ error: "Produto não encontrado" });
  }
});

app.delete("/api/products/:id", (req, res) => {
  const db = readDb();
  db.products = (db.products || []).filter((p) => p.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// Database API Endpoints for Reviews
app.get("/api/producers/:id/reviews", (req, res) => {
  const db = readDb();
  const reviews = (db.reviews || []).filter((r: any) => r.producerId === req.params.id);
  res.json(reviews);
});

app.post("/api/producers/:id/reviews", (req, res) => {
  const db = readDb();
  db.reviews = db.reviews || [];
  const newReview = {
    ...req.body,
    id: req.body.id || `rev_${Date.now()}`,
    producerId: req.params.id,
    date: req.body.date || new Date().toISOString()
  };
  db.reviews.unshift(newReview);
  writeDb(db);
  res.json({ success: true, review: newReview });
});

// Database API Endpoints for Stories / Vídeos Curtos (24 Horas)
app.get("/api/stories", (_req, res) => {
  const db = readDb();
  const now = Date.now();
  // Filter active stories within 24 hours
  const activeStories = (db.stories || []).filter((s: any) => {
    return new Date(s.expiresAt).getTime() > now;
  });
  res.json(activeStories);
});

app.post("/api/stories", (req, res) => {
  const db = readDb();
  db.stories = db.stories || [];
  const createdAt = req.body.createdAt || new Date().toISOString();
  const expiresAt = req.body.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const newStory = {
    ...req.body,
    id: req.body.id || `story_${Date.now()}`,
    createdAt,
    expiresAt,
    likesCount: req.body.likesCount || 0,
    comments: req.body.comments || []
  };
  db.stories.unshift(newStory);
  writeDb(db);
  res.json({ success: true, story: newStory });
});

app.post("/api/stories/:id/like", (req, res) => {
  const db = readDb();
  db.stories = db.stories || [];
  const story = db.stories.find((s: any) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ error: "Story não encontrado" });
  }
  const { userId, liked } = req.body;
  story.likedByUsers = story.likedByUsers || [];
  const idx = story.likedByUsers.indexOf(userId);
  if (liked && idx === -1) {
    story.likedByUsers.push(userId);
    story.likesCount = (story.likesCount || 0) + 1;
  } else if (!liked && idx >= 0) {
    story.likedByUsers.splice(idx, 1);
    story.likesCount = Math.max(0, (story.likesCount || 1) - 1);
  }
  writeDb(db);
  res.json({ success: true, likesCount: story.likesCount });
});

app.post("/api/stories/:id/comments", (req, res) => {
  const db = readDb();
  db.stories = db.stories || [];
  const story = db.stories.find((s: any) => s.id === req.params.id);
  if (!story) {
    return res.status(404).json({ error: "Story não encontrado" });
  }
  const newComment = {
    ...req.body,
    id: req.body.id || `com_${Date.now()}`,
    createdAt: req.body.createdAt || new Date().toISOString()
  };
  story.comments = story.comments || [];
  story.comments.push(newComment);
  writeDb(db);
  res.json({ success: true, comment: newComment });
});

app.delete("/api/stories/:id", (req, res) => {
  const db = readDb();
  db.stories = (db.stories || []).filter((s: any) => s.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// Lazy init Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "CampoConeQta",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// Gemini Endpoint for CampoConeQta (Recipes, Harvest advice, Producer story generator, Fair pricing)
app.post("/api/gemini/assistant", async (req, res) => {
  try {
    const { action, prompt, context } = req.body;
    const ai = getGeminiClient();

    let systemInstruction = `Você é o Assistente Especialista da CampoConeQta, uma plataforma que conecta produtores rurais a consumidores locais no Brasil.
Seu tom é acolhedor, conhecedor do campo, respeitoso com a agricultura familiar, apaixonado por comida de verdade, alimentos frescos e sustentabilidade.
Responda sempre em Português do Brasil com formatação clara em Markdown.`;

    if (action === "recipe_from_cart") {
      systemInstruction += `\nO usuário quer ideias de receitas deliciosas, fáceis e saudáveis usando prioritariamente os alimentos frescos e artesanais que ele comprou ou selecionou. Inclua tempo de preparo, rendimento, modo de preparo passo a passo e dicas de como aproveitar cascas e talos (desperdício zero).`;
    } else if (action === "storage_tips") {
      systemInstruction += `\nO usuário quer orientações práticas de como armazenar e conservar alimentos frescos (hortaliças, raízes, frutas, queijos artesanais, ovos) para durarem mais sem perder nutrientes e sabor.`;
    } else if (action === "producer_story") {
      systemInstruction += `\nVocê ajudará um produtor rural a criar uma história emocionante, autêntica e atrativa sobre seu sítio/fazenda e seus métodos de cultivo para conquistar os clientes da cidade. Destaque o amor pela terra, tradição familiar e frescor.`;
    } else if (action === "pricing_advisor") {
      systemInstruction += `\nVocê ajudará o pequeno agricultor a precificar de forma justa e sustentável seus produtos, orientando sobre custos de insumo, mão de obra, perdas naturais, embalagem ecológica e margem justa sem extorquir o consumidor final nem desvalorizar o trabalho no campo.`;
    }

    const fullPrompt = context
      ? `Contexto dos produtos/situação: ${JSON.stringify(context, null, 2)}\n\nPergunta ou Pedido: ${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: fullPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      text: response.text || "Não foi possível gerar a resposta no momento.",
    });
  } catch (error: any) {
    console.error("Erro na rota Gemini:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "Falha ao processar com IA",
      fallbackText:
        "O assistente com IA está temporariamente indisponível. Verifique se a chave GEMINI_API_KEY está configurada no painel de configurações.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CampoConeQta server running on http://localhost:${PORT}`);
  });
}

startServer();
