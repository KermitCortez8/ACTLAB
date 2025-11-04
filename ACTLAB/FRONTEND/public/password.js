// public/password.js

const mensajeError = document.getElementsByClassName("error")[0];
const form = document.getElementById("password_form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const elems = form.elements;
  const payload = {
    current_password: elems["current_password"].value,
    new_password:     elems["new_password"].value,
    repeat_password:  elems["repeat_password"].value
  };

  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/password", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      mensajeError.textContent = data.message || "Error al cambiar contraseña.";
      mensajeError.classList.remove("escondido");
      return;
    }

    // Redirigir al login
    window.location.href = data.redirect || "/login";
  } catch (err) {
    console.error("Error en fetch:", err);
    mensajeError.textContent = "No se pudo conectar al servidor.";
    mensajeError.classList.remove("escondido");
  }
});
