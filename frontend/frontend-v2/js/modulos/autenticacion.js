// Login Page Logic

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const identifierInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const demoModeToggle = document.getElementById('demo-mode-toggle');
    const demoProfilesWrapper = document.getElementById('demo-profiles');
    const demoProfileButtons = document.querySelectorAll('[data-demo-profile]');
    const demoProfilesData = window.HARDCODED_DATA?.demoUsers || {};

    // Handle Login Submit
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const identifier = identifierInput.value.trim();
            const password = passwordInput.value;
            const rememberMe = document.getElementById('remember-me')?.checked;

            if (!identifier || !password) {
                showError('Por favor completa todos los campos');
                return;
            }

            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="animate-spin inline-block h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></span> Cargando...';

            try {
                const response = await apiService.login(identifier, password);

                if (!response?.success) {
                    showError(response?.message || 'Las credenciales no son válidas.');
                    return;
                }

                localStorage.setItem('authToken', response.token);
                if (response.user) {
                    localStorage.setItem('currentUser', JSON.stringify(response.user));
                }

                if (rememberMe) {
                    localStorage.setItem('savedIdentifier', identifier);
                } else {
                    localStorage.removeItem('savedIdentifier');
                }

                window.location.href = 'dashboard.html';
            } catch (error) {
                console.error('Login error:', error);
                showError('No pudimos contactar al servidor. Intenta nuevamente.');
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
    const savedIdentifier = localStorage.getItem('savedIdentifier');
    if (savedIdentifier && identifierInput) {
        identifierInput.value = savedIdentifier;
        const checkbox = document.getElementById('remember-me');
        if (checkbox) checkbox.checked = true;
    }

    if (demoModeToggle && window.EstudiaProDemo) {
        const renderDemoState = () => {
            const enabled = window.EstudiaProDemo.isEnabled();
            demoModeToggle.textContent = enabled ? 'Activado' : 'Desactivado';
            demoModeToggle.classList.toggle('bg-primary/10', enabled);
            demoModeToggle.classList.toggle('text-primary', enabled);
            demoModeToggle.classList.toggle('bg-slate-200', !enabled);
            demoModeToggle.classList.toggle('text-slate-500', !enabled);
            if (demoProfilesWrapper) {
                demoProfilesWrapper.classList.toggle('hidden', !enabled);
            }
        };

        renderDemoState();
        demoModeToggle.addEventListener('click', () => {
            const enabled = window.EstudiaProDemo.toggle();
            renderDemoState();
            Global.showNotification('Modo Demo', enabled ? 'Ahora verás datos de prueba incrustados.' : 'Modo real activado, usa tu backend en http://127.0.0.1:8000/api');
        });
    }

    if (demoProfileButtons.length) {
        demoProfileButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!window.EstudiaProDemo?.isEnabled()) {
                    Global.showNotification('Modo Demo', 'Activa el modo demo para usar estos perfiles.');
                    return;
                }
                const profileKey = btn.getAttribute('data-demo-profile');
                const profile = demoProfilesData?.[profileKey];
                if (profile && identifierInput && passwordInput) {
                    identifierInput.value = profile.email || profile.username;
                    passwordInput.value = profile.password || 'demo123';
                    identifierInput.focus();
                }
            });
        });
    }
});
// Register Page Logic

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('reg-name').value.trim();
            const username = document.getElementById('reg-username').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;
            const level = document.getElementById('reg-level')?.value || 'INGENIERIA';
            const role = document.querySelector('input[name="role"]:checked')?.value || 'estudiante';

            if (!name || !username || !email || !password || !confirmPassword) {
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

            const [firstName, ...rest] = name.split(' ');
            const payload = {
                username,
                email,
                password,
                password_confirm: confirmPassword,
                first_name: firstName,
                last_name: rest.join(' ') || firstName,
                rol: role.toUpperCase()
            };

            if (payload.rol === 'ESTUDIANTE') {
                payload.nivel_escolar = level || 'INGENIERIA';
            }

            if (payload.rol === 'CREADOR') {
                payload.especialidad = 'Matemáticas Aplicadas';
            }

            try {
                const response = await apiService.register(payload);

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
