import { Link } from "react-router-dom";
import pageHeader from "../assets/images/background/1125448-3840x2160-desktop-4k-combat-sports-background.jpg";

// Reusable page banner: dark background, title, and a breadcrumb.
// crumbs is an optional list of intermediate steps between Home and the
// current title, e.g. [{ label: "Our programs", to: "/programs" }] for a
// program detail page, giving Home / Our programs / Thai boxing.
export default function PageHeader({ title, crumbs = [] }) {
  return (
    <section
      className="page-header"
      style={{
        backgroundImage:
          `url(${pageHeader})`,
      }}
    >
      <div className="page-header-overlay" />
      <div className="page-header-content">
        <h1>{title}</h1>
        <p className="page-header-breadcrumb">
          <Link to="/">Home</Link>
          {crumbs.map((crumb) => (
            <span key={crumb.label}>
              <span> / </span>
              {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
            </span>
          ))}
          <span> / </span>
          <span className="current">{title}</span>
        </p>
      </div>
    </section>
  );
}