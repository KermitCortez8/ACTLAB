// public/login.js

const mensajeError = document.getElementsByClassName("error")[0];
const form = document.getElementById("login_form");

// Cargar datos guardados al iniciar la página
window.addEventListener("DOMContentLoaded", () => {
  const recordar = localStorage.getItem("recordar");
  
  if (recordar === "true") {
    const tipoDoc = localStorage.getItem("tipo_documento");
    const numDoc = localStorage.getItem("num_documento");
    
    if (tipoDoc) {
      form.elements["tipo-documento"].value = tipoDoc;
    }
    if (numDoc) {
      form.elements["num-documento"].value = numDoc;
    }
    form.elements["remember"].checked = true;
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const elems = form.elements;
  const recordar = elems["remember"].checked;
  
  const payload = {
    tipo_documento: elems["tipo-documento"].value,
    num_documento:   elems["num-documento"].value,
    password:        elems["password"].value
  };

  // Guardar o eliminar datos según el checkbox
  if (recordar) {
    localStorage.setItem("recordar", "true");
    localStorage.setItem("tipo_documento", payload.tipo_documento);
    localStorage.setItem("num_documento", payload.num_documento);
  } else {
    localStorage.removeItem("recordar");
    localStorage.removeItem("tipo_documento");
    localStorage.removeItem("num_documento");
  }

  try {
    const res = await fetch("/api/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      mensajeError.textContent = data.message || "Error al iniciar sesión.";
      mensajeError.classList.remove("escondido");
      return;
    }

    // Guardar token para llamadas autenticadas posteriores
    localStorage.setItem("token", data.token);
    sessionStorage.setItem("userEmail", data.email); 


    // Redirigir al área admin
    window.location.href = data.redirect || "/admin";
  } catch (err) {
    console.error("Error en fetch:", err);
    mensajeError.textContent = "No se pudo conectar al servidor.";
    mensajeError.classList.remove("escondido");
  }
});