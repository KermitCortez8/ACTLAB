import mongoose from "mongoose"

const citaSchema = new mongoose.Schema(
  {
    pacienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Paciente", // referencia al modelo de pacientes reales
      required: true,
    },
    medicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario", // opcional si manejas médicos como usuarios del sistema
      required: false,
      default: null,
    },
    fechaHora: {
      type: Date,
      required: true,
    },
    duracion: {
      type: Number,
      required: true,
      default: 15, // duración en minutos (default 15 minutos)
      min: 5,
      max: 120,
    },
    motivo: {
      type: String,
      required: true,
      trim: true,
    },
    tipoExamen: {
      type: String,
      enum: ["Consulta General", "Laboratorio", "Imagenología", "Especialidad"],
      required: true,
    },
    estado: {
      type: String,
      enum: ["Pendiente", "Confirmada", "Reprogramada", "Cancelada", "Atendida"],
      default: "Pendiente",
      required: true,
    },
    canceladoPor: {
      type: String,
      enum: ["Paciente", "Admin", "Sistema"],
      default: null,
    },
    motivoCancelacion: {
      type: String,
      default: null,
    },
    notasMedico: {
      type: String,
      default: null,
    },
    fechaAtendida: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

const Cita = mongoose.model("Cita", citaSchema)
export default Cita
