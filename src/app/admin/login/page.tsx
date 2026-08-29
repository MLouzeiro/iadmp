'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Church } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Email ou senha incorretos');
      setLoading(false);
    } else {
      router.push('/admin');
    }
  };

  return (
    <div className="login-page">
      {/* Área Institucional */}
      <div className="login-brand">
        <div className="login-brand-overlay" />
        <div className="login-brand-content">
          <div className="login-logo">
            <img src="/images/logo.png" alt="IADMP" />
          </div>
          <h1>Igreja Assembleia de Deus</h1>
          <h2>Ministério da Promessa</h2>
          <p className="login-brand-tagline">
            Sistema de Gestão da Igreja
          </p>
          <div className="login-brand-verse">
            <span className="verse-ref">Salmos 27:1</span>
            <p>&ldquo;O Senhor é a minha luz e a minha salvacao; de quem terei medo?&rdquo;</p>
          </div>
        </div>
      </div>

      {/* Área de Login */}
      <div className="login-form-area">
        <div className="login-form-container">
          <div className="login-form-header">
            <div className="login-icon">
              <Church size={28} />
            </div>
            <h2>Bem-vindo</h2>
            <p>Acesse sua conta para gerenciar a igreja</p>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <span className="error-dot" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Senha</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Sua senha"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="login-loading">
                  <span className="spinner" />
                  Entrando...
                </span>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>&copy; {new Date().getFullYear()} IADMP. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }

        /* === BRAND AREA === */
        .login-brand {
          position: relative;
          flex: 1;
          display: none;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0a1628 0%, #0d1f35 50%, #132742 100%);
          overflow: hidden;
        }

        .login-brand-overlay {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(201, 168, 76, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(201, 168, 76, 0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        .login-brand-content {
          position: relative;
          z-index: 2;
          text-align: center;
          padding: 3rem;
          max-width: 420px;
        }

        .login-logo {
          margin-bottom: 2rem;
        }

        .login-logo img {
          height: 80px;
          width: auto;
          margin: 0 auto;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3));
        }

        .login-brand-content h1 {
          font-family: 'Playfair Display', serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: #f0ece2;
          margin-bottom: 0.3rem;
          line-height: 1.2;
        }

        .login-brand-content h2 {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          color: #c9a84c;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        .login-brand-tagline {
          font-size: 0.9rem;
          color: #8a8578;
          margin-bottom: 3rem;
        }

        .login-brand-verse {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(201, 168, 76, 0.12);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .verse-ref {
          display: block;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #c9a84c;
          margin-bottom: 0.75rem;
        }

        .login-brand-verse p {
          font-family: 'Playfair Display', serif;
          font-style: italic;
          font-size: 0.95rem;
          color: #c8c2b6;
          line-height: 1.6;
        }

        /* === FORM AREA === */
        .login-form-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: var(--bg-primary);
        }

        .login-form-container {
          width: 100%;
          max-width: 400px;
        }

        .login-form-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .login-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #c9a84c, #a67c1a);
          display: grid;
          place-items: center;
          margin: 0 auto 1.25rem;
          color: #0a1628;
          box-shadow: 0 8px 24px rgba(201, 168, 76, 0.25);
        }

        .login-form-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .login-form-header p {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        /* === ERROR === */
        .login-error {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 10px;
          color: #ef4444;
          font-size: 0.85rem;
          margin-bottom: 1.5rem;
          animation: shake 0.4s ease;
        }

        .error-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          flex-shrink: 0;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        /* === FORM === */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-field label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
        }

        .login-field input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: var(--bg-input);
          border: 1.5px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-primary);
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          outline: none;
        }

        .login-field input::placeholder {
          color: var(--text-muted);
          opacity: 0.6;
        }

        .login-field input:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1);
        }

        .login-field input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .password-wrapper {
          position: relative;
        }

        .password-wrapper input {
          padding-right: 3rem;
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.25rem;
          display: grid;
          place-items: center;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: var(--color-primary);
        }

        /* === SUBMIT === */
        .login-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.95rem 1.5rem;
          background: linear-gradient(135deg, #c9a84c, #a67c1a);
          color: #0a1628;
          border: none;
          border-radius: 10px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.5rem;
        }

        .login-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(201, 168, 76, 0.3);
        }

        .login-submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(10, 22, 40, 0.2);
          border-top-color: #0a1628;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* === FOOTER === */
        .login-footer {
          margin-top: 3rem;
          text-align: center;
        }

        .login-footer p {
          font-size: 0.75rem;
          color: var(--text-muted);
          opacity: 0.6;
        }

        /* === RESPONSIVE === */
        @media (min-width: 1024px) {
          .login-brand {
            display: flex;
          }
        }

        @media (max-width: 1023px) {
          .login-form-area {
            padding: 1.5rem;
          }

          .login-form-header {
            margin-bottom: 2rem;
          }
        }

        @media (max-width: 480px) {
          .login-form-area {
            padding: 1rem;
          }

          .login-form-header h2 {
            font-size: 1.5rem;
          }

          .login-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
          }

          .login-icon svg {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </div>
  );
}
