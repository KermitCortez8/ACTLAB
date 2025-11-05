document.addEventListener("DOMContentLoaded", () => {


  // --- Chart 1: Citas por día de la semana ---
  const ctx1 = document.getElementById("chartCitasSemana");
  new Chart(ctx1, {
    type: "bar",
    data: {
      labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
      datasets: [
        {
          label: "Citas",
          data: [12, 19, 8, 15, 20, 10, 6],
          backgroundColor: "rgba(54, 162, 235, 0.7)",
          borderRadius: 8,
        },
      ],
    },
    options: { responsive: true, plugins: { legend: { display: false } } },
  });

  // --- Chart 2: Exámenes más solicitados ---
  const ctx2 = document.getElementById("chartExamenes");
  new Chart(ctx2, {
    type: "doughnut",
    data: {
      labels: ["Hemograma", "Glucosa", "Colesterol", "Urea", "COVID"],
      datasets: [
        {
          data: [30, 25, 20, 15, 10],
          backgroundColor: [
            "#4F46E5",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#3B82F6",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
    },
  });

  // --- Chart 3: Pacientes nuevos por mes ---
  const ctx3 = document.getElementById("chartPacientesMes");
  new Chart(ctx3, {
    type: "line",
    data: {
      labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
      datasets: [
        {
          label: "Pacientes Nuevos",
          data: [25, 40, 30, 50, 45, 60],
          borderColor: "#8B5CF6",
          backgroundColor: "rgba(139, 92, 246, 0.2)",
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
});
