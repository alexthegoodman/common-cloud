export interface FontInfo {
  name: string;
  path: string;
  style: "Regular" | "Variable";
  support: string[];
}

export class FontManager {
  fontData: FontInfo[];
  loadedFonts: Map<string, Buffer> = new Map();

  constructor() {
    // List of available fonts with their paths
    this.fontData = [
      {
        name: "Actor",
        path: "/fonts/actor/Actor-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Aladin",
        path: "/fonts/aladin/Aladin-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Aleo",
        path: "/fonts/aleo/Aleo[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Amiko",
        path: "/fonts/amiko/Amiko-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Ballet",
        path: "/fonts/ballet/Ballet[opsz].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Basic",
        path: "/fonts/basic/Basic-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Bungee",
        path: "/fonts/bungee/Bungee-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Caramel",
        path: "/fonts/caramel/Caramel-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Cherish",
        path: "/fonts/cherish/Cherish-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Coda",
        path: "/fonts/coda/Coda-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "David Libre",
        path: "/fonts/davidlibre/DavidLibre-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Dorsa",
        path: "/fonts/dorsa/Dorsa-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Duru Sans",
        path: "/fonts/durusans/DuruSans-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Dynalight",
        path: "/fonts/dynalight/Dynalight-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Eater",
        path: "/fonts/eater/Eater-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Epilogue",
        path: "/fonts/epilogue/Epilogue[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Exo",
        path: "/fonts/exo/Exo[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Explora",
        path: "/fonts/explora/Explora-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Federo",
        path: "/fonts/federo/Federo-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Figtree",
        path: "/fonts/figtree/Figtree[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Flavors",
        path: "/fonts/flavors/Flavors-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Galada",
        path: "/fonts/galada/Galada-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },

      {
        name: "Gantari",
        path: "/fonts/gantari/Gantari[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Geo",
        path: "/fonts/geo/Geo-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Glory",
        path: "/fonts/glory/Glory[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "HappyMonkey",
        path: "/fonts/happymonkey/HappyMonkey-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "HennyPenny",
        path: "/fonts/hennypenny/HennyPenny-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Iceberg",
        path: "/fonts/iceberg/Iceberg-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      }, // Fixed name from Amiko to Iceberg
      {
        name: "Inika",
        path: "/fonts/inika/Inika-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "InriaSans",
        path: "/fonts/inriasans/InriaSans-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Jaro",
        path: "/fonts/jaro/Jaro[opsz].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Kavoon",
        path: "/fonts/kavoon/Kavoon-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Khula",
        path: "/fonts/khula/Khula-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Kokoro",
        path: "/fonts/kokoro/Kokoro-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Lemon",
        path: "/fonts/lemon/Lemon-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Lexend",
        path: "/fonts/lexend/Lexend[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Macondo",
        path: "/fonts/macondo/Macondo-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Maitree",
        path: "/fonts/maitree/Maitree-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Martel",
        path: "/fonts/martel/Martel-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Maven Pro",
        path: "/fonts/mavenpro/MavenPro[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Neuton",
        path: "/fonts/neuton/Neuton-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "News Cycle",
        path: "/fonts/newscycle/NewsCycle-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Nixie One",
        path: "/fonts/nixieone/NixieOne-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Overlock",
        path: "/fonts/overlock/Overlock-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Oxygen",
        path: "/fonts/oxygen/Oxygen-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Play",
        path: "/fonts/play/Play-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Quicksand",
        path: "/fonts/quicksand/Quicksand[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Radley",
        path: "/fonts/radley/Radley-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Rethink Sans",
        path: "/fonts/rethinksans/RethinkSans[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Rosario",
        path: "/fonts/rosario/Rosario[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Sacramento",
        path: "/fonts/sacramento/Sacramento-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Salsa",
        path: "/fonts/salsa/Salsa-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Scope One",
        path: "/fonts/scopeone/ScopeOne-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Teachers",
        path: "/fonts/teachers/Teachers[wght].ttf",
        style: "Variable",
        support: ["latin"],
      },
      {
        name: "Underdog",
        path: "/fonts/underdog/Underdog-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Vibes",
        path: "/fonts/vibes/Vibes-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Vina Sans",
        path: "/fonts/vinasans/VinaSans-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Water Brush",
        path: "/fonts/waterbrush/WaterBrush-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Wind Song",
        path: "/fonts/windsong/WindSong-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Zain",
        path: "/fonts/zain/Zain-Regular.ttf",
        style: "Regular",
        support: ["latin"],
      },
      {
        name: "Amiko",
        path: "/fonts/hindi/amiko/Amiko-Regular.ttf",
        style: "Regular",
        support: ["devanagari"],
      },
      {
        name: "Baloo2",
        path: "/fonts/hindi/baloo2/Baloo2[wght].ttf",
        style: "Regular",
        support: ["devanagari"],
      },
      {
        name: "Cambay",
        path: "/fonts/hindi/cambay/Cambay-Regular.ttf",
        style: "Regular",
        support: ["devanagari"],
      },
      {
        name: "IBM Plex Mono",
        path: "/fonts/hindi/ibmplexmono/IBMPlexMono-Regular.ttf",
        style: "Regular",
        support: ["devanagari"],
      },
      {
        name: "Karma",
        path: "/fonts/hindi/karma/Karma-Regular.ttf",
        style: "Regular",
        support: ["devanagari"],
      },
      {
        name: "Noto Sans Devanagari",
        path: "/fonts/hindi/notosansdevanagari/NotoSansDevanagari[wdth,wght].ttf",
        style: "Regular",
        support: ["devanagari"],
      },
    ];
  }

  // Get all font info
  getAllFonts(): FontInfo[] {
    return this.fontData;
  }

  // Find font info by name
  getFontInfo(name: string): FontInfo | undefined {
    return this.fontData.find(
      (font) => font.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Asynchronously load a font by name
  async loadFontByName(name: string): Promise<Buffer | null> {
    const normalizedName = name.toLowerCase();

    // Check if already loaded
    if (this.loadedFonts.has(normalizedName)) {
      return this.loadedFonts.get(normalizedName)!;
    }

    // Find font info
    const fontInfo = this.getFontInfo(name);
    if (!fontInfo) {
      console.error(`Font not found: ${name}`);
      return null;
    }

    if (process.env.NODE_ENV !== "test") {
      let fontFaceData = new FontFace(fontInfo.name, `url(${fontInfo.path})`);

      try {
        // Fetch the font file
        const response = await fetch(fontInfo.path);
        if (!response.ok) {
          throw new Error(`Failed to load font: ${response.statusText}`);
        }

        // Get the binary data
        const fontDataArray = await response.arrayBuffer();
        const fontData = Buffer.from(fontDataArray);

        // Cache the loaded font
        this.loadedFonts.set(normalizedName, fontData);

        const fontFace = await fontFaceData.load(); // explicity load font before usage
        console.info("loaded font face", fontFace.family);
        document.fonts.add(fontFace);

        return fontData;
      } catch (error) {
        console.error(`Error loading font ${name}:`, error);
        return null;
      }
    } else {
      return Buffer.from([]);
    }
  }

  // Generate CSS for preloading all fonts
  generateFontFaceCSS(): string {
    return this.fontData
      .map((font) => {
        const fontFamily = JSON.stringify(font.name);
        const fontStyle = font.style === "Variable" ? "normal" : "normal";
        const fontWeight = font.style === "Variable" ? "100 900" : "normal";

        return `
  @font-face {
    font-family: ${fontFamily};
    src: url('${font.path}') format('truetype');
    font-style: ${fontStyle};
    font-weight: ${fontWeight};
    font-display: swap;
  }`;
      })
      .join("\n");
  }
}

// Example of how to use with CSS generation
export function setupFonts() {
  const fontManager = new FontManager();

  // Generate and inject CSS for all fonts
  const css = fontManager.generateFontFaceCSS();
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  return fontManager;
}
