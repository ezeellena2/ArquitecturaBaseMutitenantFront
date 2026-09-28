import { createElement, lazy, Suspense, type ComponentType, type SVGProps } from "react";

type Flag = ComponentType<SVGProps<SVGSVGElement>>;

const loadedFlags = new Map<string, ReturnType<typeof lazy<Flag>>>();

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
    <Suspense fallback={<span aria-hidden="true" className={className} />}>
      {createElement(Flag, { role: "img", "aria-label": title, className, style: { aspectRatio: "3 / 2" } })}
    </Suspense>
  );
}
