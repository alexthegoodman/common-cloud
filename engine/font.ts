export interface FontInfo {
  name: string;
  path: string;
  style: "Regular" | "Variable";
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
      },
      {
        name: "Aladin",
        path: "/fonts/aladin/Aladin-Regular.ttf",
        style: "Regular",
      },
      { name: "Aleo", path: "/fonts/aleo/Aleo[wght].ttf", style: "Variable" },
      {
        name: "Amiko",
        path: "/fonts/amiko/Amiko-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Ballet",
        path: "/fonts/ballet/Ballet[opsz].ttf",
        style: "Variable",
      },
      {
        name: "Basic",
        path: "/fonts/basic/Basic-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Bungee",
        path: "/fonts/bungee/Bungee-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Caramel",
        path: "/fonts/caramel/Caramel-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Cherish",
        path: "/fonts/cherish/Cherish-Regular.ttf",
        style: "Regular",
      },
      { name: "Coda", path: "/fonts/coda/Coda-Regular.ttf", style: "Regular" },
      {
        name: "David Libre",
        path: "/fonts/davidlibre/DavidLibre-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Dorsa",
        path: "/fonts/dorsa/Dorsa-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Duru Sans",
        path: "/fonts/durusans/DuruSans-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Dynalight",
        path: "/fonts/dynalight/Dynalight-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Eater",
        path: "/fonts/eater/Eater-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Epilogue",
        path: "/fonts/epilogue/Epilogue[wght].ttf",
        style: "Variable",
      },
      { name: "Exo", path: "/fonts/exo/Exo[wght].ttf", style: "Variable" },
      {
        name: "Explora",
        path: "/fonts/explora/Explora-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Federo",
        path: "/fonts/federo/Federo-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Figtree",
        path: "/fonts/figtree/Figtree[wght].ttf",
        style: "Variable",
      },
      {
        name: "Flavors",
        path: "/fonts/flavors/Flavors-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Galada",
        path: "/fonts/galada/Galada-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Gantari",
        path: "/fonts/gantari/Gantari[wght].ttf",
        style: "Variable",
      },
      { name: "Geo", path: "/fonts/geo/Geo-Regular.ttf", style: "Regular" },
      {
        name: "Glory",
        path: "/fonts/glory/Glory[wght].ttf",
        style: "Variable",
      },
      {
        name: "HappyMonkey",
        path: "/fonts/happymonkey/HappyMonkey-Regular.ttf",
        style: "Regular",
      },
      {
        name: "HennyPenny",
        path: "/fonts/hennypenny/HennyPenny-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Iceberg",
        path: "/fonts/iceberg/Iceberg-Regular.ttf",
        style: "Regular",
      }, // Fixed name from Amiko to Iceberg
      {
        name: "Inika",
        path: "/fonts/inika/Inika-Regular.ttf",
        style: "Regular",
      },
      {
        name: "InriaSans",
        path: "/fonts/inriasans/InriaSans-Regular.ttf",
        style: "Regular",
      },
      { name: "Jaro", path: "/fonts/jaro/Jaro[opsz].ttf", style: "Variable" },
      {
        name: "Kavoon",
        path: "/fonts/kavoon/Kavoon-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Khula",
        path: "/fonts/khula/Khula-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Kokoro",
        path: "/fonts/kokoro/Kokoro-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Lemon",
        path: "/fonts/lemon/Lemon-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Lexend",
        path: "/fonts/lexend/Lexend[wght].ttf",
        style: "Variable",
      },
      {
        name: "Macondo",
        path: "/fonts/macondo/Macondo-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Maitree",
        path: "/fonts/maitree/Maitree-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Martel",
        path: "/fonts/martel/Martel-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Maven Pro",
        path: "/fonts/mavenpro/MavenPro[wght].ttf",
        style: "Variable",
      },
      {
        name: "Neuton",
        path: "/fonts/neuton/Neuton-Regular.ttf",
        style: "Regular",
      },
      {
        name: "News Cycle",
        path: "/fonts/newscycle/NewsCycle-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Nixie One",
        path: "/fonts/nixieone/NixieOne-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Overlock",
        path: "/fonts/overlock/Overlock-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Oxygen",
        path: "/fonts/oxygen/Oxygen-Regular.ttf",
        style: "Regular",
      },
      { name: "Play", path: "/fonts/play/Play-Regular.ttf", style: "Regular" },
      {
        name: "Quicksand",
        path: "/fonts/quicksand/Quicksand[wght].ttf",
        style: "Variable",
      },
      {
        name: "Radley",
        path: "/fonts/radley/Radley-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Rethink Sans",
        path: "/fonts/rethinksans/RethinkSans[wght].ttf",
        style: "Variable",
      },
      {
        name: "Rosario",
        path: "/fonts/rosario/Rosario[wght].ttf",
        style: "Variable",
      },
      {
        name: "Sacramento",
        path: "/fonts/sacramento/Sacramento-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Salsa",
        path: "/fonts/salsa/Salsa-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Scope One",
        path: "/fonts/scopeone/ScopeOne-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Teachers",
        path: "/fonts/teachers/Teachers[wght].ttf",
        style: "Variable",
      },
      {
        name: "Underdog",
        path: "/fonts/underdog/Underdog-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Vibes",
        path: "/fonts/vibes/Vibes-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Vina Sans",
        path: "/fonts/vinasans/VinaSans-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Water Brush",
        path: "/fonts/waterbrush/WaterBrush-Regular.ttf",
        style: "Regular",
      },
      {
        name: "Wind Song",
        path: "/fonts/windsong/WindSong-Regular.ttf",
        style: "Regular",
      },
      { name: "Zain", path: "/fonts/zain/Zain-Regular.ttf", style: "Regular" },
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

    let f = new FontFace(fontInfo.name, `url(${fontInfo.path})`);

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

      const fontFace = await f.load(); // explicity load font before usage
      console.info("loaded font face", fontFace.family);
      document.fonts.add(fontFace);

      return fontData;
    } catch (error) {
      console.error(`Error loading font ${name}:`, error);
      return null;
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
