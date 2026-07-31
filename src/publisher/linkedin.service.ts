import fs from 'fs';
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

  /**
   * Registra e envia uma imagem PNG/JPEG para a API de mídia do LinkedIn
   */
  public async uploadImage(imagePath: string, authorUrn: string): Promise<string | null> {
    if (!fs.existsSync(imagePath)) return null;

    try {
      // 1. Registra a intenção de upload
      const registerPayload = {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: authorUrn,
          serviceRelationships: [
            {
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent'
            }
          ]
        }
      };

      const regRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(registerPayload)
      });

      if (!regRes.ok) return null;

      const regData: any = await regRes.json();
      const uploadUrl = regData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
      const assetUrn = regData.value?.asset;

      if (!uploadUrl || !assetUrn) return null;

      // 2. Faz o upload binário do arquivo de imagem
      const imageBuffer = fs.readFileSync(imagePath);
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'image/png'
        },
        body: imageBuffer
      });

      if (!uploadRes.ok) return null;

      return assetUrn;
    } catch {
      return null;
    }
  }

  public async publishPost(postText: string, imagePath?: string): Promise<LinkedInPublishResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Access Token do LinkedIn não configurado no arquivo .env (LINKEDIN_ACCESS_TOKEN).'
      };
    }

    try {
      const authorUrn = await this.getPersonUrn();

      let imageAssetUrn: string | null = null;
      if (imagePath) {
        imageAssetUrn = await this.uploadImage(imagePath, authorUrn);
      }

      let shareContent: any = {
        shareCommentary: { text: postText },
        shareMediaCategory: 'NONE'
      };

      if (imageAssetUrn) {
        shareContent = {
          shareCommentary: { text: postText },
          shareMediaCategory: 'IMAGE',
          media: [
            {
              status: 'READY',
              description: { text: 'Card Visual DevToLinkedIn' },
              media: imageAssetUrn,
              title: { text: 'Estudo de Caso Técnico' }
            }
          ]
        };
      }

      const payload = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': shareContent
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
        message: imageAssetUrn
          ? '🎉 Post com Card Visual anexado publicado no seu LinkedIn com sucesso!'
          : '🎉 Post publicado no seu LinkedIn com sucesso!'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Falha na publicação: ${error.message}`
      };
    }
  }
}
