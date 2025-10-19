// src/app/generate/layout.tsx
import React from "react";

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Must render children or the page will be blank
  return <main className="min-h-screen">{children}</main>;
}
