import express from "express";
import {
  getPacientes,
  getPacienteById,
  createPaciente,
  updatePaciente,
  deletePaciente
} from "../controllers/paciente.controller.js";

const router = express.Router();

router.get("/pacientes", getPacientes);
router.get("/pacientes/:id", getPacienteById);
router.post("/pacientes", createPaciente);
router.put("/pacientes/:id", updatePaciente);
router.delete("/pacientes/:id", deletePaciente);

export default router;
