import '../styles/Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-logo">
          <div className="logo-placeholder">COS</div>
        </div>
        <div className="footer-text">
          <p>© {currentYear} CodeOfSweden</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
