import type { AccessKind } from "@/auth/AccessRoute";

const homes: Record<AccessKind, string> = {
  consumer: "/",
  business: "/org",
  platform: "/plataforma",
};

export function accessHome(access: AccessKind): string { return homes[access]; }
