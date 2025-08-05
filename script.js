document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a los elementos del DOM ---
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
    
    // Elementos del tema
    const themeSwitchCheckbox = document.querySelector('.theme-switch__checkbox');
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
        } else {
            passwordOutput.value = '';
        }
    }

    function handleCheckboxChange(e) {
        const checkedCount = Array.from(optionsCheckboxes).filter(i => i.checked).length;
        if (checkedCount === 0) {
            e.target.checked = true;
        }
    }

    // --- Lógica del Tema ---
    
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
    applyTheme(savedTheme);
    displayNewPassword();
});