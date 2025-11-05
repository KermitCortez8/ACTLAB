// public/admin-layout.js
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("sidebarToggle");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      if (window.innerWidth <= 768) sidebar.classList.toggle("open");
      else sidebar.classList.toggle("collapsed");
    });
  }

  // Enlace activo según URL
  const currentPath = window.location.pathname;
  document.querySelectorAll(".nav-item").forEach((link) => {
    if (link.getAttribute("href") === currentPath) link.classList.add("active");
  });
});
