const tableBody = document.getElementById("user-tbody"); // correcto
const btnOpenModal = document.getElementById("btn-add"); // correcto
const btnCloseModal = document.getElementById("btn-cancel"); // correcto
const modal = document.getElementById("modal-form"); // correcto
const form = document.getElementById("form-user"); // correcto
const modalTitle = document.getElementById("modal-title"); // correcto
const pacienteIdInput = document.getElementById("user-id"); // correcto

let editando = false;

// Mostrar/Ocultar modal
btnOpenModal.addEventListener("click", () => abrirModal(false));
btnCloseModal.addEventListener("click", () => modal.classList.add("hidden"));

function abrirModal(esEdicion, paciente = null) {
  editando = esEdicion;
  modal.classList.remove("hidden");
  modalTitle.textContent = esEdicion ? "Editar Paciente" : "Nuevo Paciente";

  if (esEdicion && paciente) {
    pacienteIdInput.value = paciente._id; // usar _id de MongoDB
    document.getElementById("first-name").value = paciente.nombres;
    document.getElementById("last-name").value = paciente.apellidos;
    document.getElementById("age").value = paciente.edad;
    document.getElementById("gender").value = paciente.genero;
    document.getElementById("address").value = paciente.direccion;
    document.getElementById("phone").value = paciente.celular;
  } else {
    form.reset();
    pacienteIdInput.value = "";
  }
}

// Cargar pacientes
async function cargarPacientes() {
  try {
    const res = await fetch("/api/pacientes");
    if (!res.ok) throw new Error("Error al obtener pacientes");
    const data = await res.json();

    tableBody.innerHTML = "";
    data.forEach((p) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${p.nombres}</td>
        <td>${p.apellidos}</td>
        <td>${p.edad}</td>
        <td>${p.genero}</td>
        <td>${p.direccion}</td>
        <td>${p.celular}</td>
        <td class="actions"></td>
      `;

      // Botón editar
      const btnEdit = document.createElement("button");
      btnEdit.textContent = "✏️";
      btnEdit.addEventListener("click", () => abrirModal(true, p));

      // Botón eliminar
      const btnDelete = document.createElement("button");
      btnDelete.textContent = "🗑️";
      btnDelete.addEventListener("click", () => eliminarPaciente(p._id)); // usar _id

      row.querySelector(".actions").appendChild(btnEdit);
      row.querySelector(".actions").appendChild(btnDelete);

      tableBody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    alert("No se pudo cargar la lista de pacientes");
  }
}

// Guardar paciente (nuevo o editado)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const paciente = {
    nombres: document.getElementById("first-name").value,
    apellidos: document.getElementById("last-name").value,
    edad: parseInt(document.getElementById("age").value),
    genero: document.getElementById("gender").value,
    direccion: document.getElementById("address").value,
    celular: document.getElementById("phone").value,
  };

  try {
    if (editando) {
      const id = pacienteIdInput.value; // contiene _id
      const res = await fetch(`/api/pacientes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paciente),
      });
      if (!res.ok) throw new Error("Error al actualizar paciente");
    } else {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paciente),
      });
      if (!res.ok) throw new Error("Error al crear paciente");
    }

    form.reset();
    modal.classList.add("hidden");
    cargarPacientes();
  } catch (err) {
    console.error(err);
    alert("No se pudo guardar el paciente");
  }
});

// Eliminar paciente
async function eliminarPaciente(id) {
  if (!confirm("¿Seguro que quieres eliminar este paciente?")) return;

  try {
    const res = await fetch(`/api/pacientes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Error al eliminar paciente");

    cargarPacientes();
  } catch (err) {
    console.error(err);
    alert("No se pudo eliminar el paciente");
  }
}

// Cargar al entrar
document.addEventListener("DOMContentLoaded", cargarPacientes);
