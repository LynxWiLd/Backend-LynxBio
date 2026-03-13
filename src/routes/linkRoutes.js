import express from "express";
import {
  addLink,
  getLinks,
  deleteLink,
  updateLink,
} from "../controllers/linkController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Todas las rutas protegidas por el middleware 'auth'
router.post("/", auth, addLink);
router.get("/", auth, getLinks);
router.put("/:id", auth, updateLink); // Ruta para editar
router.delete("/:id", auth, deleteLink); // Ruta para borrar

export default router;
