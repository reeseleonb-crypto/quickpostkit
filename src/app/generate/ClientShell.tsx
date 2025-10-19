"use client";

import { Suspense } from "react";
import GenerateForm from "./GenerateForm";

export default function ClientShell() {
  // Render your full form/UI
  return (
    <Suspense fallback={null}>
      <GenerateForm />
    </Suspense>
  );
}
