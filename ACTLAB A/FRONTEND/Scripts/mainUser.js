// Scripts/mainUser.js

document.addEventListener("DOMContentLoaded", () => {
  // Recuperar usuario del localStorage
  const usuario = localStorage.getItem("usuario") || "Paciente";

  // Mostrar en el header
  document.getElementById("username").textContent = usuario;

  // Mostrar en la sección de solicitar cita
  const pacienteSpan = document.getElementById("paciente");
  if (pacienteSpan) {
    pacienteSpan.textContent = usuario;
  }

  // Botón de cerrar sesión
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("usuario");
      window.location.href = "login.html";
    });
  }
});
