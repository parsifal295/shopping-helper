import type { PropsWithChildren } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { requireUser } from "@/lib/require-user";

export default async function AppLayout({ children }: PropsWithChildren) {
  await requireUser();

  return <MobileShell>{children}</MobileShell>;
}
