import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/api/", "/dashboard/", "/admin/", "/sign-in", "/sign-up"] },
    ],
    sitemap: "https://chatbot.circucity.com/sitemap.xml",
  };
}
