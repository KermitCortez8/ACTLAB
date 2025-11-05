// BACKEND/Models/Usuario.js
import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    nombres: {
      type: String,
      required: true,
      trim: true,
    },
    apellidos: {
      type: String,
      required: true,
      trim: true,
    },
    edad: {
      type: Number,
      required: true,
      min: 0,
    },
    genero: {
      type: String,
      enum: ["Masculino", "Femenino", "Otro"],
      required: true,
    },
    direccion: {
      type: String,
      required: true,
    },
    celular: {
      type: String,
      required: true,
      match: /^[0-9]{9}$/, // valida 9 dígitos
    },
  },
  {
    timestamps: true,
  }
);

// 👇 Aquí debe ser Paciente
const Paciente = mongoose.model("Paciente", usuarioSchema);

export default Paciente;
