// BACKEND/Routes/citas_paciente.routes.js
import express from "express";
import Cita from "../models/Cita.js";

const router = express.Router();


// Obtener citas por email
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "El parámetro 'email' es obligatorio" });
    }

    const citas = await Cita.find({ email });
    console.log("Citas encontradas:", citas);

    res.status(200).json(citas);
  } catch (error) {
    console.error("Error al obtener citas:", error.message);
    res.status(500).json({ error: "Error al obtener citas", detalle: error.message });
  }
});



// Crear una cita
router.post("/", async (req, res) => {
  try {
    console.log("📥 Datos recibidos del frontend:", req.body); // 🔍 Ver qué llega realmente

    const { email, especialidad, fechaCita, horario, motivoCita } = req.body;

    if (!email || !especialidad || !fechaCita || !horario || !motivoCita) {
      console.warn("Faltan datos:", { email, especialidad, fechaCita, horario, motivoCita });
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const nuevaCita = new Cita({
      email,
      especialidad,
      fechaCita,
      horario,
      motivoCita,
    });

    await nuevaCita.save();

    console.log("✅ Cita guardada:", nuevaCita);
    res.status(201).json({
      message: "Cita guardada correctamente",
      cita: nuevaCita,
    });
  } catch (error) {
    console.error("💥 Error al guardar la cita:", error.message);
    res.status(500).json({ error: "Error al guardar la cita", detalle: error.message });
  }
});

export default router;
