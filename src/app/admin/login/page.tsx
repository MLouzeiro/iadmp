'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight, Church, Users, CalendarDays, Music, Shield, Mail, Lock } from 'lucide-react';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const prevBg = document.body.style.background;
    const prevBgImage = document.body.style.backgroundImage;
    document.body.style.background = 'transparent';
    document.body.style.backgroundImage = 'none';
    return () => {
      document.body.style.background = prevBg;
      document.body.style.backgroundImage = prevBgImage;
    };
  }, []);

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
    <div className={styles.page}>
      {/* Background decorations */}
      <div className={styles.bgDecor}>
        <div className={`${styles.bgCircle} ${styles.bgCircle1}`} />
        <div className={`${styles.bgCircle} ${styles.bgCircle2}`} />
        <div className={`${styles.bgCircle} ${styles.bgCircle3}`} />
        <div className={`${styles.bgLine} ${styles.bgLine1}`} />
        <div className={`${styles.bgLine} ${styles.bgLine2}`} />
      </div>

      {/* Institutional area */}
      <div className={styles.brand}>
        <div className={styles.brandContent}>
          <div className={styles.brandLogo}>
            <div className={styles.brandIcon}>
              <img src="/images/logo.png" alt="IADMP" />
            </div>
            <span className={styles.brandName}>IADMP</span>
          </div>

          <h1 className={styles.brandTitle}>
            Organize seu<br />
            ministério com<br />
            <span className={styles.brandHighlight}>excelência</span>
          </h1>

          <p className={styles.brandDesc}>
            Gerencie escalas, repertórios e membros do seu
            ministério de louvor em um só lugar.
          </p>

          <div className={styles.benefits}>
            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>
                <Users size={16} />
              </div>
              <span>Gestão de membros</span>
            </div>
            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>
                <CalendarDays size={16} />
              </div>
              <span>Escalas inteligentes</span>
            </div>
            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>
                <Music size={16} />
              </div>
              <span>Repertório completo</span>
            </div>
            <div className={styles.benefit}>
              <div className={styles.benefitIcon}>
                <Shield size={16} />
              </div>
              <span>Seguro e confiável</span>
            </div>
          </div>
        </div>

        <div className={styles.brandFooter}>
          &copy; {new Date().getFullYear()} IADMP. Todos os direitos reservados.
        </div>
      </div>

      {/* Login area */}
      <div className={styles.formArea}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardLogo}>
              <Church size={26} />
            </div>
            <h2>Bem-vindo de volta</h2>
            <p>Entre na sua conta para continuar</p>
          </div>

          {error && (
            <div className={styles.error} role="alert">
              <span className={styles.errorDot} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <div className={styles.inputWrapper}>
                <Mail size={18} className={styles.inputIcon} />
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
            </div>

            <div className={styles.field}>
              <div className={styles.fieldHeader}>
                <label htmlFor="password">Senha</label>
                <a href="#" className={styles.forgot} onClick={(e) => e.preventDefault()}>
                  Esqueci minha senha
                </a>
              </div>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
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
                  className={styles.passwordToggle}
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
              className={styles.submit}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.loading}>
                  <span className={styles.spinner} />
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

          <div className={styles.cardFooter}>
            <p>
              Problemas com acesso?{' '}
              <span className={styles.support}>Fale com o administrador</span>
            </p>
          </div>
        </div>

        <div className={styles.mobileFooter}>
          &copy; {new Date().getFullYear()} IADMP. Todos os direitos reservados.
        </div>
      </div>
    </div>
  );
}
