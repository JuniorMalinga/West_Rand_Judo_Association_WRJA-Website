import Reveal from "./Reveal";

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <section className="auth-section">
      <Reveal className="auth-card reference-auth-card">
        {title && <h2>{title}</h2>}
        {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
        {children}
        {footer && <div className="auth-card-footer">{footer}</div>}
      </Reveal>
    </section>
  );
}
