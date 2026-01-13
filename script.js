document.addEventListener('DOMContentLoaded', () => {
    // Cache optimizado de elementos de la UI
    const elements = {
        passwordOutput: document.getElementById('passwordOutput'),
        copyButton: document.getElementById('copyButton'),
        copyButtonText: document.getElementById('copyButtonText'),
        lengthInput: document.getElementById('length'),
        lengthValue: document.getElementById('lengthValue'),
        includeUppercase: document.getElementById('includeUppercase'),
        includeLowercase: document.getElementById('includeLowercase'),
        includeNumbers: document.getElementById('includeNumbers'),
        includeSymbols: document.getElementById('includeSymbols'),
        generateButton: document.getElementById('generateButton'),
        optionsCheckboxes: document.querySelectorAll('.options-grid input[type="checkbox"]'),
        statusAnnouncer: document.getElementById('status-announcer'),
        strengthText: document.getElementById('strength-indicator-text'),
        crackTimeText: document.getElementById('crack-time-text'),
        themeSwitchCheckbox: document.querySelector('.theme-switch__checkbox'),
        accentColorRadios: document.querySelectorAll('input[name="accent-color"]'),
        body: document.body
    };

    // --- Constantes ---
    const CHAR_SETS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>/?'
    };

    // Cache para optimización de rendimiento
    const strengthCache = new Map();
    let debounceTimer = null;

    // --- Funciones de Utilidad ---

    /**
     * Función debounced para evitar cálculos excesivos durante el cambio de slider
     */
    function debounce(func, wait) {
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(debounceTimer);
                func(...args);
            };
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(later, wait);
        };
    }

    /**
     * Obtiene el tamaño del conjunto de caracteres de forma optimizada
     */
    function getCharsetSize(password) {
        let charset = 0;
        if (/[a-z]/.test(password)) charset += 26;
        if (/[A-Z]/.test(password)) charset += 26;
        if (/[0-9]/.test(password)) charset += 10;
        if (/[^A-Za-z0-9]/.test(password)) charset += 32;
        return charset;
    }

    // --- Funciones para Calcular Tiempo de Descifrado ---

    /**
     * Calcula el tiempo estimado para descifrar una contraseña (versión optimizada).
     * @param {string} password - La contraseña a analizar.
     * @returns {string} El tiempo estimado en formato legible.
     */
    function calculateCrackTime(password) {
        if (!password || password.length === 0) {
            return '-';
        }

        // Usar cache si ya calculamos este password
        const charset = getCharsetSize(password);
        const cacheKey = `${password.length}_${charset}`;
        if (strengthCache.has(cacheKey)) {
            return strengthCache.get(cacheKey);
        }

        // Calcular combinaciones posibles
        const combinations = Math.pow(charset, password.length);
        
        // Asumiendo 1 billón de intentos por segundo (fuerza bruta moderna con GPU)
        const attemptsPerSecond = 1e12;
        const secondsToCrack = combinations / (2 * attemptsPerSecond); // promedio es la mitad
        
        const result = formatTime(secondsToCrack);
        
        // Guardar en cache
        strengthCache.set(cacheKey, result);
        return result;
    }

    /**
     * Formatea el tiempo en segundos a una cadena legible (versión mejorada).
     * @param {number} seconds - Tiempo en segundos.
     * @returns {string} Tiempo formateado.
     */
    function formatTime(seconds) {
        if (seconds < 1) return "Instantáneo";
        if (seconds < 60) return `${Math.ceil(seconds)} segundo${Math.ceil(seconds) !== 1 ? 's' : ''}`;
        if (seconds < 3600) return `${Math.ceil(seconds / 60)} minuto${Math.ceil(seconds / 60) !== 1 ? 's' : ''}`;
        if (seconds < 86400) return `${Math.ceil(seconds / 3600)} hora${Math.ceil(seconds / 3600) !== 1 ? 's' : ''}`;
        if (seconds < 31536000) return `${Math.ceil(seconds / 86400)} día${Math.ceil(seconds / 86400) !== 1 ? 's' : ''}`;
        if (seconds < 31536000 * 1000) return `${Math.ceil(seconds / 31536000)} año${Math.ceil(seconds / 31536000) !== 1 ? 's' : ''}`;
        if (seconds < 31536000 * 1000000) return `${Math.ceil(seconds / (31536000 * 1000))} mil años`;
        if (seconds < 31536000 * 1000000000) return `${Math.ceil(seconds / (31536000 * 1000000))} millones de años`;
        return "Billones de años";
    }

    // --- Lógica del Generador de Contraseñas ---

    /**
     * Genera un número aleatorio seguro usando la API de Criptografía Web.
     * @param {number} max - El límite superior (exclusivo) para el número aleatorio.
     * @returns {number} Un número aleatorio seguro entre 0 y max-1.
     */
    function getSecureRandomNumber(max) {
        // Crea un array de un solo elemento para almacenar un número de 32 bits sin signo.
        const randomValues = new Uint32Array(1);
        // Llena el array con un valor aleatorio criptográficamente seguro.
        window.crypto.getRandomValues(randomValues);
        // Usa el operador de módulo para ajustar el número al rango deseado [0, max-1].
        return randomValues[0] % max;
    }

    /**
     * Generador de contraseñas optimizado
     */
    function generatePassword() {
        const length = parseInt(elements.lengthInput.value);
        
        // Construcción más eficiente del pool de caracteres
        const activeCharSets = [];
        if (elements.includeUppercase.checked) activeCharSets.push(CHAR_SETS.uppercase);
        if (elements.includeLowercase.checked) activeCharSets.push(CHAR_SETS.lowercase);
        if (elements.includeNumbers.checked) activeCharSets.push(CHAR_SETS.numbers);
        if (elements.includeSymbols.checked) activeCharSets.push(CHAR_SETS.symbols);
        
        if (activeCharSets.length === 0) return '';
        
        const characterPool = activeCharSets.join('');

        // Generación optimizada con batch de números aleatorios
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);
        
        let password = '';
        for (let i = 0; i < length; i++) {
            password += characterPool[randomValues[i] % characterPool.length];
        }
        
        return password;
    }

    /**
     * Verificación de fortaleza mejorada con detección de patrones
     */
    function checkPasswordStrength(password) {
        if (!password) {
            updateStrengthDisplay(0, '', '0%', '#dc3545');
            if (elements.crackTimeText) elements.crackTimeText.textContent = '-';
            return;
        }

        let score = 0;
        const length = password.length;

        // Análisis mejorado de la contraseña
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSymbols = /[^A-Za-z0-9]/.test(password);
        const charTypes = [hasUpper, hasLower, hasNumbers, hasSymbols].filter(Boolean).length;

        // Regla especial: si solo hay un tipo de caracter y la longitud es baja, es "Muy Débil"
        if (charTypes === 1 && length <= 12) {
            score = 1; // Forzar el nivel más bajo
        } else {
            // Lógica de puntuación mejorada
            if (length >= 8) score++;
            if (length >= 12) score++;
            if (length >= 16) score++;
            if (length >= 20) score++;
            
            // Diversidad de caracteres
            score += charTypes;
            
            // Penalización por patrones comunes
            if (/(.)\1{2,}/.test(password)) score -= 1; // caracteres repetidos
            if (/123|abc|qwe|password|admin/i.test(password)) score -= 1; // secuencias/palabras comunes
            
            // Bonus por complejidad
            if (length >= 16 && charTypes >= 3) score++;
            if (length >= 20 && charTypes === 4) score++;
        }

        const strengthLevels = {
            0: { text: '', width: '0%', color: '#dc3545' },
            1: { text: 'Muy Débil', width: '15%', color: '#dc3545' },
            2: { text: 'Débil', width: '30%', color: '#fd7e14' },
            3: { text: 'Regular', width: '45%', color: '#ffc107' },
            4: { text: 'Buena', width: '60%', color: '#fd7e14' },
            5: { text: 'Fuerte', width: '75%', color: '#28a745' },
            6: { text: 'Muy Fuerte', width: '90%', color: '#20c997' },
            7: { text: 'Excelente', width: '100%', color: '#17a2b8' },
            8: { text: 'Perfecta', width: '100%', color: '#6f42c1' }
        };
        
        // Limitar score al rango válido
        score = Math.min(Math.max(score, 0), 8);
        
        const { text, width, color } = strengthLevels[score];
        updateStrengthDisplay(score, text, width, color);
        
        // Calcular y mostrar el tiempo de descifrado
        const crackTime = calculateCrackTime(password);
        if (elements.crackTimeText) {
            elements.crackTimeText.textContent = crackTime;
        }
    }

    /**
     * Actualiza la visualización de fortaleza de forma optimizada
     */
    function updateStrengthDisplay(score, text, width, color) {
        // Usar requestAnimationFrame para suavizar las animaciones
        requestAnimationFrame(() => {
            document.documentElement.style.setProperty('--strength-bar-width', width);
            document.documentElement.style.setProperty('--strength-bar-color', color);
            if (elements.strengthText) {
                elements.strengthText.textContent = text;
            }
        });
    }

    /**
     * Sistema de notificaciones mejorado
     */
    function showNotification(message, type = 'info') {
        elements.statusAnnouncer.textContent = message;
        
        setTimeout(() => {
            elements.statusAnnouncer.textContent = '';
        }, 3000);
    }

    /**
     * Copia optimizada con mejor manejo de errores
     */
    async function copyPasswordToClipboard() {
        if (!elements.passwordOutput.value) {
            showNotification('No hay contraseña para copiar', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(elements.passwordOutput.value);
            showCopySuccess();
        } catch (err) {
            console.error('Error al copiar:', err);
            // Fallback para navegadores más antiguos
            fallbackCopyTextToClipboard(elements.passwordOutput.value);
        }
    }

    /**
     * Fallback para copiar en navegadores sin soporte de Clipboard API
     */
    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            showCopySuccess();
        } catch (err) {
            showNotification('Error al copiar la contraseña', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    /**
     * Muestra feedback visual mejorado para copia exitosa
     */
    function showCopySuccess() {
        const originalText = elements.copyButtonText.textContent;
        const originalBg = elements.copyButton.style.background;
        
        elements.copyButtonText.textContent = '¡Copiado!';
        elements.copyButton.style.background = '#28a745';
        
        // Anuncia el estado a los lectores de pantalla
        elements.statusAnnouncer.textContent = 'Contraseña copiada al portapapeles.';
        
        setTimeout(() => {
            elements.copyButtonText.textContent = originalText;
            elements.copyButton.style.background = originalBg;
            elements.statusAnnouncer.textContent = '';
        }, 2000);
    }

    /**
     * Genera y muestra nueva contraseña con validación mejorada
     */
    function displayNewPassword() {
        const newPassword = generatePassword();
        if (newPassword) {
            elements.passwordOutput.value = newPassword;
            checkPasswordStrength(newPassword);
            
            // Limpiar cache si es muy grande para evitar uso excesivo de memoria
            if (strengthCache.size > 100) {
                strengthCache.clear();
            }
        } else {
            elements.passwordOutput.value = '';
            checkPasswordStrength('');
            showNotification('Selecciona al menos un tipo de carácter', 'warning');
        }
    }

    /**
     * Manejo mejorado de cambios en checkboxes con prevención de estado inválido
     */
    function handleCheckboxChange(e) {
        const checkedCount = Array.from(elements.optionsCheckboxes).filter(i => i.checked).length;
        if (checkedCount === 0) {
            e.target.checked = true;
            showNotification('Debe mantener al menos un tipo de carácter seleccionado', 'warning');
            return;
        }
        
        // Regenerar contraseña inmediatamente para mejor UX
        displayNewPassword();
    }

    // --- Lógica del Tema y Color (mantenida igual) ---
    
    function applyTheme(theme) {
        elements.body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (elements.themeSwitchCheckbox) {
            elements.themeSwitchCheckbox.checked = theme === 'dark';
        }
    }

    function toggleTheme() {
        const newTheme = elements.themeSwitchCheckbox.checked ? 'dark' : 'light';
        applyTheme(newTheme);
    }

    function applyAccentColor(color) {
        elements.body.setAttribute('data-accent-color', color);
        localStorage.setItem('accentColor', color);
        const radioToSelect = document.getElementById(`color-${color}`);
        if (radioToSelect) {
            radioToSelect.checked = true;
        }
    }

    // --- Event Listeners Optimizados ---
    
    // Mantener respuesta inmediata para el slider de longitud (como era originalmente)
    elements.lengthInput.addEventListener('input', (e) => {
        elements.lengthValue.textContent = e.target.value;
        displayNewPassword();
    });

    elements.generateButton.addEventListener('click', displayNewPassword);
    elements.copyButton.addEventListener('click', copyPasswordToClipboard);
    
    // Permitir ingreso manual de contraseña y actualizar calidad en tiempo real
    elements.passwordOutput.addEventListener('input', (e) => {
        const password = e.target.value;
        checkPasswordStrength(password);
    });
    
    // Solo usar debounce para los checkboxes, no para el slider
    elements.optionsCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
    
    if (elements.themeSwitchCheckbox) {
        elements.themeSwitchCheckbox.addEventListener('change', toggleTheme);
    }
    
    elements.accentColorRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            applyAccentColor(e.target.value);
        });
    });

    // Event delegation para mejor rendimiento en clicks de opciones
    const optionsGrid = document.querySelector('.options-grid');
    if (optionsGrid) {
        optionsGrid.addEventListener('click', (e) => {
            const optionDiv = e.target.closest('.option');
            if (optionDiv && e.target.tagName !== 'INPUT') {
                const checkbox = optionDiv.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            }
        });
    }

    // --- Inicialización Optimizada ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedAccentColor = localStorage.getItem('accentColor') || 'purple';
    
    applyTheme(savedTheme);
    applyAccentColor(savedAccentColor);
    displayNewPassword();

    // Optimización para carga de fuentes
    if ('fonts' in document) {
        document.fonts.ready.then(() => {
            console.log('Fuentes cargadas completamente');
        });
    }
});