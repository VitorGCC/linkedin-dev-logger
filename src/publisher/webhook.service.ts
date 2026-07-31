import dotenv from 'dotenv';

dotenv.config();

export class WebhookService {
  private webhookUrl: string | null = null;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL || null;
  }

  public isConfigured(): boolean {
    return !!this.webhookUrl && this.webhookUrl.trim() !== '';
  }

  public async notifyTeam(postTitle: string, postUrl?: string): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const payload = {
        content: `🚀 **Novo Post de Engenharia Publicado!**\n\n📌 **${postTitle}**\n${postUrl ? `🔗 Confira no LinkedIn: ${postUrl}` : ''}`
      };

      const res = await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      return res.ok;
    } catch {
      return false;
    }
  }
}
