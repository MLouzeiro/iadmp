'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 'var(--header-height)' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '3rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'var(--gradient-gold)', display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem', color: '#fff' }}>
          <Lock size={24} />
        </div>
        <h2 style={{ marginBottom: '0.5rem' }}>Area de Gestao</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Faca login para acessar o painel administrativo</p>

        {error && (
          <p style={{ color: '#f44336', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form__group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="form__group">
            <label htmlFor="password">Senha</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
