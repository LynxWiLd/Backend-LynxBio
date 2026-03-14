import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";

// 1. Configuración de entorno
dotenv.config();

// 2. Conexión a la base de datos
connectDB();

const app = express();

// 3. Middlewares Globales
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173"],
    credentials: true,
  }),
); // Permite peticiones desde Vercel
app.use(morgan("dev")); // Logs de peticiones en consola
app.use(express.json()); // Permite recibir JSON en el body

// 4. Rutas
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes);

// Ruta de chequeo de salud (Health Check)
app.get("/", (req, res) => {
  res.send("🚀 LynxBio API está online y funcionando");
});

// 5. Arranque del servidor
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
  ==========================================
  ✅ Servidor corriendo en el puerto: ${PORT}
  🌍 Modo: ${process.env.NODE_ENV || "development"}
  ==========================================
  `);
});
