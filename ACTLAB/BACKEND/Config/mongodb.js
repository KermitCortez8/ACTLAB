import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.ATLAS_URL, {
      dbName: "ACTLAB" // asegura el nombre de la BD
    });
    console.log("Conectado a MongoDB Atlas");
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
