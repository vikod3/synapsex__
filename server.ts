import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

// Memory cache for direct Higgsfield video URL
let cachedVideoUrl: string | null = null;
let lastSuccessUrl: string | null = null; // High resilience fallback
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache to avoid rate-limiting but handle token expiry

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Endpoint to fetch Higgsfield page and resolve the direct video url
  app.get("/api/video-src", async (req, res) => {
    const forceRefresh = req.query.refresh === "true";
    const now = Date.now();

    // If we have a valid cache, return it immediately (super fast response, no scraping)
    if (cachedVideoUrl && !forceRefresh && (now - cacheTimestamp < CACHE_DURATION)) {
      console.log(`[API] Serving Higgsfield video URL from cache (expires in ${Math.round((CACHE_DURATION - (now - cacheTimestamp)) / 1000)}s)`);
      return res.json({ url: cachedVideoUrl, fromCache: true });
    }

    try {
      const shareUrl = "https://higgsfield.ai/s/m2bff4xsS6I";
      console.log(`[API] Scraping Higgsfield video URL: ${shareUrl}`);

      const response = await fetch(shareUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        },
        // Avoid hanging forever on timeout
        signal: AbortSignal.timeout(8000)
      } as any);

      if (!response.ok) {
        throw new Error(`Failed to load share page. Status: ${response.status}`);
      }

      const html = await response.text();
      console.log(`[API] Share page HTML loaded. Length: ${html.length} bytes`);

      let directUrl: string | null = null;

      // 1. og:video properties (very standard metadata)
      const ogVideoMeta = html.match(/<meta[^>]*property=["']og:video(?::secure_url)?["'][^>]*content=["'](.*?)["']/i) ||
                          html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:video(?::secure_url)?["']/i);
      if (ogVideoMeta && ogVideoMeta[1]) {
        directUrl = ogVideoMeta[1].replace(/&amp;/g, "&");
      }

      // 2. Look for explicit video source tag or video src attribute in the HTML string
      if (!directUrl) {
        const sourceTag = html.match(/<source[^>]*src=["'](.*?)["']/i) || html.match(/<video[^>]*src=["'](.*?)["']/i);
        if (sourceTag && sourceTag[1]) {
          directUrl = sourceTag[1].replace(/&amp;/g, "&");
        }
      }

      // 3. Search for quoted mp4 links (often found in inline script variables)
      if (!directUrl) {
        const quoteMatches = html.match(/"([^"]+?\.mp4(?:\?[^"]+?)?)"/i) || html.match(/'([^']+?\.mp4(?:\?[^']+?)?)'/i);
        if (quoteMatches && quoteMatches[1]) {
          directUrl = quoteMatches[1].replace(/\\u0026/g, "&").replace(/&amp;/g, "&");
        }
      }

      // 4. Fallback search for any string pattern resembling an https mp4 url
      if (!directUrl) {
        const rawMp4 = html.match(/(https:\/\/[^\s"'`<>\\\{\}\[\]]+?\.mp4[^\s"'`<>\\\{\}\[\]]*)/i);
        if (rawMp4 && rawMp4[1]) {
          directUrl = rawMp4[1].replace(/\\u0026/g, "&").replace(/&amp;/g, "&");
        }
      }

      if (directUrl) {
        console.log(`[API] Success! Extracted direct video URL: ${directUrl}`);
        cachedVideoUrl = directUrl;
        lastSuccessUrl = directUrl;
        cacheTimestamp = now;
        return res.json({ url: directUrl, cached: false });
      }

      if (lastSuccessUrl) {
        console.warn("[API] Extraction failed, returning last successful URL as fallback.");
        return res.json({ url: lastSuccessUrl, isFallback: true });
      }

      // Fallback: If nothing works, return original shareUrl directly
      console.warn("[API] Could not extract direct video url patterns. Returning original shareUrl as fallback.");
      return res.json({ url: shareUrl, isFallback: true });
    } catch (error: any) {
      console.error("[API] Error fetching or parsing Higgsfield share page:", error);
      
      // If we have a previously successful direct URL, reuse it instead of throwing error!
      if (lastSuccessUrl) {
        console.log("[API] Critical error: returning last successful URL from memory cache to avoid page crash.");
        return res.json({ url: lastSuccessUrl, isFallback: true, error: error.message });
      }

      // Ultimate high-quality static fallback if everything else fails and we have no cached success url
      const staticFallback = "https://assets.mixkit.co/videos/preview/mixkit-futuristic-digital-neural-network-interface-41712-large.mp4";
      console.log(`[API] Returning high-quality neural background fallback: ${staticFallback}`);
      return res.json({ url: staticFallback, isStaticFallback: true, error: error.message });
    }
  });

  // Serve static assets based on environment (Vite dev server in dev mode vs static express build)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

startServer();
