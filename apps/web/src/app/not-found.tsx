// Fallback for requests outside any locale (middleware normally redirects them).
export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ background: '#0A0A0A', color: '#EDEAE3', fontFamily: 'system-ui', display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <a href="/" style={{ color: '#FF5A1F' }}>404 — Back to Velkin</a>
      </body>
    </html>
  );
}
