export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* your header/nav can live here if you want */}
        {children} {/* ← REQUIRED */}
      </body>
    </html>
  );
}
