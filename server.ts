import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
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
  deletedUserIds?: string[];
}

const DEFAULT_DB: DbSchema = {
  producers: [],
  products: [],
  orders: [],
  users: [],
  reviews: [],
  stories: [],
  deletedUserIds: [],
};

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, keyHex] = storedHash.split(":");
  if (!salt || !keyHex) return false;
  try {
    const keyBuf = Buffer.from(keyHex, "hex");
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}

function sanitizeUser(user: any) {
  if (!user) return user;
  const { password: _pw, passwordHash: _hash, ...safe } = user;
  return safe;
}

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
  const safeUsers = (db.users || []).map((u: any) => sanitizeUser(u));
  res.json(safeUsers);
});

app.post("/api/users", (req, res) => {
  const db = readDb();
  db.users = db.users || [];
  const incoming = req.body;
  if (!incoming || !incoming.id) {
    return res.status(400).json({ error: "Dados de usuário inválidos" });
  }
  const { password, passwordHash: _ignoredHash, ...safeUser } = incoming;
  const idx = db.users.findIndex(
    (u: any) =>
      u.id === incoming.id ||
      (u.email && incoming.email && String(u.email).toLowerCase() === String(incoming.email).toLowerCase())
  );

  if (idx >= 0) {
    const existing = db.users[idx];
    db.users[idx] = {
      ...existing,
      ...safeUser,
      passwordHash: existing.passwordHash || (password ? hashPassword(String(password)) : undefined),
    };
  } else {
    db.users.unshift({
      ...safeUser,
      ...(password ? { passwordHash: hashPassword(String(password)) } : {}),
    });
  }

  // Ensure re-registered user is not blocked by deletedUserIds
  if (Array.isArray(db.deletedUserIds)) {
    db.deletedUserIds = db.deletedUserIds.filter((id) => id !== incoming.id);
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
  res.json({ success: true, user: sanitizeUser(idx >= 0 ? db.users[idx] : safeUser) });
});

// Register account with persistent server-side scrypt password hash (cross-device login)
app.post("/api/auth/register", (req, res) => {
  const db = readDb();
  db.users = db.users || [];
  const incoming = req.body || {};
  const cleanEmail = String(incoming.email || "").trim().toLowerCase();
  const cleanCpf = String(incoming.cpf || "").trim().toLowerCase();
  const cleanCpfDigits = cleanCpf.replace(/\D/g, "");
  const rawPassword = String(incoming.password || "");

  if (!incoming.name || !cleanEmail || rawPassword.length < 6) {
    return res.status(400).json({
      error: "Nome, e-mail válido e senha com pelo menos 6 caracteres são obrigatórios.",
    });
  }

  const duplicate = db.users.find((u: any) => {
    const emailMatch = u.email && String(u.email).trim().toLowerCase() === cleanEmail;
    const uCpf = String(u.cpf || "").trim().toLowerCase();
    const uCpfDigits = uCpf.replace(/\D/g, "");
    const cpfMatch =
      (cleanCpf && uCpf === cleanCpf) ||
      (cleanCpfDigits.length >= 11 && uCpfDigits === cleanCpfDigits);
    return Boolean(emailMatch || cpfMatch);
  });
  if (duplicate) {
    return res.status(409).json({
      error: "Este e-mail ou CPF já está cadastrado no ConeQta. Faça login para acessar sua conta.",
    });
  }

  const { password: _pw, passwordHash: _ph, ...userFields } = incoming;
  const userId = incoming.id || `usr_${Date.now()}`;
  const newUserRecord = {
    ...userFields,
    id: userId,
    email: cleanEmail,
    status: incoming.status || "ativo",
    verified: incoming.verified ?? true,
    passwordHash: hashPassword(rawPassword),
  };

  db.users.unshift(newUserRecord);
  if (Array.isArray(db.deletedUserIds)) {
    db.deletedUserIds = db.deletedUserIds.filter((id) => id !== userId);
  }

  if (newUserRecord.role === "producer") {
    db.producers = db.producers || [];
    const targetId = newUserRecord.producerId || newUserRecord.farmId || `prod_${userId}`;
    if (!db.producers.some((p: any) => p.id === targetId)) {
      db.producers.unshift(buildProducerFromServerUser(newUserRecord));
    }
  }

  writeDb(db);
  res.json({ success: true, user: sanitizeUser(newUserRecord) });
});

// Authenticate user from any device against persisted database
app.post("/api/auth/login", (req, res) => {
  const db = readDb();
  const { identifier, password } = req.body || {};
  const cleanId = String(identifier || "").trim().toLowerCase();
  const cleanDigits = cleanId.replace(/\D/g, "");
  const rawPassword = String(password || "");

  if (!cleanId || !rawPassword) {
    return res.status(400).json({ error: "Informe seu e-mail/CPF e senha." });
  }

  const foundUser = (db.users || []).find((u: any) => {
    const uEmail = String(u.email || "").trim().toLowerCase();
    const uCpf = String(u.cpf || "").trim().toLowerCase();
    const uCpfDigits = uCpf.replace(/\D/g, "");
    const uName = String(u.name || "").trim().toLowerCase();
    return (
      uEmail === cleanId ||
      (uCpf && uCpf === cleanId) ||
      (cleanDigits.length >= 11 && uCpfDigits === cleanDigits) ||
      (uName && uName === cleanId)
    );
  });

  if (!foundUser) {
    return res.status(404).json({ code: "NOT_FOUND", error: "Conta não encontrada no banco de dados." });
  }

  if (foundUser.status === "bloqueado") {
    return res.status(403).json({
      code: "BLOCKED",
      error: "Esta conta está temporariamente bloqueada pelo administrador.",
    });
  }

  if (!foundUser.passwordHash || !verifyPassword(rawPassword, foundUser.passwordHash)) {
    return res.status(401).json({
      code: "INVALID_PASSWORD",
      error: "Senha incorreta. Por favor, verifique a senha digitada.",
    });
  }

  return res.json({ success: true, user: sanitizeUser(foundUser) });
});

// Update email, phone, and/or password persistently across devices
app.post("/api/auth/update-credentials", (req, res) => {
  const db = readDb();
  db.users = db.users || [];
  const { userId, currentPassword, email, phone, password, userSnapshot } = req.body || {};
  if (!userId) {
    return res.status(400).json({ error: "Usuário inválido." });
  }

  let idx = db.users.findIndex((u: any) => u.id === userId);
  if (idx < 0 && userSnapshot) {
    const { password: _pw, passwordHash: _ph, ...safeSnap } = userSnapshot;
    db.users.unshift({
      ...safeSnap,
      id: userId,
      ...(currentPassword ? { passwordHash: hashPassword(String(currentPassword)) } : {}),
    });
    idx = 0;
  }

  if (idx < 0) {
    return res.status(404).json({ error: "Conta não encontrada." });
  }

  const existing = db.users[idx];
  const nextEmail = email !== undefined ? String(email).trim().toLowerCase() : existing.email;
  const emailChanged = Boolean(email !== undefined && nextEmail !== String(existing.email || "").toLowerCase());

  if ((emailChanged || password) && existing.passwordHash) {
    if (!currentPassword || !verifyPassword(String(currentPassword), existing.passwordHash)) {
      return res.status(401).json({ error: "A senha atual informada está incorreta." });
    }
  }

  if (emailChanged) {
    const duplicate = db.users.find(
      (u: any) => u.id !== userId && u.email && String(u.email).toLowerCase() === nextEmail
    );
    if (duplicate) {
      return res.status(409).json({ error: "Este e-mail já está em uso por outra conta no ConeQta." });
    }
  }

  if (password && String(password).length < 6) {
    return res.status(400).json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  const nextPhone = phone !== undefined ? String(phone).trim() : existing.phone;
  const updatedRecord = {
    ...existing,
    email: nextEmail,
    phone: nextPhone,
    ...(password ? { passwordHash: hashPassword(String(password)) } : {}),
  };

  db.users[idx] = updatedRecord;

  if (updatedRecord.role === "producer" && phone !== undefined) {
    const targetProducerId = updatedRecord.producerId || updatedRecord.farmId || `prod_${updatedRecord.id}`;
    const pIdx = (db.producers || []).findIndex(
      (p: any) => p.id === targetProducerId || p.id === updatedRecord.id
    );
    if (pIdx >= 0) {
      const numericPhone = String(nextPhone).replace(/\D/g, "");
      db.producers[pIdx] = {
        ...db.producers[pIdx],
        phone: nextPhone,
        whatsapp: numericPhone
          ? numericPhone.startsWith("55")
            ? numericPhone
            : `55${numericPhone}`
          : "",
      };
    }
  }

  writeDb(db);
  return res.json({ success: true, user: sanitizeUser(updatedRecord) });
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

  db.deletedUserIds = Array.from(new Set([...(db.deletedUserIds || []), userId]));

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
