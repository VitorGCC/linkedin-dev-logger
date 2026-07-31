import dotenv from 'dotenv';

dotenv.config();

export interface LinkedInPublishResult {
  success: boolean;
  postId?: string;
  postUrl?: string;
  message: string;
}

export class LinkedInPublisherService {
  private accessToken: string | null = null;
  private personUrn: string | null = null;

  constructor(accessToken?: string, personUrn?: string) {
    this.accessToken = accessToken || process.env.LINKEDIN_ACCESS_TOKEN || null;
    let rawUrn = personUrn || process.env.LINKEDIN_PERSON_URN || null;
    if (rawUrn) {
      rawUrn = rawUrn.trim();
      if (rawUrn.includes('/in/')) {
        rawUrn = rawUrn.split('/in/')[1].replace(/\//g, '').split('?')[0];
      }
      this.personUrn = rawUrn;
    }
  }

  public isConfigured(): boolean {
    return !!this.accessToken && this.accessToken.trim() !== '';
  }

  public async getPersonUrn(): Promise<string> {
    if (this.personUrn) {
      if (this.personUrn.startsWith('urn:li:')) {
        return this.personUrn;
      }
      const clean = this.personUrn.replace('urn:li:person:', '').replace('urn:li:member:', '');
      return `urn:li:person:${clean}`;
    }

    if (!this.accessToken) {
      throw new Error('Access Token do LinkedIn não foi configurado.');
    }

    // 1. Tentar via /v2/userinfo
    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      if (response.ok) {
        const data: any = await response.json();
        if (data.sub) {
          this.personUrn = `urn:li:person:${data.sub}`;
          return this.personUrn;
        }
      }
    } catch {}

    // 2. Tentar via /v2/me
    try {
      const response = await fetch('https://api.linkedin.com/v2/me', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      if (response.ok) {
        const data: any = await response.json();
        if (data.id) {
          this.personUrn = `urn:li:person:${data.id}`;
          return this.personUrn;
        }
      }
    } catch {}

    throw new Error(
      'O LinkedIn precisa do seu número de ID de membro no arquivo .env (LINKEDIN_PERSON_URN=iwVxPnsT51).'
    );
  }

  public async publishPost(postText: string): Promise<LinkedInPublishResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Access Token do LinkedIn não configurado no arquivo .env (LINKEDIN_ACCESS_TOKEN).'
      };
    }

    try {
      const authorUrn = await this.getPersonUrn();

      const payload = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postText
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Erro na API do LinkedIn (${response.status}): ${errorText}`
        };
      }

      const data: any = await response.json();
      const postId = data.id || 'sucesso';

      return {
        success: true,
        postId,
        postUrl: 'https://www.linkedin.com/feed/',
        message: '🎉 Post publicado no seu LinkedIn com sucesso!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Falha na publicação: ${error.message}`
      };
    }
  }
}
