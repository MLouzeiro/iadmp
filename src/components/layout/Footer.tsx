import Link from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer>
      <div className="container footer__container">
        <article>
          <Link href="/" className="logo">
            <img src="/images/logo.png" alt="IADMP Logo" width={112} height={112} />
          </Link>
          <div className="footer__map">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d249.11181842598012!2d-44.1971642234773!3d-2.575184881323021!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7f69a71bc548e5f%3A0x478045d4b436b289!2sIADMP%20-%20Igreja%20Assembleia%20de%20Deus%20Miss%C3%A3o%20da%20Promessa!5e0!3m2!1spt-BR!2sbr!4v1713976051907!5m2!1spt-BR!2sbr"
              title="Localizacao da IADMP no Google Maps"
              loading="lazy"
            />
          </div>
        </article>

        <article>
          <h4>Links</h4>
          <nav>
            <Link href="/sobre">Sobre</Link>
            <Link href="/lideranca">Lideranca</Link>
            <Link href="/eventos">Eventos</Link>
            <Link href="/galeria">Galeria</Link>
            <Link href="/contato">Contato</Link>
          </nav>
        </article>

        <article>
          <h4>Congregacoes</h4>
          <nav>
            <Link href="/congregacoes">Cohabiano</Link>
            <Link href="/congregacoes">Recanto do Signos</Link>
            <Link href="/congregacoes">Vila Sarney Filho</Link>
            <Link href="/congregacoes">Novo Renascer</Link>
          </nav>
        </article>

        <article>
          <h4>Contato</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <a href="mailto:contato@iadmp.com.br">contato@iadmp.com.br</a>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <a href="https://wa.me/5598988035646" target="_blank" rel="noreferrer noopener">
              WhatsApp
            </a>
          </p>
        </article>
      </div>

      <div className="footer__copyright">
        <small>{currentYear} IADMP - Igreja Assembleia de Deus Ministerio da Promessa. Todos os direitos reservados.</small>
      </div>
    </footer>
  );
};

export default Footer;
