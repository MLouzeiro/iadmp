import Link from 'next/link';

export default function NotFound() {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', paddingTop: 'var(--header-height)' }}>
      <h1 style={{ fontSize: '5rem', background: 'var(--gradient-gold)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
      <h2 style={{ margin: '1rem 0 2rem' }}>Pagina nao encontrada</h2>
      <Link href="/" className="btn">Voltar ao Inicio</Link>
    </section>
  );
}
