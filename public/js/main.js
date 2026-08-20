// Variable global para gestionar el estado entre cargas de Astro
let activeTypewriterTimeout = null;

// Theme Toggle - Respeta preferencias del sistema pero permite cambio manual
function initTheme() {
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    function applyTheme(theme) { // 'dark' or 'light'
        htmlElement.classList.remove('dark', 'light'); // Asegura que solo una clase esté presente
        htmlElement.classList.add(theme);
        localStorage.setItem('theme', theme);
    }

    function toggleTheme() {
        const currentTheme = htmlElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(currentTheme);
    }

    // Previene añadir listeners duplicados en las transiciones de página de Astro
    if (themeToggle.dataset.initialized) return;
    
    themeToggle.addEventListener('click', toggleTheme);
    themeToggle.dataset.initialized = 'true';

    // Carga inicial del tema
    const storedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (storedTheme) {
        applyTheme(storedTheme);
    } else if (prefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }

    // Escuchar cambios en las preferencias del sistema operativo
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        // Solo cambia el tema si el usuario no ha hecho una elección manual
        if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Animación Typewriter para encabezados dinámicos
async function initTypewriter() {
    const typewriterElement = document.querySelector('.typewriter');
    if (!typewriterElement) return;

    // --- Mejoras de Robustez y Flexibilidad ---
    // 1. Manejo de errores para el parseo de JSON
    let wordList;
    try {
        wordList = JSON.parse(typewriterElement.dataset.words);
    } catch (e) {
        console.error("Error al parsear data-words en el typewriter:", e);
        // Si hay un error, usamos un texto de fallback para que no quede vacío
        typewriterElement.textContent = typewriterElement.dataset.words || "Servicios Eléctricos";
        return;
    }

    // 2. Si la lista de palabras está vacía, no hacemos nada.
    if (!wordList || wordList.length === 0) return;

    // 3. Velocidades configurables vía data-attributes con valores por defecto
    const typeSpeed = parseInt(typewriterElement.dataset.typeSpeed, 10) || 100;
    const deleteSpeed = parseInt(typewriterElement.dataset.deleteSpeed, 10) || 50;
    const pauseEnd = parseInt(typewriterElement.dataset.pauseEnd, 10) || 2000;
    const pauseStart = parseInt(typewriterElement.dataset.pauseStart, 10) || 500;

    let currentWordIndex = 0;

    // Función de utilidad para crear pausas de forma legible
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- Lógica de Animación Refactorizada con async/await ---
    // Este bucle infinito se detendrá cuando el timeout se limpie en `initializeAllScripts`
    while (true) {
        const currentWord = wordList[currentWordIndex];

        // Escribir la palabra
        for (let i = 0; i < currentWord.length; i++) {
            typewriterElement.textContent = currentWord.substring(0, i + 1);
            await sleep(typeSpeed);
        }

        // Pausa al final de la palabra
        await sleep(pauseEnd);

        // Borrar la palabra
        for (let i = currentWord.length; i > 0; i--) {
            typewriterElement.textContent = currentWord.substring(0, i - 1);
            await sleep(deleteSpeed);
        }

        // Pausa antes de empezar la siguiente palabra
        await sleep(pauseStart);

        currentWordIndex = (currentWordIndex + 1) % wordList.length;
    }
}

// Animación de revelado al hacer scroll
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active'); // Usamos 'active' para coincidir con el CSS
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => observer.observe(el));
}

// Manejador del menú móvil
let mobileMenuAbortController = new AbortController();

function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;

    if (!hamburger || !navLinks) return;

    // Cancelamos los listeners anteriores para evitar duplicados en transiciones de Astro
    mobileMenuAbortController.abort();
    mobileMenuAbortController = new AbortController();
    const { signal } = mobileMenuAbortController;

    const focusableElements = navLinks.querySelectorAll('a[href], button');

    function toggleMenu() {
        const isMenuOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('toggle', isMenuOpen);
        hamburger.setAttribute('aria-expanded', isMenuOpen);
        body.classList.toggle('mobile-menu-open', isMenuOpen); // Añade/quita la clase para el overlay
        window.isMobileMenuOpen = isMenuOpen;

        if (isMenuOpen) {
            document.addEventListener('keydown', handleKeyDown, { signal });
            focusableElements.length > 0 && focusableElements[0].focus();
        } else {
            hamburger.focus();
        }
    }

    function handleKeyDown(e) {
        // 1. Cerrar con la tecla Escape
        if (e.key === 'Escape') {
            toggleMenu();
            return;
        }

        // 2. Atrapar el foco (Tab)
        if (e.key === 'Tab' && focusableElements.length > 0) {
            const firstFocusableElement = focusableElements[0];
            const lastFocusableElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstFocusableElement) {
                    lastFocusableElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastFocusableElement) {
                    firstFocusableElement.focus();
                    e.preventDefault();
                }
            }
        }
    }

    hamburger.addEventListener('click', toggleMenu, { signal });

    // Cerrar menú al hacer click en un enlace
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('open')) {
                toggleMenu();
            }
        }, { signal });
    });
}

// Manejador del formulario de contacto
function initFormHandler() {
    const form = document.querySelector('.contact-form-pro');
    const submitBtn = document.getElementById('btnSend');

    if (!form || !submitBtn) return;

    // Previene añadir listeners duplicados
    if (submitBtn.dataset.initialized) return;

    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const nameField = document.getElementById('fName');
        const phoneField = document.getElementById('fPhone');

        const formData = {
            name: nameField?.value,
            phone: phoneField?.value,
            service: document.getElementById('fService')?.value,
            message: document.getElementById('fMsg')?.value
        };

        // Validación visual mejorada
        let isValid = true;
        [nameField, phoneField].forEach(field => { // Solo validamos campos requeridos
            const parent = field.parentElement;
            const errorMsg = parent.querySelector('.error-message');
            if (!field.value.trim()) {
                field.setAttribute('aria-invalid', 'true');
                field.classList.add('is-invalid');
                if (errorMsg) errorMsg.style.display = 'block';
                isValid = false;
            } else {
                field.setAttribute('aria-invalid', 'false');
                field.classList.remove('is-invalid');
                if (errorMsg) errorMsg.style.display = 'none';
            }
        });

        if (!isValid) {
            // Enfocar el primer campo inválido para guiar al usuario
            form.querySelector('.is-invalid')?.focus();
            return;
        }

        // Redirección a WhatsApp
        const serviceText = formData.service ? `sobre: *${formData.service}*` : 'un servicio eléctrico';
        const messageText = formData.message ? `\n\n*Mensaje:* ${formData.message}` : '';
        const whatsappMessage = `Hola DomiVolt, mi nombre es *${formData.name}*.\nMe gustaría solicitar información ${serviceText}.${messageText}`;

        window.open(`https://wa.me/59167671818?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
    });

    submitBtn.dataset.initialized = 'true';
}

// Manejador del header que se oculta al hacer scroll
let isStickyHeaderInitialized = false;

function initStickyHeader() {
    const header = document.querySelector('.main-header');
    if (!header) return;

    if (isStickyHeaderInitialized) return;
    isStickyHeaderInitialized = true; // Marcar como inicializado al principio

    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
        if (!ticking) { // Solo procesar si no hay un frame en cola
            window.requestAnimationFrame(() => {
                const currentScrollY = window.scrollY;
                // Re-seleccionamos el header aquí para que funcione con las transiciones de Astro
                const localHeader = document.querySelector('.main-header');
                if (!localHeader) return;

                // Ocultar al bajar, mostrar al subir
                if (currentScrollY > lastScrollY && currentScrollY > 150 && !window.isMobileMenuOpen) {
                    localHeader.classList.add('header-hidden');
                } else {
                    localHeader.classList.remove('header-hidden');
                }

                lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
}

// Animación para la tarjeta de ahorro energético al hacer scroll
function initSavingCardAnimation() {
    const savingCard = document.querySelector('.saving-card');
    if (!savingCard) return;

    // Previene añadir listeners duplicados
    if (savingCard.dataset.observerInitialized) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // La animación se ejecuta solo una vez
            }
        });
    }, { threshold: 0.5 }); // La animación se activa cuando el 50% de la tarjeta es visible

    observer.observe(savingCard);
    savingCard.dataset.observerInitialized = 'true';
}

// Función principal para inicializar todos los scripts
function initializeAllScripts() {
    // Limpia cualquier timeout de la página anterior antes de inicializar de nuevo
    if (typeof activeTypewriterTimeout === 'number') {
        clearTimeout(activeTypewriterTimeout);
        activeTypewriterTimeout = null;
    }

    // Limpia los listeners del menú móvil de la página anterior
    if (mobileMenuAbortController) {
        mobileMenuAbortController.abort();
    }

    initTheme();
    initTypewriter();
    initScrollReveal();
    initMobileMenu();
    initFormHandler();
    initStickyHeader();
    initSavingCardAnimation();
}

// Ejecutar en la carga inicial
// Ejecutar después de cada transición de página de Astro
document.addEventListener('astro:after-swap', initializeAllScripts);

// Ejecución inicial en la primera carga de la página
document.addEventListener('DOMContentLoaded', initializeAllScripts);
