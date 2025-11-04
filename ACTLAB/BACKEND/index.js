import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import { methods as authentication } from "./controllers/authentication.controller.js"
import pacienteRoutes from "../BACKEND/Routes/pacientes.routes.js"
import citasRoutes from "../BACKEND/Routes/citas.routes.js"
import connectDB from "../BACKEND/Config/mongodb.js"
import open from "open"

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set("port", 5000);
// antes estaba esto 
// app.set("port", process.env.PORT || 5000);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "../FRONTEND")));

// Conexión MongoDB
connectDB();

// Rutas API
app.post("/api/register", authentication.register);
app.post("/api/login", authentication.login);
app.post("/api/password", authentication.password);

// Rutas HTML (frontend)
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../FRONTEND/index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "../FRONTEND/login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(__dirname, "../FRONTEND/register.html")));
app.get("/password", (req, res) => res.sendFile(path.join(__dirname, "../FRONTEND/password.html")));
app.get("/user", (req, res) => res.sendFile(path.join(__dirname, "../FRONTEND/index2.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/admin.html")));
app.get("/admin/pacientes", (req, res) => res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/pacientes.html")));
app.get("/admin/citas", (req, res) => res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/citas.html")));
app.get("/admin/resultados", (req, res) =>res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/resultados.html")));
app.get("/admin/reportes", (req, res) =>res.sendFile(path.join(__dirname, "../FRONTEND/login_exitoso/reportes.html")));
app.get("/user/citas", (req, res) => res.sendFile(path.join(__dirname, "../FRONTEND/views/solicitar-cita.html")));

app.use("/api", pacienteRoutes)
app.use("/api", citasRoutes)

// Servidor
app.listen(app.get("port"), async () => {
  const url = `http://localhost:${app.get("port")}`;
  console.log(`🚀 Servidor corriendo en ${url}`);
  try {
    await open(url);
    console.log("🌐 Navegador abierto correctamente.");
  } catch (error) {
    console.error("No se pudo abrir el navegador:", error);
  }
});
