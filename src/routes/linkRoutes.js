import express from "express";
import {
  addLink,
  getLinks,
  deleteLink,
  updateLink,
  reorderLinks, // 👈 1. Importamos la nueva función
} from "../controllers/linkController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Todas las rutas protegidas por el middleware 'auth'
router.post("/", auth, addLink);
router.get("/", auth, getLinks);

// 🛠️ 2. RUTA DE REORDENAMIENTO
// IMPORTANTE: Debe ir ARRIBA de /:id para que Express no se confunda
router.put("/reorder", auth, reorderLinks);

router.put("/:id", auth, updateLink);    // Ruta para editar
router.delete("/:id", auth, deleteLink); // Ruta para borrar

export default router;