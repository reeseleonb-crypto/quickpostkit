import { Suspense } from "react";
import ClientShell from "./ClientShell";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ClientShell />
    </Suspense>
  );
}
