// Obtén el contexto del canvas y ajusta su tamaño
const canvas = document.getElementById('backgroundCanvas');
const ctx = canvas.getContext('2d');

// Función para redimensionar el canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Llama a la función al cargar la página y cuando la ventana cambie de tamaño
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Configuración de partículas
const particles = [];
const numParticles = 100;

// Crear partículas
for (let i = 0; i < numParticles; i++) {
    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2
    });
}

// Función para dibujar las partículas
function drawParticles() {
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    

    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Color blanco semitransparente
        ctx.fill();

        // Actualizar posición de la partícula
        particle.x -= particle.dx;
        // particle.y += particle.dy;

        // Rebote en los bordes
        if (particle.x < 0 || particle.x > canvas.width) particle.dx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.dy *= -1;
    });
}

// Función de animación
function animate() {
    drawParticles();
    requestAnimationFrame(animate);
}

// Iniciar la animación
animate();