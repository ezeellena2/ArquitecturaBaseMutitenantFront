import { Component, createElement, lazy, Suspense, type ComponentType, type ReactNode, type SVGProps } from "react";

type Flag = ComponentType<SVGProps<SVGSVGElement>>;

const loadedFlags = new Map<string, ReturnType<typeof lazy<Flag>>>();

interface FlagErrorBoundaryProps {
  children: ReactNode;
  countryCode: string;
  title: string;
  className?: string;
}

class FlagErrorBoundary extends Component<FlagErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <span role="img" aria-label={this.props.title}
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

export function CountryFlag({ countryCode, title, className }: {
  countryCode: string;
  title: string;
  className?: string;
}) {
  const Flag = getLazyFlag(countryCode);
  return (
    <FlagErrorBoundary key={countryCode} countryCode={countryCode} title={title} className={className}>
      <Suspense fallback={<span aria-hidden="true" className={className} />}>
        {createElement(Flag, { role: "img", "aria-label": title, className, style: { aspectRatio: "3 / 2" } })}
      </Suspense>
    </FlagErrorBoundary>
  );
}
