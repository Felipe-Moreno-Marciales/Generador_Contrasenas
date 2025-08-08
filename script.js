document.addEventListener('DOMContentLoaded', () => {
    // Elementos de la UI
    const passwordOutput = document.getElementById('passwordOutput');
    const copyButton = document.getElementById('copyButton');
    const copyButtonText = document.getElementById('copyButtonText');
    const lengthInput = document.getElementById('length');
    const lengthValue = document.getElementById('lengthValue');
    const includeUppercase = document.getElementById('includeUppercase');
    const includeLowercase = document.getElementById('includeLowercase');
    const includeNumbers = document.getElementById('includeNumbers');
    const includeSymbols = document.getElementById('includeSymbols');
    const generateButton = document.getElementById('generateButton');
    const optionsCheckboxes = document.querySelectorAll('.options-grid input[type="checkbox"]');
    const statusAnnouncer = document.getElementById('status-announcer');
    const strengthText = document.getElementById('strength-indicator-text');

    // Elementos del tema y color
    const themeSwitchCheckbox = document.querySelector('.theme-switch__checkbox');
    const accentColorRadios = document.querySelectorAll('input[name="accent-color"]');
    const body = document.body;

    // --- Constantes ---
    const CHAR_SETS = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>/?'
    };

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

    function generatePassword() {
        const length = parseInt(lengthInput.value);
        let characterPool = '';
        if (includeUppercase.checked) characterPool += CHAR_SETS.uppercase;
        if (includeLowercase.checked) characterPool += CHAR_SETS.lowercase;
        if (includeNumbers.checked) characterPool += CHAR_SETS.numbers;
        if (includeSymbols.checked) characterPool += CHAR_SETS.symbols;
        if (characterPool === '') return '';

        let password = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = getSecureRandomNumber(characterPool.length);
            password += characterPool[randomIndex];
        }
        return password;
    }

    function checkPasswordStrength(password) {
        let score = 0;
        const length = password.length;

        // Contar cuántos tipos de caracteres están seleccionados
        let checkedOptions = [includeUppercase, includeLowercase, includeNumbers, includeSymbols].filter(el => el.checked).length;

        // Regla especial: si solo hay un tipo de caracter y la longitud es baja, es "Muy Débil"
        if (checkedOptions === 1 && length >= 8 && length <= 12) {
            score = 1; // Forzar el nivel más bajo
        } else if (!password) {
            score = 0;
        } else {
            // Lógica de puntuación existente
            if (length >= 12) score++;
            if (length >= 16) score++;
            if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
            if (/\d/.test(password)) score++;
            if (/[^A-Za-z0-9]/.test(password)) score++;
            // Pequeño bonus si cumple con los requisitos mínimos
            if (length >= 8 && score > 0) score++;
        }

        const strengthLevels = {
            0: { text: '', width: '0%', color: '#dc3545' },
            1: { text: 'Muy Débil', width: '20%', color: '#dc3545' },
            2: { text: 'Débil', width: '40%', color: '#fd7e14' },
            3: { text: 'Media', width: '60%', color: '#ffc107' },
            4: { text: 'Fuerte', width: '80%', color: '#28a745' },
            5: { text: 'Muy Fuerte', width: '100%', color: '#20c997' },
            6: { text: 'Excelente', width: '100%', color: '#17a2b8' }
        };
        
        const { text, width, color } = strengthLevels[score];
        
        document.documentElement.style.setProperty('--strength-bar-width', width);
        document.documentElement.style.setProperty('--strength-bar-color', color);
        strengthText.textContent = text;
    }

    async function copyPasswordToClipboard() {
        if (!passwordOutput.value) return;
        try {
            await navigator.clipboard.writeText(passwordOutput.value);
            copyButtonText.textContent = '¡Copiado!';
            // Anuncia el estado a los lectores de pantalla
            statusAnnouncer.textContent = 'Contraseña copiada al portapapeles.';
            
            setTimeout(() => {
                copyButtonText.textContent = 'Copiar';
                // Limpia el anunciador para que pueda ser reutilizado
                statusAnnouncer.textContent = '';
            }, 2000);
        } catch (err) {
            console.error('Error al copiar', err);
            statusAnnouncer.textContent = 'Error al copiar la contraseña.';
            alert('No se pudo copiar la contraseña.');
        }
    }

    function displayNewPassword() {
        const newPassword = generatePassword();
        if (newPassword) {
            passwordOutput.value = newPassword;
            checkPasswordStrength(newPassword);
        } else {
            passwordOutput.value = '';
            checkPasswordStrength('');
        }
    }

    function handleCheckboxChange(e) {
        const checkedCount = Array.from(optionsCheckboxes).filter(i => i.checked).length;
        if (checkedCount === 0) {
            e.target.checked = true;
        }
    }

    // --- Lógica del Tema y Color ---
    
    function applyTheme(theme) {
        body.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeSwitchCheckbox) {
            themeSwitchCheckbox.checked = theme === 'dark';
        }
    }

    function toggleTheme() {
        const newTheme = themeSwitchCheckbox.checked ? 'dark' : 'light';
        applyTheme(newTheme);
    }

    function applyAccentColor(color) {
        body.setAttribute('data-accent-color', color);
        localStorage.setItem('accentColor', color);
        const radioToSelect = document.getElementById(`color-${color}`);
        if (radioToSelect) {
            radioToSelect.checked = true;
        }
    }

    // --- Asignación de Eventos ---
    
    lengthInput.addEventListener('input', (e) => {
        lengthValue.textContent = e.target.value;
        displayNewPassword(); 
    });

    generateButton.addEventListener('click', displayNewPassword);
    copyButton.addEventListener('click', copyPasswordToClipboard);
    
    optionsCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckboxChange);
    });
    
    if (themeSwitchCheckbox) {
        themeSwitchCheckbox.addEventListener('change', toggleTheme);
    }
    
    accentColorRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            applyAccentColor(e.target.value);
        });
    });

    document.querySelectorAll('.option').forEach(optionDiv => {
        optionDiv.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                const checkbox = optionDiv.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });

    // --- Inicialización ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedAccentColor = localStorage.getItem('accentColor') || 'purple';
    applyTheme(savedTheme);
    applyAccentColor(savedAccentColor);
    displayNewPassword();
});