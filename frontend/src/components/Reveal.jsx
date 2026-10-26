import useScrollReveal from "../hooks/useScrollReveal";

export default function Reveal({ children, delay = 0, className = "", variant = "up" }) {
  const [ref, isVisible] = useScrollReveal();
  const revealDelay = Math.min(Math.max(Number(delay) || 0, 0), 240);

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? "reveal-visible" : ""} ${className}`.trim()}
      data-reveal={variant}
      style={{ "--reveal-delay": `${revealDelay}ms` }}
    >
      {children}
    </div>
  );
}
