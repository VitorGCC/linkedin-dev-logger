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
   * Gerador Dinâmico Infinito com 5 ESTRUTURAS DE LAYOUT COMPLETAMENTE DIFERENTES
   * (Terminal Code, Centered Spotlight, Split Column, Cyberpunk HUD e Hero Banner).
   */
  public async generateCard(options: CardOptions): Promise<string> {
    const width = 1200;
    const height = 630;

    const palettes = [
      { bg1: '#090D16', bg2: '#13192B', bg3: '#06B6D4', accent: '#22D3EE', text: '#F8FAFC', border: '#0891B2', badgeBg: '#15233B' },
      { bg1: '#041512', bg2: '#0B2B24', bg3: '#10B981', accent: '#34D399', text: '#F0FDF4', border: '#10B981', badgeBg: '#0F382E' },
      { bg1: '#0B0714', bg2: '#1C1233', bg3: '#8B5CF6', accent: '#A855F7', text: '#FAF5FF', border: '#9333EA', badgeBg: '#2A1B4E' },
      { bg1: '#140A05', bg2: '#2B140A', bg3: '#F59E0B', accent: '#F97316', text: '#FFFBEB', border: '#D97706', badgeBg: '#3D1D0E' },
      { bg1: '#14061A', bg2: '#290B38', bg3: '#F43F5E', accent: '#FB7185', text: '#FFF1F2', border: '#E11D48', badgeBg: '#3B104E' }
    ];

    const theme = palettes[Math.floor(Math.random() * palettes.length)];
    const layoutStyle = Math.floor(Math.random() * 4); // 4 estilos visuais radicais de layout

    const cleanTitle = options.title.replace(/[#*`_]/g, '').trim();
    const titleLines = this.wrapText(cleanTitle, layoutStyle === 1 ? 28 : 34);

    let svg = '';

    // ================= LAYOUT 1: TERMINAL / IDE CODE EDITOR =================
    if (layoutStyle === 0) {
      const titleSvg = titleLines.map((line, i) => 
        `<text x="120" y="${230 + i * 55}" font-family="monospace" font-size="38" font-weight="bold" fill="${theme.text}">${this.escapeXml(line)}</text>`
      ).join('');

      const badgesSvg = options.techStack.slice(0, 5).map((tech, idx) => `
        <g transform="translate(${120 + idx * 185}, 460)">
          <rect width="165" height="42" rx="8" fill="${theme.badgeBg}" stroke="${theme.border}" stroke-width="1.5"/>
          <text x="82" y="27" font-family="monospace" font-size="16" font-weight="bold" fill="${theme.accent}" text-anchor="middle">${this.escapeXml(tech)}</text>
        </g>
      `).join('');

      svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${theme.bg1}" />
        
        <!-- Janela de Terminal -->
        <rect x="60" y="50" width="1080" height="530" rx="16" fill="${theme.bg2}" stroke="${theme.border}" stroke-width="2" />
        
        <!-- Botões do Terminal -->
        <circle cx="100" cy="85" r="7" fill="#EF4444" />
        <circle cx="125" cy="85" r="7" fill="#F59E0B" />
        <circle cx="150" cy="85" r="7" fill="#10B981" />
        <text x="600" y="90" font-family="monospace" font-size="15" fill="#64748B" text-anchor="middle">dev-journal-case-study.ts</text>
        <line x1="60" y1="115" x2="1140" y2="115" stroke="#334155" stroke-width="1" />

        <!-- Código / Conteúdo -->
        <text x="120" y="165" font-family="monospace" font-size="18" fill="${theme.accent}">const caseStudy = async () =&gt; {</text>
        ${titleSvg}
        <text x="120" y="${230 + titleLines.length * 55 + 10}" font-family="monospace" font-size="18" fill="${theme.accent}">};</text>

        ${badgesSvg}

        <text x="1100" y="545" font-family="monospace" font-size="14" fill="#64748B" text-anchor="end">vitor-dev-tools // linkedin-logger</text>
      </svg>`;
    }

    // ================= LAYOUT 2: CENTERED SPOTLIGHT CARD =================
    else if (layoutStyle === 1) {
      const titleSvg = titleLines.map((line, i) => 
        `<text x="600" y="${220 + i * 60}" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="${theme.text}" text-anchor="middle">${this.escapeXml(line)}</text>`
      ).join('');

      const totalBadgesWidth = Math.min(options.techStack.length, 5) * 170;
      const startX = 600 - totalBadgesWidth / 2;

      const badgesSvg = options.techStack.slice(0, 5).map((tech, idx) => `
        <g transform="translate(${startX + idx * 175}, 460)">
          <rect width="160" height="46" rx="23" fill="${theme.badgeBg}" stroke="${theme.accent}" stroke-width="2"/>
          <text x="80" y="29" font-family="Arial, sans-serif" font-size="17" font-weight="bold" fill="${theme.accent}" text-anchor="middle">${this.escapeXml(tech)}</text>
        </g>
      `).join('');

      svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${theme.bg1}" />
            <stop offset="100%" stop-color="${theme.bg2}" />
          </linearGradient>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#bgGrad2)" />
        <circle cx="600" cy="300" r="320" fill="${theme.bg3}" opacity="0.15" filter="blur(70px)" />

        <!-- Card Central com Vidro (Glassmorphism) -->
        <rect x="100" y="70" width="1000" height="490" rx="24" fill="${theme.bg2}" fill-opacity="0.8" stroke="${theme.border}" stroke-width="2" />

        <text x="600" y="135" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="${theme.accent}" text-anchor="middle" letter-spacing="3">⚡ ESTUDO DE CASO DE ENGENHARIA DE SOFTWARE ⚡</text>

        ${titleSvg}
        ${badgesSvg}

        <text x="600" y="535" font-family="Arial, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">DevToLinkedIn CLI • Vitor Dev Tools</text>
      </svg>`;
    }

    // ================= LAYOUT 3: CYBERPUNK HUD DASHBOARD =================
    else if (layoutStyle === 2) {
      const titleSvg = titleLines.map((line, i) => 
        `<text x="100" y="${220 + i * 56}" font-family="Arial, sans-serif" font-size="42" font-weight="900" fill="${theme.text}">${this.escapeXml(line)}</text>`
      ).join('');

      const badgesSvg = options.techStack.slice(0, 5).map((tech, idx) => `
        <g transform="translate(${100 + idx * 190}, 470)">
          <polygon points="0,0 170,0 160,44 0,44" fill="${theme.badgeBg}" stroke="${theme.accent}" stroke-width="2"/>
          <text x="80" y="28" font-family="monospace" font-size="17" font-weight="bold" fill="${theme.accent}" text-anchor="middle">${this.escapeXml(tech)}</text>
        </g>
      `).join('');

      svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${theme.bg1}" />

        <!-- Moldura HUD Cantoneiras Cyberpunk -->
        <path d="M 50 100 L 50 50 L 100 50" stroke="${theme.accent}" stroke-width="4" fill="none" />
        <path d="M 1150 100 L 1150 50 L 1100 50" stroke="${theme.accent}" stroke-width="4" fill="none" />
        <path d="M 50 530 L 50 580 L 100 580" stroke="${theme.accent}" stroke-width="4" fill="none" />
        <path d="M 1150 530 L 1150 580 L 1100 580" stroke="${theme.accent}" stroke-width="4" fill="none" />

        <rect x="100" y="80" width="260" height="32" fill="${theme.badgeBg}" stroke="${theme.border}" stroke-width="1.5" />
        <text x="230" y="102" font-family="monospace" font-size="14" font-weight="bold" fill="${theme.accent}" text-anchor="middle">[ SYSTEM ARCHITECTURE ]</text>

        ${titleSvg}
        ${badgesSvg}

        <line x1="100" y1="545" x2="1100" y2="545" stroke="${theme.border}" stroke-width="1" stroke-dasharray="10 5" />
        <text x="100" y="570" font-family="monospace" font-size="14" fill="#64748B">STATUS: DEPLOYED // READY</text>
        <text x="1100" y="570" font-family="monospace" font-size="14" fill="${theme.accent}" text-anchor="end">linkedin-logger 🚀</text>
      </svg>`;
    }

    // ================= LAYOUT 4: SPLIT 2-COLUMN HERO BANNER =================
    else {
      const titleSvg = titleLines.map((line, i) => 
        `<text x="140" y="${210 + i * 58}" font-family="Arial, sans-serif" font-size="44" font-weight="bold" fill="${theme.text}">${this.escapeXml(line)}</text>`
      ).join('');

      const badgesSvg = options.techStack.slice(0, 5).map((tech, idx) => `
        <g transform="translate(140, ${410 + idx * 36})">
          <rect width="180" height="30" rx="6" fill="${theme.badgeBg}" stroke="${theme.border}" stroke-width="1.5"/>
          <text x="90" y="20" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="${theme.accent}" text-anchor="middle">${this.escapeXml(tech)}</text>
        </g>
      `).join('');

      svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="${theme.bg1}" />

        <!-- Barra Lateral Iluminada -->
        <rect x="60" y="60" width="12" height="510" rx="6" fill="${theme.accent}" />

        <text x="140" y="100" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${theme.accent}" letter-spacing="2">ENGINEERING JOURNAL</text>

        ${titleSvg}

        <text x="140" y="${210 + titleLines.length * 58 + 20}" font-family="Arial, sans-serif" font-size="20" fill="#94A3B8">
          ${this.escapeXml(options.subtitle || 'Evolução Técnica de Arquitetura & Código')}
        </text>

        ${badgesSvg}

        <text x="1100" y="560" font-family="Arial, sans-serif" font-size="15" fill="#64748B" text-anchor="end">DevToLinkedIn CLI • Vitor Dev Tools</text>
      </svg>`;
    }

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
