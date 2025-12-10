// Login Page Logic

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Handle Login Submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = emailInput.value;
            const password = passwordInput.value;
            const rememberMe = document.getElementById('remember-me')?.checked;

            if (!email || !password) {
                showError('Por favor completa todos los campos');
                return;
            }

            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="animate-spin inline-block h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></span> Cargando...';

            try {
                // Call API Service (from global.js)
                const response = await apiService.login(email, password);

                if (response.success) {
                    // Save token
                    localStorage.setItem('authToken', response.token);
                    if (rememberMe) {
                        localStorage.setItem('savedEmail', email);
                    } else {
                        localStorage.removeItem('savedEmail');
                    }

                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    showError(response.message || 'Error al iniciar sesión');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Ocurrió un error inesperado. Intenta de nuevo.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Helper to show errors
    function showError(message) {
        Global.showNotification('Error de Inicio de Sesión', message);
    }

    // Auto-fill saved email
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail && emailInput) {
        emailInput.value = savedEmail;
        document.getElementById('remember-me').checked = true;
    }
});
// Register Page Logic

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('reg-name').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const role = document.querySelector('input[name="role"]:checked')?.value || 'estudiante';

            if (!name || !email || !password || !confirmPassword) {
                Global.showNotification('Campos Incompletos', 'Por favor completa todos los campos');
                return;
            }

            if (password !== confirmPassword) {
                Global.showNotification('Error de Contraseña', 'Las contraseñas no coinciden');
                return;
            }

            if (password.length < 6) {
                Global.showNotification('Contraseña Insegura', 'La contraseña debe tener al menos 6 caracteres');
                return;
            }

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="animate-spin inline-block h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></span> Creando cuenta...';

            try {
                const response = await apiService.register({
                    name,
                    email,
                    password,
                    role
                });

                if (response.success) {
                    Global.showNotification('¡Cuenta Creada!', 'Registro exitoso. Redirigiendo...');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    Global.showNotification('Error de Registro', response.message || 'Error al registrarse');
                }
            } catch (error) {
                console.error('Register error:', error);
                Global.showNotification('Error Inesperado', 'Ocurrió un error al intentar registrarse.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // Role Selection Logic (UI Visuals)
    const roleOptions = document.querySelectorAll('.role-option');
    roleOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all
            roleOptions.forEach(opt => {
                opt.classList.remove('border-primary', 'bg-primary/10');
                opt.classList.add('border-gray-200', 'dark:border-gray-700');
            });

            // Add selected class to clicked
            option.classList.remove('border-gray-200', 'dark:border-gray-700');
            option.classList.add('border-primary', 'bg-primary/10');

            // Check the radio input
            const radio = option.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });
});
