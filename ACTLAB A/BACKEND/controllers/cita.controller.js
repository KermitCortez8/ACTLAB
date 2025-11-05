import Cita from "../models/Cita.js"
import Paciente from "../models/Users.js" // modelo correcto de pacientes
import Usuario from "../models/Usuario.js" // usuarios del sistema (p.ej., médicos)

// Obtener todas las citas con filtros
export const getCitas = async (req, res) => {
  try {
    const { estado, pacienteId, medicoId, fechaInicio, fechaFin, tipoExamen } = req.query

    // Construir filtro dinámico
    const filtro = {}

    if (estado) filtro.estado = estado
    if (pacienteId) filtro.pacienteId = pacienteId
    if (medicoId) filtro.medicoId = medicoId
    if (tipoExamen) filtro.tipoExamen = tipoExamen

    // Filtro por rango de fechas
    if (fechaInicio || fechaFin) {
      filtro.fechaHora = {}
      if (fechaInicio) filtro.fechaHora.$gte = new Date(fechaInicio)
      if (fechaFin) filtro.fechaHora.$lte = new Date(fechaFin)
    }

    const citas = await Cita.find(filtro)
      .populate("pacienteId", "nombres apellidos celular")
      .populate("medicoId")
      .sort({ fechaHora: -1 })

    res.json({
      success: true,
      data: citas,
      total: citas.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener citas",
      error: error.message,
    })
  }
}

// Obtener cita por ID
export const getCitaById = async (req, res) => {
  try {
    const { id } = req.params
    const cita = await Cita.findById(id).populate("pacienteId").populate("medicoId")

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      })
    }

    res.json({
      success: true,
      data: cita,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener cita",
      error: error.message,
    })
  }
}

/**
 * Valida si hay cruce de horarios con otras citas
 * @param {Date} fechaHoraInicio - Fecha y hora de inicio de la cita
 * @param {number} duracion - Duración en minutos
 * @param {string} excludeId - ID de cita a excluir (para ediciones)
 * @returns {Promise<Object|null>} Cita que causa conflicto o null
 */
async function validarCruceCitas(fechaHoraInicio, duracion, excludeId = null) {
  const fechaHoraFin = new Date(fechaHoraInicio.getTime() + duracion * 60000)

  // Buscar todas las citas activas (no canceladas) en el mismo día
  const inicioDia = new Date(fechaHoraInicio)
  inicioDia.setHours(0, 0, 0, 0)
  const finDia = new Date(fechaHoraInicio)
  finDia.setHours(23, 59, 59, 999)

  const filtro = {
    fechaHora: {
      $gte: inicioDia,
      $lte: finDia,
    },
    estado: { $ne: "Cancelada" },
  }

  if (excludeId) {
    filtro._id = { $ne: excludeId }
  }

  const citasDelDia = await Cita.find(filtro)

  // Verificar cruces
  for (const cita of citasDelDia) {
    const citaInicio = new Date(cita.fechaHora)
    const citaDuracion = cita.duracion || 15
    const citaFin = new Date(citaInicio.getTime() + citaDuracion * 60000)

    // Verificar si hay solapamiento
    if (
      (fechaHoraInicio >= citaInicio && fechaHoraInicio < citaFin) ||
      (fechaHoraFin > citaInicio && fechaHoraFin <= citaFin) ||
      (fechaHoraInicio <= citaInicio && fechaHoraFin >= citaFin)
    ) {
      return cita
    }
  }

  return null
}

// Crear nueva cita
export const createCita = async (req, res) => {
  try {
    const { pacienteId, medicoId, fechaHora, motivo, tipoExamen, duracion = 15 } = req.body

    // Validar que el paciente exista (en colección Paciente)
    const paciente = await Paciente.findById(pacienteId)
    if (!paciente) {
      return res.status(404).json({ success: false, message: "Paciente no encontrado" })
    }

    // Validar duración
    const duracionNum = parseInt(duracion, 10)
    if (isNaN(duracionNum) || duracionNum < 5 || duracionNum > 120) {
      return res.status(400).json({
        success: false,
        message: "La duración debe estar entre 5 y 120 minutos",
      })
    }

    // Validar cruce de citas
    const fechaHoraObj = new Date(fechaHora)
    const citaConflictiva = await validarCruceCitas(fechaHoraObj, duracionNum)

    if (citaConflictiva) {
      const conflictoInicio = new Date(citaConflictiva.fechaHora)
      const conflictoFin = new Date(conflictoInicio.getTime() + (citaConflictiva.duracion || 15) * 60000)
      return res.status(400).json({
        success: false,
        message: `Hay un cruce de horario con otra cita (${conflictoInicio.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} - ${conflictoFin.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}). Edite o escoja otro horario.`,
      })
    }

    const nuevaCita = new Cita({
      pacienteId,
      medicoId: medicoId || null,
      fechaHora: fechaHoraObj,
      duracion: duracionNum,
      motivo,
      tipoExamen,
      estado: "Pendiente",
    })

    await nuevaCita.save()

    res.status(201).json({
      success: true,
      message: "Cita creada exitosamente",
      data: nuevaCita,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al crear cita",
      error: error.message,
    })
  }
}

// Actualizar cita
export const updateCita = async (req, res) => {
  try {
    const { id } = req.params
    const {
      estado,
      notasMedico,
      motivoCancelacion,
      canceladoPor,
      fechaHora,
      duracion,
      motivo,
      tipoExamen,
      pacienteId,
    } = req.body

    const cita = await Cita.findById(id)

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      })
    }

    // Si se actualiza fecha/hora o duración, validar cruces (excluyendo esta cita)
    if (fechaHora || duracion !== undefined) {
      const nuevaFechaHora = fechaHora ? new Date(fechaHora) : cita.fechaHora
      const nuevaDuracion = duracion !== undefined ? parseInt(duracion, 10) : cita.duracion || 15

      if (isNaN(nuevaDuracion) || nuevaDuracion < 5 || nuevaDuracion > 120) {
        return res.status(400).json({
          success: false,
          message: "La duración debe estar entre 5 y 120 minutos",
        })
      }

      const citaConflictiva = await validarCruceCitas(nuevaFechaHora, nuevaDuracion, id)

      if (citaConflictiva) {
        const conflictoInicio = new Date(citaConflictiva.fechaHora)
        const conflictoFin = new Date(
          conflictoInicio.getTime() + (citaConflictiva.duracion || 15) * 60000,
        )
        return res.status(400).json({
          success: false,
          message: `Hay un cruce de horario con otra cita (${conflictoInicio.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} - ${conflictoFin.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}). Edite o escoja otro horario.`,
        })
      }

      cita.fechaHora = nuevaFechaHora
      cita.duracion = nuevaDuracion
    }

    // Actualizar otros campos
    if (pacienteId) cita.pacienteId = pacienteId
    if (tipoExamen) cita.tipoExamen = tipoExamen
    if (motivo !== undefined) cita.motivo = motivo

    if (estado) {
      cita.estado = estado

      // Si se marca como atendida, registrar la fecha
      if (estado === "Atendida") {
        cita.fechaAtendida = new Date()
      }

      // Si se cancela, registrar quién y por qué
      if (estado === "Cancelada") {
        cita.canceladoPor = canceladoPor || "Admin"
        cita.motivoCancelacion = motivoCancelacion || "Sin especificar"
      }
    }

    if (notasMedico !== undefined) cita.notasMedico = notasMedico

    await cita.save()

    res.json({
      success: true,
      message: "Cita actualizada exitosamente",
      data: cita,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al actualizar cita",
      error: error.message,
    })
  }
}

// Eliminar cita
export const deleteCita = async (req, res) => {
  try {
    const { id } = req.params

    const cita = await Cita.findByIdAndDelete(id)

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      })
    }

    res.json({
      success: true,
      message: "Cita eliminada exitosamente",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al eliminar cita",
      error: error.message,
    })
  }
}

// Confirmar cita
export const confirmarCita = async (req, res) => {
  try {
    const { id } = req.params

    const cita = await Cita.findByIdAndUpdate(id, { estado: "Confirmada" }, { new: true })

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      })
    }

    res.json({
      success: true,
      message: "Cita confirmada exitosamente",
      data: cita,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al confirmar cita",
      error: error.message,
    })
  }
}

// Reprogramar cita
export const reprogramarCita = async (req, res) => {
  try {
    const { id } = req.params
    const { nuevaFechaHora } = req.body

    const cita = await Cita.findByIdAndUpdate(
      id,
      {
        fechaHora: new Date(nuevaFechaHora),
        estado: "Reprogramada",
      },
      { new: true },
    )

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      })
    }

    res.json({
      success: true,
      message: "Cita reprogramada exitosamente",
      data: cita,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al reprogramar cita",
      error: error.message,
    })
  }
}

// Cancelar cita
export const cancelarCita = async (req, res) => {
  try {
    const { id } = req.params
    const { motivo, canceladoPor } = req.body

    const cita = await Cita.findByIdAndUpdate(
      id,
      {
        estado: "Cancelada",
        motivoCancelacion: motivo || "Sin especificar",
        canceladoPor: canceladoPor || "Admin",
      },
      { new: true },
    )

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      })
    }

    res.json({
      success: true,
      message: "Cita cancelada exitosamente",
      data: cita,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al cancelar cita",
      error: error.message,
    })
  }
}

// Marcar cita como atendida
export const marcarAtendida = async (req, res) => {
  try {
    const { id } = req.params
    const { notasMedico } = req.body

    const cita = await Cita.findByIdAndUpdate(
      id,
      {
        estado: "Atendida",
        fechaAtendida: new Date(),
        notasMedico: notasMedico || null,
      },
      { new: true },
    )

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: "Cita no encontrada",
      })
    }

    res.json({
      success: true,
      message: "Cita marcada como atendida",
      data: cita,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al marcar cita como atendida",
      error: error.message,
    })
  }
}
