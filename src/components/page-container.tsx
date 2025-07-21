"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export function PageContainer({
  children,
  className,
  contentClassName,
}: PageContainerProps) {
  return (
    <div className={cn("flex min-h-svh flex-col items-center justify-center p-4 md:p-10 relative z-10", className)}>
      <div className={cn("w-full max-w-sm md:max-w-2xl", contentClassName)}>
        {children}
      </div>
    </div>
  );
}
