import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    tipo_documento: {
      type: String,
      enum: ["dni", "pasaporte", "carnet-ext"],
      required: true,
    },
    num_documento: {
      type: String,
      required: true,
      unique: true, // cada documento debe ser único
      trim: true,
    },
    fecha_emision: {
      type: Date,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // valida formato básico de email
    },
    password: {
      type: String,
      required: true,
    },
    /*password_create: {
      type: String,
      required: true,
    }, */ 
   mayor: {
      type: Boolean,
      default: false,
    },
    menor: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;
