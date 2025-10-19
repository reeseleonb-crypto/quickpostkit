export const dynamic = "force-dynamic";

import { Suspense } from "react";
import ClientReady from "./ClientReady";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ClientReady />
    </Suspense>
  );
}
