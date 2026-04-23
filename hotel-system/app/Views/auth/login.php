<div class="login-container">
    <div class="login-card">
        <div class="login-header">
            <h1>Smart Hotel System</h1>
            <p>Sign in to your account</p>
        </div>
        
        <form id="login-form" class="login-form" method="POST" action="/login">
            <input type="hidden" name="_csrf_token" value="<?= $csrfToken ?>">
            
            <div class="form-group">
                <label for="email">Email Address</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    autocomplete="email"
                    placeholder="you@example.com"
                >
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required 
                    autocomplete="current-password"
                    placeholder="••••••••"
                >
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">
                Sign In
            </button>
            
            <div id="login-error" class="error-message hidden"></div>
        </form>
        
        <div class="login-footer">
            <p>Need help? Contact your hotel administrator.</p>
        </div>
    </div>
</div>

<style>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
}

.login-card {
    background: white;
    border-radius: var(--radius);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    width: 100%;
    max-width: 420px;
    padding: 2rem;
}

.login-header {
    text-align: center;
    margin-bottom: 2rem;
}

.login-header h1 {
    color: var(--primary);
    font-size: 1.75rem;
    margin-bottom: 0.5rem;
}

.login-header p {
    color: var(--gray-700);
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-weight: 600;
    color: var(--gray-700);
    font-size: 0.875rem;
}

.form-group input {
    padding: 0.75rem 1rem;
    border: 2px solid var(--gray-200);
    border-radius: var(--radius);
    font-size: 1rem;
    transition: all 0.2s;
}

.form-group input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary), transparent 80%);
}

.btn-block {
    width: 100%;
    padding: 0.875rem;
    font-size: 1rem;
    margin-top: 0.5rem;
}

.error-message {
    background: color-mix(in srgb, var(--danger), transparent 95%);
    color: var(--danger);
    padding: 0.75rem;
    border-radius: var(--radius);
    font-size: 0.875rem;
    text-align: center;
}

.error-message.hidden {
    display: none;
}

.login-footer {
    margin-top: 2rem;
    text-align: center;
    color: var(--gray-700);
    font-size: 0.875rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--gray-200);
}
</style>

<script>
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const errorDiv = document.getElementById('login-error');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    errorDiv.classList.add('hidden');
    
    try {
        const response = await fetch('/login', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.location.href = result.redirect;
        } else {
            errorDiv.textContent = result.message;
            errorDiv.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
    }
});
</script>
