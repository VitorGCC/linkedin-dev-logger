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
   * Gerador Dinâmico e Infinito de Cards em PNG (1200x630px).
   * Sortear temas de cores, elementos geométricos e estética sci-fi/dark mode única a cada geração.
   */
  public async generateCard(options: CardOptions): Promise<string> {
    const width = 1200;
    const height = 630;

    // Paletas de cores harmônicas e dinâmicas
    const palettes = [
      // Theme 1: Cyberpunk Cyan & Violet
      {
        bg1: '#090D16', bg2: '#13192B', bg3: '#06B6D4',
        accent: '#22D3EE', accentGlow: '#8B5CF6', text: '#F8FAFC',
        border: '#0891B2', badgeBg: '#15233B',
        badgeText: '⚡ DEV JOURNAL // CASE STUDY'
      },
      // Theme 2: Emerald Dev & Mint Glow
      {
        bg1: '#041512', bg2: '#0B2B24', bg3: '#10B981',
        accent: '#34D399', accentGlow: '#059669', text: '#F0FDF4',
        border: '#10B981', badgeBg: '#0F382E',
        badgeText: '🚀 ARCHITECTURE INSIGHTS'
      },
      // Theme 3: Deep Space & Ultraviolet
      {
        bg1: '#0B0714', bg2: '#1C1233', bg3: '#8B5CF6',
        accent: '#A855F7', accentGlow: '#EC4899', text: '#FAF5FF',
        border: '#9333EA', badgeBg: '#2A1B4E',
        badgeText: '🛠️ ENGINEERING SPOTLIGHT'
      },
      // Theme 4: Sunset Amber & Warm Rust
      {
        bg1: '#140A05', bg2: '#2B140A', bg3: '#F59E0B',
        accent: '#F97316', accentGlow: '#EF4444', text: '#FFFBEB',
        border: '#D97706', badgeBg: '#3D1D0E',
        badgeText: '💡 TECH DEEP DIVE'
      },
      // Theme 5: Synthwave Neon & Hot Pink
      {
        bg1: '#14061A', bg2: '#290B38', bg3: '#F43F5E',
        accent: '#FB7185', accentGlow: '#38BDF8', text: '#FFF1F2',
        border: '#E11D48', badgeBg: '#3B104E',
        badgeText: '💻 DEVELOPER LOG'
      }
    ];

    // Sorteia um tema visual diferente a cada geração
    const theme = palettes[Math.floor(Math.random() * palettes.length)];

    // Tratar título para quebrar linhas adequadamente
    const cleanTitle = options.title.replace(/[#*`_]/g, '').trim();
    const titleLines = this.wrapText(cleanTitle, 32);

    // Gerar elementos decorativos aleatórios (círculos brilhantes, terminal dots ou circuitos)
    const randomPatternIndex = Math.floor(Math.random() * 3);
    let patternSvg = '';

    if (randomPatternIndex === 0) {
      // Círculos brilhantes de luz ambiente (Orbs)
      patternSvg = `
        <circle cx="1000" cy="150" r="280" fill="${theme.accentGlow}" opacity="0.18" filter="blur(60px)" />
        <circle cx="150" cy="500" r="220" fill="${theme.bg3}" opacity="0.15" filter="blur(50px)" />
      `;
    } else if (randomPatternIndex === 1) {
      // Terminal Buttons & Code Brackets
      patternSvg = `
        <circle cx="80" cy="40" r="6" fill="#EF4444" opacity="0.8" />
        <circle cx="100" cy="40" r="6" fill="#F59E0B" opacity="0.8" />
        <circle cx="120" cy="40" r="6" fill="#10B981" opacity="0.8" />
        <text x="1050" y="100" font-family="monospace" font-size="70" font-weight="bold" fill="${theme.accent}" opacity="0.12">&lt;/&gt;</text>
      `;
    } else {
      // Grid Tech Futurista
      patternSvg = `
        <line x1="80" y1="130" x2="1120" y2="130" stroke="${theme.border}" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.4" />
        <line x1="80" y1="540" x2="1120" y2="540" stroke="${theme.border}" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.4" />
        <rect x="1050" y="220" width="8" height="120" fill="${theme.accent}" opacity="0.3" rx="4" />
      `;
    }

    // Gerar badges de tecnologia com cores do tema
    const badgesSvg = options.techStack.slice(0, 5).map((tech, index) => {
      const x = 80 + index * 195;
      return `
        <g transform="translate(${x}, 470)">
          <rect width="175" height="48" rx="24" fill="${theme.badgeBg}" stroke="${theme.border}" stroke-width="1.8"/>
          <text x="87" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${theme.accent}" text-anchor="middle">${this.escapeXml(tech)}</text>
        </g>
      `;
    }).join('');

    // Renderizar linhas do título
    const titleSvg = titleLines.map((line, i) => {
      const y = 230 + i * 58;
      return `<text x="80" y="${y}" font-family="Arial, sans-serif" font-size="46" font-weight="bold" fill="${theme.text}">${this.escapeXml(line)}</text>`;
    }).join('');

    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${theme.bg1}" />
          <stop offset="60%" stop-color="${theme.bg2}" />
          <stop offset="100%" stop-color="${theme.bg3}" />
        </linearGradient>

        <linearGradient id="badgeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${theme.accent}" />
          <stop offset="100%" stop-color="${theme.accentGlow}" />
        </linearGradient>
      </defs>

      <!-- Fundo -->
      <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

      <!-- Padrão Decorativo Único -->
      ${patternSvg}

      <!-- Header Badge -->
      <rect x="80" y="70" width="310" height="38" rx="19" fill="${theme.badgeBg}" stroke="url(#badgeGlow)" stroke-width="2" />
      <text x="235" y="94" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${theme.accent}" text-anchor="middle">${theme.badgeText}</text>

      <!-- Título Principal -->
      ${titleSvg}

      <!-- Subtítulo -->
      <text x="80" y="${230 + titleLines.length * 58 + 15}" font-family="Arial, sans-serif" font-size="22" fill="#94A3B8">
        ${this.escapeXml(options.subtitle || 'Arquitetura de Software & Boas Práticas')}
      </text>

      <!-- Badges de Tecnologia -->
      ${badgesSvg}

      <!-- Footer / Marca d'água -->
      <text x="80" y="585" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#64748B">
        DevToLinkedIn CLI • Vitor Dev Tools
      </text>
      <text x="1120" y="585" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${theme.accent}" text-anchor="end">
        linkedin-logger 🚀
      </text>
    </svg>
    `;

    const dir = path.dirname(options.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

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
      if (lines.length >= 3) break;
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
