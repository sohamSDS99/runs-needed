import type { MetadataRoute } from "next";
import { CANONICAL_BASE } from "@/lib/brand";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${CANONICAL_BASE}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${CANONICAL_BASE}/method`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
