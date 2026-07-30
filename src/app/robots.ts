import type { MetadataRoute } from "next";
import { CANONICAL_BASE } from "@/lib/brand";

export const dynamic = "force-static";

// Nothing is disallowed — there is nothing to hide (PRD §11.3).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${CANONICAL_BASE}/sitemap.xml`,
  };
}
