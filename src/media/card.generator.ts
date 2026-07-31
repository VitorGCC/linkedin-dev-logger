import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export interface CardOptions {
  title: string;
  subtitle?: string;
  techStack: string[];
  outputPath: string;
}

export class CardGenerator {
  /**
   * Gerador de Banners em PNG (1200x630px) para posts do LinkedIn.
   * Cria um design premium em dark mode com gradiente, badges e tipografia moderna.
   */
  public async generateCard(options: CardOptions): Promise<string> {
    const width = 1200;
    const height = 630;

    // Tratar título para quebrar linhas adequadamente se for longo
    const cleanTitle = options.title.replace(/[#*`_]/g, '').trim();
    const titleLines = this.wrapText(cleanTitle, 32);

    // Gerar badges visuais para as tecnologias
    const badgesSvg = options.techStack.slice(0, 5).map((tech, index) => {
      const x = 80 + index * 190;
      return `
        <g transform="translate(${x}, 480)">
          <rect width="170" height="46" rx="23" fill="#1E293B" stroke="#38BDF8" stroke-width="1.5"/>
          <text x="85" y="28" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#38BDF8" text-anchor="middle">${this.escapeXml(tech)}</text>
        </g>
      `;
    }).join('');

    // Renderizar linhas do título
    const titleSvg = titleLines.map((line, i) => {
      const y = 240 + i * 55;
      return `<text x="80" y="${y}" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="#F8FAFC">${this.escapeXml(line)}</text>`;
    }).join('');

    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Gradiente de Fundo Premium Dark -->
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0F172A" />
          <stop offset="50%" stop-color="#1E1B4B" />
          <stop offset="100%" stop-color="#0284C7" />
        </linearGradient>

        <!-- Gradiente do Header Glow -->
        <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="100%" stop-color="#818CF8" />
        </linearGradient>
      </defs>

      <!-- Fundo -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

      <!-- Linhas Decorativas de Grid Tech -->
      <line x1="80" y1="120" x2="1120" y2="120" stroke="#334155" stroke-width="1" stroke-dasharray="8 8" />
      <line x1="80" y1="550" x2="1120" y2="550" stroke="#334155" stroke-width="1" stroke-dasharray="8 8" />

      <!-- Header Badge -->
      <rect x="80" y="70" width="280" height="34" rx="17" fill="#1E293B" stroke="url(#glowGrad)" stroke-width="2" />
      <text x="220" y="92" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#38BDF8" text-anchor="middle">⚡ DEV JOURNAL // CASE STUDY</text>

      <!-- Título Principal -->
      ${titleSvg}

      <!-- Subtítulo / Descrição se houver -->
      <text x="80" y="${240 + titleLines.length * 55 + 20}" font-family="Arial, sans-serif" font-size="22" fill="#94A3B8">
        ${this.escapeXml(options.subtitle || 'Arquitetura de Software & Boas Práticas')}
      </text>

      <!-- Badges de Tecnologia -->
      ${badgesSvg}

      <!-- Footer / Marca d'água -->
      <text x="80" y="585" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#64748B">
        DevToLinkedIn CLI • Vitor Dev Tools
      </text>
      <text x="1120" y="585" font-family="Arial, sans-serif" font-size="16" fill="#38BDF8" text-anchor="end">
        linkedin-logger 🚀
      </text>
    </svg>
    `;

    // Garante que o diretório de destino existe
    const dir = path.dirname(options.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Renderiza SVG para PNG usando Sharp
    await sharp(Buffer.from(svg))
      .png({ quality: 100 })
      .toFile(options.outputPath);

    return options.outputPath;
  }

  private wrapText(text: string, maxCharsPerLine: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
      if (lines.length >= 3) break; // Máximo de 3 linhas no título do card
    }
    if (currentLine && lines.length < 3) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
  }

  private escapeXml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
