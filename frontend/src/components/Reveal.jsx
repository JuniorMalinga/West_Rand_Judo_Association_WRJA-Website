import useScrollReveal from "../hooks/useScrollReveal";

// Wraps any section and fades/slides it into view the first time it
// scrolls into the viewport. delay (ms) staggers multiple children.
export default function Reveal({ children, delay = 0, className = "" }) {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? "reveal-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
