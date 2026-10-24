"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** 路由切换时重新挂载，触发 slides 式横向入场 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
