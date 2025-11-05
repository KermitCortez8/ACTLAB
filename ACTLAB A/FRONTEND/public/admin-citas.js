/**
 * @fileoverview Módulo de gestión de citas para administradores
 * @description Maneja la creación, edición, eliminación y visualización de citas médicas
 * con validaciones de horario y sistema de notificaciones
 */

// ============================================================================
// CONSTANTES Y CONFIGURACIÓN
// ============================================================================

/** Número de citas por página en la tabla */
const ITEMS_PER_PAGE = 5

/** Horario de atención de la clínica */
const HORARIO_CLINICA = {
  DIA_INICIO_SEMANA: 1, // Lunes (1) a Sábado (6)
  DIA_FIN_SEMANA: 6,
  DOMINGO: 0,
  HORA_INICIO: 8, // 8:00 AM
  HORA_FIN: 18, // 6:00 PM
}

/** Colores por estado de cita para visualización */
const COLORES_ESTADO = {
  Pendiente: "#3b82f6",
  Atendida: "#10b981",
  Cancelada: "#ef4444",
}

/** Colores CSS para selectores de estado */
const ESTILOS_ESTADO = {
  Pendiente: "background:#dbeafe; color:#1e40af;",
  Atendida: "background:#d1fae5; color:#065f46;",
  Cancelada: "background:#fee2e2; color:#991b1b;",
}

/** Tipos de notificación */
const TIPO_NOTIFICACION = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info",
}

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

let citasData = []
let citasFiltradas = []
let currentPage = 1
let currentMonth = new Date()
let editingCitaId = null
let pacientesCargados = []
let currentView = "monthly"

// ============================================================================
// ELEMENTOS DEL DOM - Caché de referencias
// ============================================================================

/** Referencias a elementos del DOM necesarios para el funcionamiento */
const domElements = {
  modalCita: null,
  modalAcciones: null,
  formCita: null,
  citasTableBody: null,
  emptyState: null,
  btnAgregarCita: null,
  btnCloseModal: null,
  btnCancelForm: null,
  btnCloseAcciones: null,
  btnLimpiarFiltros: null,
  filterEstado: null,
  filterTipo: null,
  filterFecha: null,
  filterPaciente: null,
  prevMonth: null,
  nextMonth: null,
  currentMonth_display: null,
  calendarGrid: null,
  hoursGrid: null,
  scheduleHeader: null,
  scheduleGrid: null,
  monthlyView: null,
  weeklyView: null,
  btnViewMonthly: null,
  btnViewWeekly: null,
  monthlyCalendarGrid: null,
}

/**
 * Inicializa todas las referencias a elementos del DOM
 * Evita accesos repetidos y mejora el rendimiento
 */
function inicializarReferenciasDOM() {
  domElements.modalCita = document.getElementById("modalCita")
  domElements.modalAcciones = document.getElementById("modalAcciones")
  domElements.formCita = document.getElementById("formCita")
  domElements.citasTableBody = document.getElementById("citasTableBody")
  domElements.emptyState = document.getElementById("emptyState")
  domElements.btnAgregarCita = document.getElementById("btnAgregarCita")
  domElements.btnCloseModal = document.getElementById("btnCloseModal")
  domElements.btnCancelForm = document.getElementById("btnCancelForm")
  domElements.btnCloseAcciones = document.getElementById("btnCloseAcciones")
  domElements.btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros")
  domElements.filterEstado = document.getElementById("filterEstado")
  domElements.filterTipo = document.getElementById("filterTipo")
  domElements.filterFecha = document.getElementById("filterFecha")
  domElements.filterPaciente = document.getElementById("filterPaciente")
  domElements.prevMonth = document.getElementById("prevMonth")
  domElements.nextMonth = document.getElementById("nextMonth")
  domElements.currentMonth_display = document.getElementById("currentMonth")
  domElements.calendarGrid = document.getElementById("calendarGrid")
  domElements.hoursGrid = document.getElementById("hoursGrid")
  domElements.scheduleHeader = document.getElementById("scheduleHeader")
  domElements.scheduleGrid = document.getElementById("scheduleGrid")
  domElements.monthlyView = document.getElementById("monthlyView")
  domElements.weeklyView = document.getElementById("weeklyView")
  domElements.btnViewMonthly = document.getElementById("btnViewMonthly")
  domElements.btnViewWeekly = document.getElementById("btnViewWeekly")
  domElements.monthlyCalendarGrid = document.getElementById("monthlyCalendarGrid")
}

// ============================================================================
// UTILIDADES Y FUNCIONES AUXILIARES
// ============================================================================

/**
 * Formatea una fecha/hora a string legible en español (sin segundos)
 * @param {string|Date} fechaHora - Fecha y hora a formatear
 * @returns {string} Fecha formateada (dd/mm/yyyy, hh:mm)
 */
function formatearFechaHora(fechaHora) {
  const date = new Date(fechaHora)
  const fecha = date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
  const hora = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${fecha}, ${hora}`
}

/**
 * Calcula la hora de fin de una cita
 * @param {string|Date} fechaHoraInicio - Fecha y hora de inicio
 * @param {number} duracion - Duración en minutos
 * @returns {Date} Fecha y hora de fin
 */
function calcularHoraFin(fechaHoraInicio, duracion) {
  const inicio = new Date(fechaHoraInicio)
  const duracionMs = (duracion || 15) * 60000
  return new Date(inicio.getTime() + duracionMs)
}

/**
 * Formatea hora sin segundos (HH:mm)
 * @param {string|Date} fechaHora - Fecha y hora
 * @returns {string} Hora formateada (HH:mm)
 */
function formatearHora(fechaHora) {
  const date = new Date(fechaHora)
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Sanitiza texto para prevenir XSS
 * @param {string} texto - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
function sanitizarTexto(texto) {
  const div = document.createElement("div")
  div.textContent = texto
  return div.innerHTML
}

/**
 * Agrupa citas por día (clave: YYYY-MM-DD)
 * @param {Array} citas - Array de citas
 * @returns {Object} Objeto con citas agrupadas por día
 */
function agruparCitasPorDia(citas) {
  return citas.reduce((acc, c) => {
    if (!c || !c.fechaHora) return acc
    const key = new Date(c.fechaHora).toISOString().slice(0, 10)
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})
}

// ============================================================================
// SISTEMA DE NOTIFICACIONES TOAST
// ============================================================================

/**
 * Crea e inyecta estilos CSS para animaciones de toast si no existen
 * Optimiza para evitar duplicación de estilos
 */
function inicializarEstilosToast() {
  if (!document.getElementById("toastStyles")) {
    const style = document.createElement("style")
    style.id = "toastStyles"
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
}

/**
 * Muestra una notificación toast temporal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación (success, error, info)
 */
function mostrarToast(mensaje, tipo = TIPO_NOTIFICACION.SUCCESS) {
  const container = document.getElementById("toastContainer")
  if (!container) return

  inicializarEstilosToast()

  const coloresToast = {
    [TIPO_NOTIFICACION.SUCCESS]: "#10b981",
    [TIPO_NOTIFICACION.ERROR]: "#ef4444",
    [TIPO_NOTIFICACION.INFO]: "#3b82f6",
  }

  const iconosToast = {
    [TIPO_NOTIFICACION.SUCCESS]: "✓",
    [TIPO_NOTIFICACION.ERROR]: "✕",
    [TIPO_NOTIFICACION.INFO]: "ℹ",
  }

  const toast = document.createElement("div")
  const color = coloresToast[tipo] || coloresToast[TIPO_NOTIFICACION.INFO]
  const icono = iconosToast[tipo] || iconosToast[TIPO_NOTIFICACION.INFO]

  toast.style.cssText = `
    background: ${color};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
    animation: slideIn 0.3s ease-out;
    font-size: 14px;
  `

  // Usar textContent para prevenir XSS
  toast.innerHTML = `<span style="font-weight: bold; font-size: 18px;">${icono}</span><span>${sanitizarTexto(mensaje)}</span>`

  container.appendChild(toast)

  setTimeout(() => {
    toast.style.animation = "slideOut 0.3s ease-out"
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

/**
 * Muestra un mensaje de error
 * @param {string} mensaje - Mensaje de error
 */
function mostrarError(mensaje) {
  mostrarToast(mensaje, TIPO_NOTIFICACION.ERROR)
}

/**
 * Muestra un mensaje de éxito
 * @param {string} mensaje - Mensaje de éxito
 */
function mostrarExito(mensaje) {
  mostrarToast(mensaje, TIPO_NOTIFICACION.SUCCESS)
}

// ============================================================================
// MODAL DE CONFIRMACIÓN
// ============================================================================

/**
 * Crea y muestra un modal de confirmación personalizado
 * @param {string} citaId - ID de la cita (no usado pero necesario para contexto)
 * @param {string} nombrePaciente - Nombre del paciente para mostrar
 * @returns {Promise<boolean>} Promise que resuelve a true si se confirma, false si se cancela
 */
function confirmarEliminacion(citaId, nombrePaciente) {
  return new Promise((resolve) => {
    const modal = document.createElement("div")
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 9999;
      display: flex; align-items: center; justify-content: center;
    `

    const content = document.createElement("div")
    content.style.cssText = `
      background: white; padding: 24px; border-radius: 12px;
      max-width: 400px; width: 90%; box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    `

    // Sanitizar nombre del paciente
    const nombreSeguro = sanitizarTexto(nombrePaciente)
    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #1f2937;">Confirmar Eliminación</h3>
      <p style="margin: 0 0 24px 0; color: #6b7280;">¿Estás seguro de que deseas eliminar la cita de <strong>${nombreSeguro}</strong>?</p>
      <div style="display: flex; gap: 12px; justify-content: flex-end;">
        <button id="btnCancelDelete" style="padding: 8px 16px; border: 1px solid #d1d5db; background: white; border-radius: 6px; cursor: pointer;">Cancelar</button>
        <button id="btnConfirmDelete" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Eliminar</button>
      </div>
    `

    modal.appendChild(content)
    document.body.appendChild(modal)

    const limpiarModal = () => {
      modal.remove()
    }

    document.getElementById("btnCancelDelete").onclick = () => {
      limpiarModal()
      resolve(false)
    }

    document.getElementById("btnConfirmDelete").onclick = () => {
      limpiarModal()
      resolve(true)
    }

    modal.onclick = (e) => {
      if (e.target === modal) {
        limpiarModal()
        resolve(false)
      }
    }
  })
}

// ============================================================================
// RENDERIZADO DE CALENDARIO
// ============================================================================

/**
 * Renderiza el calendario según la vista actual (mensual o semanal)
 */
function renderCalendar() {
  const month = currentMonth.getMonth()
  const year = currentMonth.getFullYear()
  const monthName = currentMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })

  if (domElements.currentMonth_display) {
    domElements.currentMonth_display.textContent = monthName
  }

  if (currentView === "monthly") {
    renderMonthlyCalendar()
  } else {
    renderWeeklyCalendar()
  }
}

/**
 * Renderiza la vista mensual del calendario
 */
function renderMonthlyCalendar() {
  const month = currentMonth.getMonth()
  const year = currentMonth.getFullYear()
  const firstOfMonth = new Date(year, month, 1)
  const startDay = (firstOfMonth.getDay() + 6) % 7 // 0=Lun
  const startDate = new Date(year, month, 1 - startDay)

  const citasPorDia = agruparCitasPorDia(citasData)

  if (!domElements.monthlyCalendarGrid) return

  domElements.monthlyCalendarGrid.innerHTML = ""

  // Encabezados de días de la semana
  const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sab", "Dom"]
  daysOfWeek.forEach((day) => {
    const dayHeader = document.createElement("div")
    dayHeader.className = "monthly-day-header"
    dayHeader.textContent = day
    domElements.monthlyCalendarGrid.appendChild(dayHeader)
  })

  // Renderizar días del mes (42 = 6 semanas)
  for (let i = 0; i < 42; i++) {
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + i)
    const key = dayDate.toISOString().slice(0, 10)
    const isCurrentMonth = dayDate.getMonth() === month

    const dayCell = document.createElement("div")
    dayCell.className = `monthly-day-cell ${!isCurrentMonth ? "other-month" : ""}`

    const dayNumber = document.createElement("div")
    dayNumber.className = "day-number"
    dayNumber.textContent = dayDate.getDate()
    dayCell.appendChild(dayNumber)

    // Agregar indicadores de citas
    const citasDia = citasPorDia[key] || []
    if (citasDia.length > 0) {
      const citasIndicator = document.createElement("div")
      citasIndicator.className = "citas-indicator"

      // Mostrar máximo 3 puntos indicadores
      citasDia.slice(0, 3).forEach((cita) => {
        const dot = document.createElement("div")
        dot.className = "cita-dot"
        dot.style.background = COLORES_ESTADO[cita.estado] || "#64748b"
        citasIndicator.appendChild(dot)
      })

      if (citasDia.length > 3) {
        const moreDot = document.createElement("div")
        moreDot.className = "cita-dot more"
        moreDot.textContent = `+${citasDia.length - 3}`
        citasIndicator.appendChild(moreDot)
      }

      dayCell.appendChild(citasIndicator)
    }

    // Click para ir a vista semanal de ese día
    if (isCurrentMonth) {
      dayCell.style.cursor = "pointer"
      dayCell.addEventListener("click", () => {
        currentMonth = new Date(year, month, dayDate.getDate())
        currentView = "weekly"
        if (domElements.btnViewMonthly && domElements.btnViewWeekly) {
          domElements.btnViewMonthly.classList.remove("active")
          domElements.btnViewWeekly.classList.add("active")
        }
        if (domElements.monthlyView && domElements.weeklyView) {
          domElements.monthlyView.style.display = "none"
          domElements.weeklyView.style.display = "block"
        }
        renderCalendar()
      })
    }

    domElements.monthlyCalendarGrid.appendChild(dayCell)
  }
}

/**
 * Renderiza la vista semanal del calendario (horario)
 */
function renderWeeklyCalendar() {
  const month = currentMonth.getMonth()
  const year = currentMonth.getFullYear()
  const day = currentMonth.getDate()
  const currentDate = new Date(year, month, day)
  const dayOfWeek = (currentDate.getDay() + 6) % 7 // 0=Lun
  const startDate = new Date(currentDate)
  startDate.setDate(currentDate.getDate() - dayOfWeek)

  const citasPorDia = agruparCitasPorDia(citasData)

  // Generar horas (8 AM a 5 PM = 10 horas)
  if (domElements.hoursGrid) {
    domElements.hoursGrid.innerHTML = ""
    for (let h = HORARIO_CLINICA.HORA_INICIO; h < HORARIO_CLINICA.HORA_FIN; h++) {
      const hourCell = document.createElement("div")
      hourCell.className = "hour-cell"
      hourCell.textContent = `${h}:00`
      domElements.hoursGrid.appendChild(hourCell)
    }
  }

  // Generar encabezados de días (7 días consecutivos)
  if (domElements.scheduleHeader) {
    domElements.scheduleHeader.innerHTML = ""
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate)
      dayDate.setDate(startDate.getDate() + i)
      const dayName = dayDate.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase()
      const dayNum = dayDate.getDate()

      const dayHeader = document.createElement("div")
      dayHeader.className = "day-header"
      dayHeader.innerHTML = `<strong>${dayName}</strong><span class="day-num">${dayNum}</span>`
      dayHeader.style.cursor = "pointer"

      dayHeader.addEventListener("click", () => {
        if (domElements.filterEstado && domElements.filterTipo && domElements.filterPaciente && domElements.filterFecha) {
          domElements.filterEstado.value = ""
          domElements.filterTipo.value = ""
          domElements.filterPaciente.value = ""
          domElements.filterFecha.value = dayDate.toISOString().slice(0, 10)
          aplicarFiltros()
        }
      })

      domElements.scheduleHeader.appendChild(dayHeader)
    }
  }

  // Generar grilla de citas
  if (domElements.scheduleGrid) {
    domElements.scheduleGrid.innerHTML = ""

    // Rastrear qué citas ya fueron renderizadas (para evitar duplicados)
    const citasRenderizadas = new Set()

    for (let h = HORARIO_CLINICA.HORA_INICIO; h < HORARIO_CLINICA.HORA_FIN; h++) {
      for (let d = 0; d < 7; d++) {
        const dayDate = new Date(startDate)
        dayDate.setDate(startDate.getDate() + d)
        const key = dayDate.toISOString().slice(0, 10)

        const cell = document.createElement("div")
        cell.className = "schedule-cell"

        const citasDia = citasPorDia[key] || []

        // Buscar citas que se solapen con esta hora
        for (const cita of citasDia) {
          if (citasRenderizadas.has(cita._id)) continue

          const citaInicio = new Date(cita.fechaHora)
          const citaDuracion = cita.duracion || 15
          const citaHoraInicio = citaInicio.getHours()
          const citaMinutosInicio = citaInicio.getMinutes()
          const citaFin = calcularHoraFin(cita.fechaHora, citaDuracion)
          const citaHoraFin = citaFin.getHours()
          const citaMinutosFin = citaFin.getMinutes()

          // Verificar si la cita se solapa con esta celda horaria
          const horaInicioDecimal = h
          const horaFinDecimal = h + 1

          const citaInicioDecimal = citaHoraInicio + citaMinutosInicio / 60
          const citaFinDecimal = citaHoraFin + citaMinutosFin / 60

          // Si hay solapamiento, renderizar la cita
          if (
            (citaInicioDecimal >= horaInicioDecimal && citaInicioDecimal < horaFinDecimal) ||
            (citaFinDecimal > horaInicioDecimal && citaFinDecimal <= horaFinDecimal) ||
            (citaInicioDecimal <= horaInicioDecimal && citaFinDecimal >= horaFinDecimal)
          ) {
            const nombrePaciente = (cita.pacienteId?.nombres || cita.pacienteId?.nombre || "N/A").substring(0, 10)
            const color = COLORES_ESTADO[cita.estado] || "#64748b"
            const horaInicio = formatearHora(cita.fechaHora)
            const horaFin = formatearHora(citaFin)

            // Calcular altura basada en duración (cada hora = 70px)
            const alturaPorHora = 70
            const duracionHoras = citaDuracion / 60
            const altura = Math.max(64, duracionHoras * alturaPorHora)

            cell.innerHTML = `
              <div class="appointment-block" style="background: ${color}; height: ${altura}px;">
                <div class="appointment-time">${sanitizarTexto(horaInicio)} - ${sanitizarTexto(horaFin)}</div>
                <div class="appointment-patient">${sanitizarTexto(nombrePaciente)}</div>
                <div class="appointment-type">${sanitizarTexto(cita.tipoExamen.substring(0, 12))}</div>
              </div>
            `
            const fecha = new Date(cita.fechaHora).toLocaleDateString("es-ES")
            cell.title = `${fecha} ${horaInicio} - ${horaFin} • ${cita.pacienteId?.nombres || "N/A"} • ${cita.tipoExamen} • ${cita.estado}`

            citasRenderizadas.add(cita._id)
            break // Solo una cita por celda
          }
        }

        domElements.scheduleGrid.appendChild(cell)
      }
    }
  }
}

// ============================================================================
// GESTIÓN DE MODALES
// ============================================================================

/**
 * Cierra el modal de cita
 */
function cerrarModalCita() {
  if (domElements.modalCita) {
    domElements.modalCita.style.display = "none"
  }
}

/**
 * Cierra el modal de acciones
 */
function cerrarModalAcciones() {
  if (domElements.modalAcciones) {
    domElements.modalAcciones.style.display = "none"
  }
}

// ============================================================================
// FILTROS Y BÚSQUEDA
// ============================================================================

/**
 * Aplica los filtros seleccionados a la lista de citas
 */
function aplicarFiltros() {
  if (
    !domElements.filterEstado ||
    !domElements.filterTipo ||
    !domElements.filterFecha ||
    !domElements.filterPaciente
  ) {
    return
  }

  const estado = domElements.filterEstado.value
  const tipo = domElements.filterTipo.value
  const fecha = domElements.filterFecha.value
  const texto = domElements.filterPaciente.value.trim().toLowerCase()

  citasFiltradas = citasData.filter((c) => {
    if (estado && c.estado !== estado) return false
    if (tipo && c.tipoExamen !== tipo) return false
    if (fecha) {
      const f = new Date(c.fechaHora).toISOString().slice(0, 10)
      if (f !== fecha) return false
    }
    if (texto) {
      const nombre = (c.pacienteId?.nombres || c.pacienteId?.nombre || "").toLowerCase()
      const ap = (c.pacienteId?.apellidos || "").toLowerCase()
      if (!(nombre.includes(texto) || ap.includes(texto))) return false
    }
    return true
  })

  currentPage = 1
  renderizarCitas()
  renderCalendar()
}

/**
 * Limpia todos los filtros aplicados
 */
function limpiarFiltros() {
  if (
    !domElements.filterEstado ||
    !domElements.filterTipo ||
    !domElements.filterFecha ||
    !domElements.filterPaciente
  ) {
    return
  }

  domElements.filterEstado.value = ""
  domElements.filterTipo.value = ""
  domElements.filterFecha.value = ""
  domElements.filterPaciente.value = ""
  citasFiltradas = citasData
  currentPage = 1
  renderizarCitas()
  renderCalendar()
}

// ============================================================================
// NAVEGACIÓN DE CALENDARIO
// ============================================================================

/**
 * Cambia el mes/semana según la vista actual
 * @param {number} direccion - Dirección de cambio (-1 anterior, 1 siguiente)
 */
function cambiarMes(direccion) {
  if (currentView === "monthly") {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direccion, 1)
  } else {
    // Para vista semanal, cambiar por semanas (7 días)
    currentMonth.setDate(currentMonth.getDate() + direccion * 7)
  }
  renderCalendar()
}

// ============================================================================
// CARGA DE DATOS
// ============================================================================

/**
 * Carga las citas desde el backend
 * Maneja diferentes formatos de respuesta y errores
 */
async function cargarCitas() {
  try {
    const response = await fetch("/api/citas")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success && result.data) {
      citasData = Array.isArray(result.data) ? result.data.filter((c) => c && c.fechaHora) : []
    } else if (Array.isArray(result)) {
      citasData = result.filter((c) => c && c.fechaHora)
    } else {
      console.error("Error al cargar citas: Estructura inesperada", result)
      citasData = []
      mostrarError("Error al cargar las citas")
    }

    citasFiltradas = citasData
    currentPage = 1
    renderizarCitas()
    await cargarPacientes()
    renderCalendar()
  } catch (error) {
    console.error("Error en la solicitud de citas:", error)
    citasData = []
    citasFiltradas = []
    renderizarCitas()
    await cargarPacientes()
    renderCalendar()
    mostrarError("Error al cargar las citas")
  }
}

/**
 * Carga los pacientes desde el backend y popula el datalist
 */
async function cargarPacientes() {
  try {
    const response = await fetch("/api/pacientes")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    let pacientes = []
    if (result.success && result.data) {
      pacientes = Array.isArray(result.data) ? result.data : []
    } else if (Array.isArray(result)) {
      pacientes = result
    }

    // Normalizar estructura de pacientes
    pacientesCargados = pacientes
      .filter((u) => u && u._id && (u.nombres || u.nombre))
      .map((u) => ({
        _id: u._id,
        nombres: u.nombres || u.nombre || "",
        apellidos: u.apellidos || "",
      }))

    const datalist = document.getElementById("pacientesList")
    const inputBuscar = document.getElementById("inputPacienteBuscar")
    const inputHidden = document.getElementById("inputPaciente")

    if (!datalist || !inputBuscar || !inputHidden) {
      console.error("No se encontraron elementos de búsqueda de pacientes")
      return
    }

    datalist.innerHTML = ""

    pacientesCargados.forEach((paciente) => {
      const option = document.createElement("option")
      const nombreCompleto = `${paciente.nombres} ${paciente.apellidos}`.trim()
      option.value = nombreCompleto
      option.setAttribute("data-id", paciente._id)
      datalist.appendChild(option)
    })

    // Configurar event listener para búsqueda (solo una vez)
    if (!inputBuscar.hasAttribute("data-listener-attached")) {
      inputBuscar.setAttribute("data-listener-attached", "true")
      inputBuscar.addEventListener("input", (e) => {
        const texto = e.target.value.trim()
        const opcion = Array.from(datalist.options).find((opt) => opt.value === texto)
        if (opcion) {
          inputHidden.value = opcion.getAttribute("data-id")
        } else {
          inputHidden.value = ""
        }
      })
    }
  } catch (error) {
    console.error("Error al cargar pacientes:", error)
    mostrarError("Error al cargar la lista de pacientes")
  }
}

// ============================================================================
// RENDERIZADO DE TABLA
// ============================================================================

/**
 * Renderiza la tabla de citas con paginación
 */
function renderizarCitas() {
  if (!domElements.citasTableBody) return

  if (citasFiltradas.length === 0) {
    domElements.citasTableBody.innerHTML = ""
    if (domElements.emptyState) {
      domElements.emptyState.style.display = "block"
    }
    const pagination = document.querySelector(".pagination")
    if (pagination) {
      pagination.style.display = "none"
    }
    return
  }

  if (domElements.emptyState) {
    domElements.emptyState.style.display = "none"
  }
  const pagination = document.querySelector(".pagination")
  if (pagination) {
    pagination.style.display = "flex"
  }

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const citasPage = citasFiltradas.slice(startIndex, endIndex)

  // Crear elementos de forma segura para prevenir XSS
  const fragment = document.createDocumentFragment()

  citasPage.forEach((cita) => {
    const row = document.createElement("tr")

    const tdFecha = document.createElement("td")
    const horaInicio = formatearHora(cita.fechaHora)
    const horaFin = formatearHora(calcularHoraFin(cita.fechaHora, cita.duracion || 15))
    const fecha = new Date(cita.fechaHora).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    tdFecha.innerHTML = `<div>${fecha}</div><div style="font-size:0.85rem; color:#666;">${horaInicio} - ${horaFin}</div>`

    const tdPaciente = document.createElement("td")
    tdPaciente.textContent = cita.pacienteId?.nombres || cita.pacienteId?.nombre || "N/A"

    const tdTipo = document.createElement("td")
    tdTipo.textContent = cita.tipoExamen

    const tdEstado = document.createElement("td")
    const selectEstado = crearSelectEstado(cita)
    tdEstado.appendChild(selectEstado)

    const tdAcciones = document.createElement("td")
    tdAcciones.innerHTML = `
      <div class="table-actions">
        <button class="btn-action edit" data-cita-id="${cita._id}" type="button">
          <i class="fa-solid fa-edit"></i> Editar
        </button>
        <button class="btn-action cancel" data-cita-id="${cita._id}" type="button">
          <i class="fa-solid fa-trash"></i> Eliminar
        </button>
      </div>
    `

    // Agregar event listeners a los botones
    const btnEdit = tdAcciones.querySelector(".btn-action.edit")
    const btnDelete = tdAcciones.querySelector(".btn-action.cancel")
    if (btnEdit) {
      btnEdit.addEventListener("click", () => editarCita(cita._id))
    }
    if (btnDelete) {
      btnDelete.addEventListener("click", () => eliminarCita(cita._id))
    }

    row.appendChild(tdFecha)
    row.appendChild(tdPaciente)
    row.appendChild(tdTipo)
    row.appendChild(tdEstado)
    row.appendChild(tdAcciones)

    fragment.appendChild(row)
  })

  domElements.citasTableBody.innerHTML = ""
  domElements.citasTableBody.appendChild(fragment)

  actualizarPaginacion()
}

/**
 * Crea un select de estado con estilos apropiados
 * @param {Object} cita - Objeto de cita
 * @returns {HTMLSelectElement} Elemento select configurado
 */
function crearSelectEstado(cita) {
  const select = document.createElement("select")
  select.className = "estado-select"
  select.setAttribute("data-cita-id", cita._id)
  const estiloBase = "padding:6px 10px; border-radius:6px; border:none; font-weight:600; cursor:pointer;"
  select.style.cssText = `${estiloBase} ${ESTILOS_ESTADO[cita.estado] || ESTILOS_ESTADO.Pendiente}`

  const estados = ["Pendiente", "Atendida", "Cancelada"]
  estados.forEach((estado) => {
    const option = document.createElement("option")
    option.value = estado
    option.textContent = estado
    option.selected = cita.estado === estado
    select.appendChild(option)
  })

  select.addEventListener("change", (e) => {
    cambiarEstadoCita(cita._id, e.target.value, select)
  })

  return select
}

/**
 * Actualiza la información de paginación
 */
function actualizarPaginacion() {
  const totalPages = Math.ceil(citasFiltradas.length / ITEMS_PER_PAGE)
  const pageInfo = document.getElementById("pageInfo")
  const btnPrev = document.getElementById("btnPrevPage")
  const btnNext = document.getElementById("btnNextPage")

  if (pageInfo) {
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`
  }
  if (btnPrev) {
    btnPrev.disabled = currentPage === 1
  }
  if (btnNext) {
    btnNext.disabled = currentPage === totalPages
  }
}

// ============================================================================
// GESTIÓN DE ESTADOS
// ============================================================================

/**
 * Cambia el estado de una cita
 * @param {string} citaId - ID de la cita
 * @param {string} nuevoEstado - Nuevo estado a asignar
 * @param {HTMLSelectElement} selectElement - Elemento select del estado
 */
async function cambiarEstadoCita(citaId, nuevoEstado, selectElement) {
  const estadoAnterior = citasData.find((c) => c._id === citaId)?.estado

  try {
    const response = await fetch(`/api/citas/${citaId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      // Actualizar color del selector inmediatamente
      if (selectElement) {
        selectElement.style.cssText = `padding:6px 10px; border-radius:6px; border:none; font-weight:600; cursor:pointer; ${ESTILOS_ESTADO[nuevoEstado] || ESTILOS_ESTADO.Pendiente}`
      }

      // Actualizar en memoria
      const cita = citasData.find((c) => c._id === citaId)
      if (cita) {
        cita.estado = nuevoEstado
      }

      mostrarExito(`Estado cambiado a ${nuevoEstado}`)
      renderizarCitas()
      renderCalendar()
    } else {
      mostrarError(result.message || "Error al cambiar estado")
      revertirEstadoSelector(selectElement, estadoAnterior)
    }
  } catch (error) {
    console.error("Error al cambiar estado:", error)
    mostrarError("Error al cambiar el estado")
    revertirEstadoSelector(selectElement, estadoAnterior)
  }
}

/**
 * Revierte el selector de estado a su valor anterior
 * @param {HTMLSelectElement} selectElement - Elemento select
 * @param {string} estadoAnterior - Estado anterior
 */
function revertirEstadoSelector(selectElement, estadoAnterior) {
  if (selectElement && estadoAnterior) {
    selectElement.value = estadoAnterior
    selectElement.style.cssText = `padding:6px 10px; border-radius:6px; border:none; font-weight:600; cursor:pointer; ${ESTILOS_ESTADO[estadoAnterior] || ESTILOS_ESTADO.Pendiente}`
  }
}

// Hacer función global para uso desde HTML
window.cambiarEstadoCita = cambiarEstadoCita

// ============================================================================
// VALIDACIÓN DE HORARIO
// ============================================================================

/**
 * Valida que la fecha/hora esté dentro del horario de atención de la clínica
 * @param {string} fechaHoraInput - Fecha y hora a validar (formato ISO)
 * @returns {{valido: boolean, mensaje?: string}} Resultado de la validación
 */
function validarHorarioClinica(fechaHoraInput) {
  const fecha = new Date(fechaHoraInput)
  const diaSemana = fecha.getDay()
  const hora = fecha.getHours()
  const minutos = fecha.getMinutes()
  const horaDecimal = hora + minutos / 60

  // No se atiende los domingos
  if (diaSemana === HORARIO_CLINICA.DOMINGO) {
    return { valido: false, mensaje: "La clínica no atiende los domingos" }
  }

  // Validar horario: 8:00 AM a 6:00 PM
  if (horaDecimal < HORARIO_CLINICA.HORA_INICIO || horaDecimal >= HORARIO_CLINICA.HORA_FIN) {
    return {
      valido: false,
      mensaje: "La clínica atiende de lunes a sábado de 8:00 AM a 6:00 PM",
    }
  }

  return { valido: true }
}

// ============================================================================
// CRUD DE CITAS
// ============================================================================

/**
 * Guarda una nueva cita o actualiza una existente
 * @param {Event} e - Evento del formulario
 */
async function guardarCita(e) {
  e.preventDefault()

  const inputPaciente = document.getElementById("inputPaciente")
  const inputFechaHora = document.getElementById("inputFechaHora")
  const inputDuracion = document.getElementById("inputDuracion")
  const inputTipo = document.getElementById("inputTipo")
  const inputMotivo = document.getElementById("inputMotivo")

  if (!inputPaciente || !inputFechaHora || !inputDuracion || !inputTipo || !inputMotivo) {
    mostrarError("Error al acceder a los campos del formulario")
    return
  }

  const pacienteId = inputPaciente.value.trim()
  const fechaHoraInput = inputFechaHora.value.trim()
  const duracion = parseInt(inputDuracion.value.trim(), 10)
  const tipoExamen = inputTipo.value.trim()
  const motivo = inputMotivo.value.trim()

  // Validar campos requeridos
  if (!pacienteId || !fechaHoraInput || !tipoExamen || !motivo) {
    mostrarError("Por favor completa todos los campos")
    return
  }

  // Validar duración
  if (isNaN(duracion) || duracion < 5 || duracion > 120) {
    mostrarError("La duración debe estar entre 5 y 120 minutos")
    return
  }

  // Validar horario de la clínica
  const validacion = validarHorarioClinica(fechaHoraInput)
  if (!validacion.valido) {
    mostrarError(validacion.mensaje)
    return
  }

  // Validar que la hora de fin no exceda el horario de la clínica
  const fechaHoraObj = new Date(fechaHoraInput)
  const horaFinCita = calcularHoraFin(fechaHoraObj, duracion)
  const horaFinDecimal = horaFinCita.getHours() + horaFinCita.getMinutes() / 60

  if (horaFinDecimal > HORARIO_CLINICA.HORA_FIN) {
    mostrarError(
      `La cita terminaría a las ${formatearHora(horaFinCita)}, pero la clínica cierra a las ${HORARIO_CLINICA.HORA_FIN}:00. Ajuste la hora de inicio o duración.`,
    )
    return
  }

  const fechaHora = fechaHoraObj.toISOString()

  try {
    const url = editingCitaId ? `/api/citas/${editingCitaId}` : "/api/citas"
    const method = editingCitaId ? "PUT" : "POST"

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pacienteId,
        fechaHora,
        duracion,
        tipoExamen,
        motivo,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Error desconocido" }))
      const mensajeError = errorData.message || "Error al guardar la cita"
      
      // Mostrar error en el formulario si es un cruce de horario
      const errorMensaje = document.getElementById("errorMensaje")
      if (errorMensaje && mensajeError.includes("cruce de horario")) {
        errorMensaje.textContent = mensajeError
        errorMensaje.style.display = "block"
        setTimeout(() => {
          if (errorMensaje) errorMensaje.style.display = "none"
        }, 5000)
      }
      
      mostrarError(mensajeError)
      return
    }

    const result = await response.json()

    if (result.success) {
      mostrarExito(editingCitaId ? "Cita actualizada exitosamente" : "Cita creada exitosamente")
      cerrarModalCita()
      await cargarCitas()
    } else {
      mostrarError(result.message || "Error desconocido")
    }
  } catch (error) {
    console.error("Error al guardar cita:", error)
    mostrarError("Error al guardar la cita")
  }
}

/**
 * Abre el modal para editar una cita
 * @param {string} citaId - ID de la cita a editar
 */
async function editarCita(citaId) {
  const cita = citasData.find((c) => c._id === citaId)
  if (!cita) {
    mostrarError("Cita no encontrada")
    return
  }

  editingCitaId = citaId
  const modalTitle = document.getElementById("modalTitle")
  const inputPacienteBuscar = document.getElementById("inputPacienteBuscar")
  const inputPaciente = document.getElementById("inputPaciente")
  const inputFechaHora = document.getElementById("inputFechaHora")
  const inputDuracion = document.getElementById("inputDuracion")
  const inputTipo = document.getElementById("inputTipo")
  const inputMotivo = document.getElementById("inputMotivo")

  if (
    !modalTitle ||
    !inputPacienteBuscar ||
    !inputPaciente ||
    !inputFechaHora ||
    !inputDuracion ||
    !inputTipo ||
    !inputMotivo
  ) {
    mostrarError("Error al acceder a los campos del formulario")
    return
  }

  modalTitle.textContent = "Editar Cita"

  // Limpiar mensaje de error si existe
  const errorMensaje = document.getElementById("errorMensaje")
  if (errorMensaje) {
    errorMensaje.style.display = "none"
    errorMensaje.textContent = ""
  }

  // Formatear fecha y hora para el input datetime-local
  const fechaObj = new Date(cita.fechaHora)
  const year = fechaObj.getFullYear()
  const month = String(fechaObj.getMonth() + 1).padStart(2, "0")
  const day = String(fechaObj.getDate()).padStart(2, "0")
  const hours = String(fechaObj.getHours()).padStart(2, "0")
  const minutes = String(fechaObj.getMinutes()).padStart(2, "0")
  const fechaHoraFormato = `${year}-${month}-${day}T${hours}:${minutes}`

  const pacienteNombre = `${cita.pacienteId?.nombres || cita.pacienteId?.nombre || ""} ${cita.pacienteId?.apellidos || ""}`.trim()
  inputPacienteBuscar.value = pacienteNombre
  inputPaciente.value = cita.pacienteId._id || cita.pacienteId?._id || ""
  inputFechaHora.value = fechaHoraFormato
  inputDuracion.value = cita.duracion || 15
  inputTipo.value = cita.tipoExamen
  inputMotivo.value = cita.motivo || ""

  if (domElements.modalCita) {
    domElements.modalCita.style.display = "flex"
  }
}

/**
 * Abre el modal para agregar una nueva cita
 */
function abrirModalAgregarCita() {
  editingCitaId = null
  const modalTitle = document.getElementById("modalTitle")
  const inputPacienteBuscar = document.getElementById("inputPacienteBuscar")
  const inputPaciente = document.getElementById("inputPaciente")
  const inputDuracion = document.getElementById("inputDuracion")

  if (modalTitle) {
    modalTitle.textContent = "Agregar Nueva Cita"
  }
  if (domElements.formCita) {
    domElements.formCita.reset()
  }
  if (inputPacienteBuscar) {
    inputPacienteBuscar.value = ""
  }
  if (inputPaciente) {
    inputPaciente.value = ""
  }
  if (inputDuracion) {
    inputDuracion.value = "15"
  }
  const errorMensaje = document.getElementById("errorMensaje")
  if (errorMensaje) {
    errorMensaje.style.display = "none"
    errorMensaje.textContent = ""
  }
  cargarPacientes()
  if (domElements.modalCita) {
    domElements.modalCita.style.display = "flex"
  }
}

/**
 * Elimina una cita con confirmación
 * @param {string} citaId - ID de la cita a eliminar
 */
async function eliminarCita(citaId) {
  const cita = citasData.find((c) => c._id === citaId)
  if (!cita) {
    mostrarError("Cita no encontrada")
    return
  }

  const nombrePaciente = cita.pacienteId?.nombres || cita.pacienteId?.nombre || "el paciente"

  const confirmado = await confirmarEliminacion(citaId, nombrePaciente)
  if (!confirmado) return

  try {
    const response = await fetch(`/api/citas/${citaId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()

    if (result.success) {
      mostrarExito("Cita eliminada exitosamente")
      await cargarCitas()
    } else {
      mostrarError(result.message || "Error desconocido")
    }
  } catch (error) {
    console.error("Error al eliminar cita:", error)
    mostrarError("Error al eliminar la cita")
  }
}

// Hacer funciones globales para uso desde HTML
window.editarCita = editarCita
window.eliminarCita = eliminarCita

// ============================================================================
// CONFIGURACIÓN DE EVENT LISTENERS
// ============================================================================

/**
 * Configura todos los event listeners de la aplicación
 */
function setupEventListeners() {
  // Modales
  if (domElements.btnAgregarCita) {
    domElements.btnAgregarCita.addEventListener("click", abrirModalAgregarCita)
  }
  if (domElements.btnCloseModal) {
    domElements.btnCloseModal.addEventListener("click", cerrarModalCita)
  }
  if (domElements.btnCancelForm) {
    domElements.btnCancelForm.addEventListener("click", cerrarModalCita)
  }
  if (domElements.btnCloseAcciones) {
    domElements.btnCloseAcciones.addEventListener("click", cerrarModalAcciones)
  }
  if (domElements.formCita) {
    domElements.formCita.addEventListener("submit", guardarCita)
  }

  // Filtros
  if (domElements.filterEstado) {
    domElements.filterEstado.addEventListener("change", aplicarFiltros)
  }
  if (domElements.filterTipo) {
    domElements.filterTipo.addEventListener("change", aplicarFiltros)
  }
  if (domElements.filterFecha) {
    domElements.filterFecha.addEventListener("change", aplicarFiltros)
  }
  if (domElements.filterPaciente) {
    domElements.filterPaciente.addEventListener("input", aplicarFiltros)
  }
  if (domElements.btnLimpiarFiltros) {
    domElements.btnLimpiarFiltros.addEventListener("click", limpiarFiltros)
  }

  // Vistas de calendario
  if (domElements.btnViewMonthly) {
    domElements.btnViewMonthly.addEventListener("click", () => {
      currentView = "monthly"
      currentMonth = new Date()
      if (domElements.btnViewMonthly && domElements.btnViewWeekly) {
        domElements.btnViewMonthly.classList.add("active")
        domElements.btnViewWeekly.classList.remove("active")
      }
      if (domElements.monthlyView && domElements.weeklyView) {
        domElements.monthlyView.style.display = "block"
        domElements.weeklyView.style.display = "none"
      }
      renderCalendar()
    })
  }

  if (domElements.btnViewWeekly) {
    domElements.btnViewWeekly.addEventListener("click", () => {
      currentView = "weekly"
      if (domElements.btnViewMonthly && domElements.btnViewWeekly) {
        domElements.btnViewMonthly.classList.remove("active")
        domElements.btnViewWeekly.classList.add("active")
      }
      if (domElements.monthlyView && domElements.weeklyView) {
        domElements.monthlyView.style.display = "none"
        domElements.weeklyView.style.display = "block"
      }
      renderCalendar()
    })
  }

  // Navegación de calendario
  if (domElements.prevMonth) {
    domElements.prevMonth.addEventListener("click", () => cambiarMes(-1))
  }
  if (domElements.nextMonth) {
    domElements.nextMonth.addEventListener("click", () => cambiarMes(1))
  }

  // Cerrar modales al hacer clic fuera
  if (domElements.modalCita) {
    domElements.modalCita.addEventListener("click", (e) => {
      if (e.target === domElements.modalCita) {
        cerrarModalCita()
      }
    })
  }

  if (domElements.modalAcciones) {
    domElements.modalAcciones.addEventListener("click", (e) => {
      if (e.target === domElements.modalAcciones) {
        cerrarModalAcciones()
      }
    })
  }
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener("DOMContentLoaded", () => {
  inicializarReferenciasDOM()
  setupEventListeners()

  // Event listeners de paginación
  const btnPrevPage = document.getElementById("btnPrevPage")
  const btnNextPage = document.getElementById("btnNextPage")

  if (btnPrevPage) {
    btnPrevPage.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--
        renderizarCitas()
      }
    })
  }

  if (btnNextPage) {
    btnNextPage.addEventListener("click", () => {
      const totalPages = Math.ceil(citasFiltradas.length / ITEMS_PER_PAGE)
      if (currentPage < totalPages) {
        currentPage++
        renderizarCitas()
      }
    })
  }

  // Cargar datos iniciales
  cargarCitas()
  renderCalendar()
})
