import fs from 'fs';
import path from 'path';
import { GitContext } from '../collectors/git.collector';

export interface PrivacyConfig {
  forbiddenWords: string[];
  maskEmails: boolean;
  maskDomains: boolean;
  maskSecrets: boolean;
}

export class SanitizerService {
  private config: PrivacyConfig;

  constructor(configPath?: string) {
    const defaultPath = configPath || path.join(process.cwd(), 'config.json');
    if (fs.existsSync(defaultPath)) {
      const fileData = JSON.parse(fs.readFileSync(defaultPath, 'utf-8'));
      this.config = fileData.privacy || {
        forbiddenWords: [],
        maskEmails: true,
        maskDomains: true,
        maskSecrets: true
      };
    } else {
      this.config = {
        forbiddenWords: ['EmpresaExemplo1', 'EmpresaExemplo2'],
        maskEmails: true,
        maskDomains: true,
        maskSecrets: true
      };
    }
  }

  public sanitizeContext(context: GitContext, customNotes?: string): { sanitizedContext: GitContext; sanitizedNotes: string; redactedTermsCount: number } {
    let redactedCount = 0;

    const sanitizeString = (str: string): string => {
      if (!str) return '';
      let result = str;

      // 1. Remove forbidden company / brand / client names using natural replacement
      for (const word of this.config.forbiddenWords) {
        if (!word || word.trim() === '') continue;
        const regex = new RegExp(word, 'gi');
        const matches = result.match(regex);
        if (matches) {
          redactedCount += matches.length;
          result = result.replace(regex, 'projeto');
        }
      }

      // 2. Mask Emails
      if (this.config.maskEmails) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        result = result.replace(emailRegex, () => {
          redactedCount++;
          return '[email-protegido]';
        });
      }

      // 3. Mask Domains / URLs (keep generic ones like github/npm, scrub internal ones)
      if (this.config.maskDomains) {
        const urlRegex = /(https?:\/\/[^\s"'<>\\]+)/g;
        result = result.replace(urlRegex, (url) => {
          if (url.includes('github.com') || url.includes('npmjs.com') || url.includes('stackoverflow.com')) {
            return url;
          }
          redactedCount++;
          return '[url-interna]';
        });
      }

      // 4. Mask Secrets / Tokens / Keys
      if (this.config.maskSecrets) {
        result = result.replace(/bearer\s+[a-zA-Z0-9._\-]+/gi, 'Bearer [token-oculto]');
        result = result.replace(/(api_key|secret|password|passwd|pwd|token)\s*[:=]\s*["']?[^\s"']+/gi, '$1=[credencial-ocultada]');
      }

      return result;
    };

    let sanitizedRepoName = sanitizeString(context.repoName);
    if (sanitizedRepoName.toLowerCase() === 'projeto' || sanitizedRepoName.includes('[') || sanitizedRepoName.includes(']')) {
      sanitizedRepoName = 'sistema-backend';
    }

    const sanitizedCommits = context.commits.map(sanitizeString);
    const sanitizedChangedFiles = context.changedFiles.map(sanitizeString);
    const sanitizedDiffStat = sanitizeString(context.diffStat);
    const sanitizedRecentDiffs = sanitizeString(context.recentDiffs);
    const sanitizedNotes = customNotes ? sanitizeString(customNotes) : '';

    return {
      sanitizedContext: {
        repoName: sanitizedRepoName,
        branchName: context.branchName,
        commits: sanitizedCommits,
        changedFiles: sanitizedChangedFiles,
        diffStat: sanitizedDiffStat,
        recentDiffs: sanitizedRecentDiffs
      },
      sanitizedNotes,
      redactedTermsCount: redactedCount
    };
  }
}
