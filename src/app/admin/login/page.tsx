'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Church, Users, CalendarDays, Music, Headphones } from 'lucide-react';

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
        <div className="login-brand-content">
          <div className="login-brand-logo">
            <div className="login-brand-icon">
              <img src="/images/logo.png" alt="IADMP" />
            </div>
            <span className="login-brand-name">IADMP</span>
          </div>

          <h1 className="login-brand-title">
            Organize seu<br />
            ministério com<br />
            excelência
          </h1>

          <p className="login-brand-desc">
            Gerencie escalas, repertórios e membros do seu
            ministério de louvor em um só lugar.
          </p>

          <div className="login-benefits">
            <div className="login-benefit">
              <div className="login-benefit-icon">
                <Users size={16} />
              </div>
              <span>Gestão de membros</span>
            </div>
            <div className="login-benefit">
              <div className="login-benefit-icon">
                <CalendarDays size={16} />
              </div>
              <span>Escalas inteligentes</span>
            </div>
            <div className="login-benefit">
              <div className="login-benefit-icon">
                <Music size={16} />
              </div>
              <span>Repertório completo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Login */}
      <div className="login-form-area">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-logo">
              <Church size={22} />
              <span>IADMP</span>
            </div>
            <h2>Bem-vindo de volta</h2>
            <p>Entre na sua conta para continuar</p>
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

            <div className="login-options">
              <a href="#" className="login-forgot" onClick={(e) => e.preventDefault()}>
                Esqueci minha senha
              </a>
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

          <div className="login-card-footer">
            <div className="login-divider" />
            <p>
              Problemas com acesso?{' '}
              <span className="login-support">Fale com o administrador</span>
            </p>
            <p className="login-copyright">
              &copy; {new Date().getFullYear()} IADMP. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #ffe477 0%, #ffd45a 45%, #f5a000 100%);
        }

        /* === BRAND AREA === */
        .login-brand {
          flex: 0 0 45%;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          position: relative;
          overflow: hidden;
        }

        .login-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 30%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(255, 255, 255, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }

        .login-brand-content {
          position: relative;
          z-index: 2;
          max-width: 380px;
        }

        .login-brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
        }

        .login-brand-icon {
          width: 48px;
          height: 48px;
          background: rgba(139, 105, 20, 0.15);
          border: 1px solid rgba(139, 105, 20, 0.25);
          border-radius: 12px;
          display: grid;
          place-items: center;
          padding: 6px;
        }

        .login-brand-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .login-brand-name {
          font-family: var(--font-montserrat), 'Montserrat', sans-serif;
          font-size: 1.2rem;
          font-weight: 700;
          color: #4a3000;
          letter-spacing: 0.03em;
        }

        .login-brand-title {
          font-family: var(--font-montserrat), 'Montserrat', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: #3d2800;
          line-height: 1.2;
          margin-bottom: 1rem;
        }

        .login-brand-desc {
          font-size: 0.95rem;
          color: #6b4e00;
          line-height: 1.6;
          margin-bottom: 2.5rem;
          opacity: 0.85;
        }

        .login-benefits {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .login-benefit {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .login-benefit-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(139, 105, 20, 0.12);
          display: grid;
          place-items: center;
          color: #6b4e00;
          flex-shrink: 0;
        }

        .login-benefit span {
          font-family: var(--font-montserrat), 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: #4a3000;
        }

        /* === FORM AREA === */
        .login-form-area {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow:
            0 4px 6px -1px rgba(0, 0, 0, 0.08),
            0 20px 50px -12px rgba(0, 0, 0, 0.15);
          padding: 2.5rem;
        }

        .login-card-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-card-logo {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #f9f6ef;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          color: #8b6914;
        }

        .login-card-logo span {
          font-family: var(--font-montserrat), 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          color: #4a3000;
          letter-spacing: 0.03em;
        }

        .login-card-header h2 {
          font-family: var(--font-montserrat), 'Montserrat', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.35rem;
        }

        .login-card-header p {
          font-size: 0.875rem;
          color: #6b6b6b;
        }

        /* === ERROR === */
        .login-error {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
          animation: shake 0.4s ease;
        }

        .error-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #dc2626;
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
          gap: 1.125rem;
        }

        .login-field label {
          display: block;
          font-family: var(--font-montserrat), 'Montserrat', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          color: #3d3d3d;
          margin-bottom: 0.4rem;
        }

        .login-field input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #ffffff;
          border: 1.5px solid #d9dfe8;
          border-radius: 8px;
          color: #1a1a1a;
          font-family: var(--font-montserrat), 'Montserrat', sans-serif;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          outline: none;
        }

        .login-field input::placeholder {
          color: #a0a0a0;
        }

        .login-field input:focus {
          border-color: #c9a84c;
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.12);
        }

        .login-field input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #f5f5f5;
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
          color: #a0a0a0;
          cursor: pointer;
          padding: 0.25rem;
          display: grid;
          place-items: center;
          transition: color 0.2s;
        }

        .password-toggle:hover {
          color: #8b6914;
        }

        .login-options {
          display: flex;
          justify-content: flex-end;
          margin-top: -0.25rem;
        }

        .login-forgot {
          font-family: var(--font-montserrat), 'Montserrat', sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          color: #8b6914;
          text-decoration: none;
          transition: color 0.2s;
        }

        .login-forgot:hover {
          color: #6b4e00;
          text-decoration: underline;
        }

        /* === SUBMIT === */
        .login-submit {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #f5a000 0%, #e08d00 100%);
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-family: var(--font-montserrat), 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 0.25rem;
        }

        .login-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #e08d00 0%, #c97e00 100%);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(245, 160, 0, 0.3);
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
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* === CARD FOOTER === */
        .login-card-footer {
          margin-top: 1.75rem;
          text-align: center;
        }

        .login-divider {
          height: 1px;
          background: #e5e7eb;
          margin-bottom: 1.25rem;
        }

        .login-card-footer > p:first-of-type {
          font-size: 0.8rem;
          color: #6b6b6b;
          margin-bottom: 1rem;
        }

        .login-support {
          color: #8b6914;
          font-weight: 500;
        }

        .login-copyright {
          font-size: 0.7rem;
          color: #a0a0a0;
        }

        /* === RESPONSIVE === */
        @media (min-width: 1024px) {
          .login-brand {
            display: flex;
          }

          .login-form-area {
            flex: 0 0 55%;
          }
        }

        @media (max-width: 1023px) {
          .login-form-area {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .login-form-area {
            padding: 1rem;
          }

          .login-card {
            padding: 1.75rem;
          }

          .login-card-header h2 {
            font-size: 1.35rem;
          }
        }
      `}</style>
    </div>
  );
}
