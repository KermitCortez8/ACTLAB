document.addEventListener("DOMContentLoaded", () => {
  const formSolicitarCita = document.getElementById("formSolicitarCita");
  const modalResultado = document.getElementById("modalResultado");
  const modalTitle = document.getElementById("modalTitle");
  const modalMessage = document.getElementById("modalMessage");
  const modalIcon = document.getElementById("modalIcon");
  const btnModalSiguiente = document.getElementById("btnModalSiguiente");
  const btnVolverCitas = document.getElementById("btnVolverCitas");

  // ✅ función para mostrar el modal (éxito o error)
  const showModal = (isSuccess, title, message) => {
    modalResultado.style.display = "flex";
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalIcon.innerHTML = isSuccess
      ? '<i class="fa-solid fa-check"></i>'
      : '<i class="fa-solid fa-xmark"></i>';
    modalIcon.style.color = isSuccess ? "green" : "red";
  };

  // ✅ función para cerrar el modal
  const closeModal = () => {
    modalResultado.style.display = "none";
  };

  btnModalSiguiente.addEventListener("click", closeModal);

  // ✅ función para enviar la cita
  const handleSolicitarCita = async (e) => {
    e.preventDefault();

    // obtener los valores del formulario
    const email = sessionStorage.getItem("userEmail"); // debe estar guardado desde el login
    const especialidad = document.getElementById("especialidad").value;
    const fechaCita = document.getElementById("fechaCita").value;
    const horario = document.getElementById("horario").value;
    const motivoCita = document.getElementById("motivoCita").value;

    // validar campos vacíos
    if (!especialidad || !fechaCita || !horario || !motivoCita) {
      showModal(false, "Error", "Por favor complete todos los campos.");
      return;
    }

    // validar email guardado
    if (!email) {
      showModal(false, "Error", "No se encontró el correo del usuario. Inicie sesión nuevamente.");
      return;
    }

    try {
      // enviar la solicitud al backend
      const res = await fetch("http://localhost:3000/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          especialidad,
          fechaCita,
          horario,
          motivoCita,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Error al registrar la cita");

      showModal(true, "Solicitud Enviada", "Su cita ha sido registrada exitosamente.");
      formSolicitarCita.reset();

    } catch (error) {
      console.error("Error al solicitar cita:", error);
      showModal(false, "Error", "No se pudo registrar la cita. Inténtelo nuevamente.");
    }
  };

  // ✅ detectar envío del formulario solo cuando existe
  if (formSolicitarCita) {
    formSolicitarCita.addEventListener("submit", handleSolicitarCita);
  }

  // ✅ botón para volver al dashboard
  if (btnVolverCitas) {
    btnVolverCitas.addEventListener("click", () => {
      window.location.href = "./dashboardPaciente.html";
    });
  }
});
