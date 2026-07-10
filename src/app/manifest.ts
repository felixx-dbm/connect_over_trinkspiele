import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Prost",
    short_name: "Prost",
    description: "Challenge strangers to beer games at festivals, parties and bars.",
    start_url: "/home",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAF8F3",
    theme_color: "#14110F",
    icons: [
      { src: "/Icon_192.png", sizes: "192x192", type: "image/png" },
      { src: "/Icon_512.png", sizes: "512x512", type: "image/png" },
      { src: "/Icon_512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
