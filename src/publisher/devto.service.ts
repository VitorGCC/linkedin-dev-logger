import dotenv from 'dotenv';

dotenv.config();

export interface DevToPublishResult {
  success: boolean;
  articleId?: number;
  articleUrl?: string;
  message: string;
}

export class DevToService {
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.DEVTO_API_KEY || null;
  }

  public isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.trim() !== '';
  }

  public async publishArticle(title: string, markdownContent: string, tags: string[] = ['webdev', 'typescript', 'showdev']): Promise<DevToPublishResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'DEVTO_API_KEY não foi configurada no arquivo .env.'
      };
    }

    try {
      const response = await fetch('https://dev.to/api/articles', {
        method: 'POST',
        headers: {
          'api-key': this.apiKey!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          article: {
            title,
            published: true,
            body_markdown: markdownContent,
            tags: tags.slice(0, 4)
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return {
          success: false,
          message: `Erro na API do Dev.to (${response.status}): ${errText}`
        };
      }

      const data: any = await response.json();
      return {
        success: true,
        articleId: data.id,
        articleUrl: data.url,
        message: `🎉 Artigo publicado com sucesso no Dev.to: ${data.url}`
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Falha na publicação no Dev.to: ${error.message}`
      };
    }
  }
}
