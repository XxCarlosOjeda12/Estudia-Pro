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
