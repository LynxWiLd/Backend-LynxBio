import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; // IMPORTANTE: El .js es obligatorio
import authRoutes from "./routes/authRoutes.js";
import linkRoutes from "./routes/linkRoutes.js";

dotenv.config();
const app = express();

connectDB();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
// ...
app.use("/api/auth", authRoutes);
app.use("/api/links", linkRoutes); // Agregamos esta
// Rutas
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("API de LynxBio funcionando con ES Modules 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
