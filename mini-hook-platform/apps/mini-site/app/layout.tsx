export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "24px", background: "#0b0e14", color: "#e6e6e6" }}>
        <header style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, marginBottom: 4 }}>mini-hook-platform</h1>
          <nav style={{ display: "flex", gap: 16, fontSize: 14 }}>
            <a href="/" style={{ color: "#8ab4f8" }}>Pools</a>
            <a href="/positions" style={{ color: "#8ab4f8" }}>My Positions</a>
            <a href="/curation" style={{ color: "#8ab4f8" }}>Curation</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
