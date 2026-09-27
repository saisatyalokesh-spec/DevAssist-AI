/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export: `next build` produces plain HTML/JS/CSS in `out/` instead
  // of needing a Node server. FastAPI serves that folder directly (see
  // app/backend/main.py), so the whole app runs as one process on one port
  // — the shape Render (and most single-service hosts) expect.
  output: "export",
  // Every route gets its own `index.html` inside a folder named after the
  // route (e.g. `out/troubleshoot/index.html`), which is what a plain static
  // file server / FastAPI's StaticFiles expects for clean, non-hashed URLs.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
