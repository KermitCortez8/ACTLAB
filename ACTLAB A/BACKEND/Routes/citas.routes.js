import express from "express"
import {
  getCitas,
  getCitaById,
  createCita,
  updateCita,
  deleteCita,
  confirmarCita,
  reprogramarCita,
  cancelarCita,
  marcarAtendida,
} from "../controllers/cita.controller.js"

const router = express.Router()

// Rutas CRUD básicas
router.get("/citas", getCitas)
router.get("/citas/:id", getCitaById)
router.post("/citas", createCita)
router.put("/citas/:id", updateCita)
router.delete("/citas/:id", deleteCita)

// Rutas específicas para acciones
router.patch("/citas/:id/confirmar", confirmarCita)
router.patch("/citas/:id/reprogramar", reprogramarCita)
router.patch("/citas/:id/cancelar", cancelarCita)
router.patch("/citas/:id/atendida", marcarAtendida)

export default router
