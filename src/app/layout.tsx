export const dynamic = "force-dynamic";
export const revalidate = 0;

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* your global header/nav */}
        {children} {/* <-- this line is crucial */}
      </body>
    </html>
  );
}
