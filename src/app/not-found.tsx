import Link from 'next/link';

export default function NotFound() {
  return (
    <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'var(--header-height)' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ fontSize: '5rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>404</h1>
        <h2 style={{ marginBottom: '1rem' }}>Página Não Encontrada</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>A página que você procura não existe ou foi movida.</p>
        <Link href="/" className="btn btn-primary">
          Voltar ao Início
        </Link>
      </div>
    </section>
  );
}
