import { AIProvider, PostGenerationOptions } from '../ai.interface';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  public isConfigured(): boolean {
    return true; // Ollama roda localmente sem necessidade de chave de API
  }

  public async generateLinkedInPost(options: PostGenerationOptions): Promise<string> {
    const prompt = `
Você é um Engenheiro de Software Sênior escrevendo um post pessoal no LinkedIn sobre um desafio de código recente.
Explique o contexto do sistema de forma didática e transparente sem citar empresas.

Commits recentes:
${options.context.commits.join('\n')}

Arquivos alterados:
${options.context.changedFiles.slice(0, 10).join('\n')}

${options.userInstruction ? `Instrução adicional: ${options.userInstruction}` : ''}
`;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false
        })
      });

      if (response.ok) {
        const data: any = await response.json();
        if (data.response) {
          return data.response.trim();
        }
      }
    } catch {
      // Se Ollama não estiver rodando na máquina local, retorna aviso claro
    }

    throw new Error('Servidor Ollama local não está rodando em http://localhost:11434.');
  }
}
