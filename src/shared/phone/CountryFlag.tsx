import { Component, createElement, lazy, Suspense, type ComponentType, type ReactNode, type SVGProps } from "react";
import { cn } from "@/shared/lib/utils";

// Lienzo v98: esquinas de 2 y un borde gris suave, para que una bandera blanca no se pierda sobre el blanco.
const flagFrame = "rounded-[2px] shadow-[0_0_0_1px_var(--borde-bandera)]";

type Flag = ComponentType<SVGProps<SVGSVGElement>>;

const loadedFlags = new Map<string, ReturnType<typeof lazy<Flag>>>();

interface FlagErrorBoundaryProps {
  children: ReactNode;
  countryCode: string;
  title: string;
  className?: string;
  decorative?: boolean;
}

class FlagErrorBoundary extends Component<FlagErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    const named = this.props.decorative ? { "aria-hidden": true } : { role: "img", "aria-label": this.props.title };
    if (this.state.failed) return <span {...named}
      className={`inline-flex items-center justify-center rounded border text-[9px] ${this.props.className ?? ""}`}>
      {this.props.countryCode}
    </span>;
    return this.props.children;
  }
}

function getLazyFlag(countryCode: string) {
  const cached = loadedFlags.get(countryCode);
  if (cached) return cached;

  const Flag = lazy(async () => {
    const flags = await import("country-flag-icons/react/3x2");
    const component = flags[countryCode as keyof typeof flags] as Flag | undefined;
    if (!component) throw new Error(`No hay bandera SVG para ${countryCode}.`);
    return { default: component };
  });
  loadedFlags.set(countryCode, Flag);
  return Flag;
}

export function CountryFlag({ countryCode, title, className, decorative = false }: {
  countryCode: string;
  title: string;
  className?: string;
  /** En una fila que ya dice el nombre del país, la bandera no se anuncia: si no, se oiría «Argentina Argentina». */
  decorative?: boolean;
}) {
  const Flag = getLazyFlag(countryCode);
  const framed = cn(flagFrame, className);
  const named = decorative ? { "aria-hidden": true } : { role: "img", "aria-label": title };
  return (
    <FlagErrorBoundary key={countryCode} countryCode={countryCode} title={title} className={framed} decorative={decorative}>
      <Suspense fallback={<span aria-hidden="true" className={framed} />}>
        {createElement(Flag, { ...named, className: framed, style: { aspectRatio: "3 / 2" } })}
      </Suspense>
    </FlagErrorBoundary>
  );
}
