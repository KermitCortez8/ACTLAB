document.addEventListener("DOMContentLoaded", () => {
    // --- LÓGICA DE ANIMACIÓN AL SCROLL (Código existente) ---

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    // Animar todas las secciones al hacer scroll
    document.querySelectorAll("section, .service-item").forEach(el => {
        observer.observe(el);
    });

    // Efecto hover en íconos (rebote)
    document.querySelectorAll(".service-item i").forEach(icon => {
        icon.addEventListener("mouseenter", () => {
            icon.classList.add("bounce");
        });
        icon.addEventListener("animationend", () => {
            icon.classList.remove("bounce");
        });
    });


    // --- NUEVA LÓGICA DEL CARRUSEL (Añadida) ---

    const track = document.querySelector('.carousel-track');
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const indicatorsContainer = document.querySelector('.carousel-indicators');
    const slideCount = slides.length;
    let currentIndex = 0;
    const intervalTime = 5000; // 5 segundos por diapositiva

    if (!track || slideCount === 0) return;

    // 1. Configurar los indicadores (puntos)
    const indicators = slides.map((_, index) => {
        const indicator = document.createElement('div');
        indicator.classList.add('indicator');
        if (index === 0) {
            indicator.classList.add('active');
        }
        indicator.addEventListener('click', () => {
            moveToSlide(index);
            resetInterval();
        });
        indicatorsContainer.appendChild(indicator);
        return indicator;
    });

    // 2. Función para mover el carrusel a un índice específico
    const moveToSlide = (targetIndex) => {
        if (targetIndex < 0 || targetIndex >= slideCount) return;

        // Calcula el desplazamiento necesario (ej: 0%, -100%, -200%)
        // Utilizamos 'vw' (ancho del viewport) para el desplazamiento
        const amountToMove = targetIndex * 100; 
        track.style.transform = `translateX(-${amountToMove}vw)`;
        currentIndex = targetIndex;

        // Actualizar los indicadores
        indicators.forEach(indicator => indicator.classList.remove('active'));
        indicators[currentIndex].classList.add('active');
    };

    // 3. Función para avanzar al siguiente slide
    const nextSlide = () => {
        const newIndex = (currentIndex + 1) % slideCount;
        moveToSlide(newIndex);
    };

    // 4. Configurar el intervalo de rotación automática
    let slideInterval = setInterval(nextSlide, intervalTime);

    // 5. Reiniciar el intervalo después de la interacción manual 
    const resetInterval = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(nextSlide, intervalTime);
    };
});