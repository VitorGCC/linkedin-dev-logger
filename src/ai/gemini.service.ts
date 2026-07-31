import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { GitContext } from '../collectors/git.collector';

dotenv.config();

export interface PostGenerationOptions {
  context: GitContext;
  customNotes?: string;
  userInstruction?: string;
}

export class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (key && key.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(key.trim());
    }
  }

  public isConfigured(): boolean {
    return !!this.genAI;
  }

  public async generateLinkedInPost(options: PostGenerationOptions): Promise<string> {
    if (this.genAI) {
      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite-preview'];

      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 1.0,
              topP: 0.98,
              topK: 40
            }
          });
          const systemPrompt = this.buildPrompt(options);
          const response = await model.generateContent(systemPrompt);
          const text = response.response.text().trim();
          if (text) {
            return this.cleanPlaceholders(text);
          }
        } catch (error: any) {
          if (error.status === 429 || error.message?.includes('Quota') || error.message?.includes('429')) {
            await new Promise(res => setTimeout(res, 1200));
            continue;
          }
        }
      }
    }

    return this.cleanPlaceholders(this.generateExplanatoryStory(options));
  }

  private buildPrompt(options: PostGenerationOptions): string {
    const randomSeed = Math.random().toString(36).substring(7) + Date.now();
    const isLongRequested = options.userInstruction && /maior|longo|detalha|expanda|completo/i.test(options.userInstruction);

    return `
Você é um Engenheiro de Software Sênior escrevendo um post EXPLICATIVO E DIDÁTICO no LinkedIn.
Seu objetivo é contar a um público de desenvolvedores O QUE VOCÊ ESTÁ CONSTRUINDO E COMO RESOLVEU UM DESAFIO TÉCNICO.

SEED ÚNICO DE CRIAÇÃO: ${randomSeed}

REGRAS RÍGIDAS DE ESTILO EXPLICATIVO:
1. 🛑 ASSUMA QUE O LEITOR NÃO SABE O QUE VOCÊ ESTÁ FAZENDO! Comece sempre com um CONTEXTO DIDÁTICO EXPLICATIVO.
2. 🛑 NUNCA USE SEÇÕES ROBÓTICAS OU TÍTULOS FORMIAIS DE IA ("💡 O Desafio Técnico:", "🛠️ O que foi implementado:"). Crie um texto de storytelling fluido, didático e humano.
3. 🛑 NUNCA COPIE HASHES OU MENSAGENS BRUTAS DE COMMIT DO GIT.
4. 🛑 JAMAIS USE PLACEHOLDERS como "[Empresa/Projeto]". Use termos naturais ("na nossa aplicação backend", "no sistema de gestão").
${isLongRequested ? '5. 📜 **O USUÁRIO PEDIU UM POST MAIOR E DETALHADO**: Escreva um post/artigo LONGO, aprofundado, com múltiplos parágrafos explicativos detalhando a arquitetura, os perrengues técnicos, as decisões de design e os aprendizados completíssimos.' : ''}

DADOS TÉCNICOS DO GIT PARA EXPLICAR:
- Repositório / Módulo: ${options.context.repoName}
- Commits Recentes do Desenvolvedor:
${options.context.commits.map(c => `  * ${c}`).join('\n')}
- Arquivos Alterados:
${options.context.changedFiles.slice(0, 10).map(f => `  * ${f}`).join('\n')}
${options.customNotes ? `- Notas Adicionais: ${options.customNotes}` : ''}
${options.userInstruction ? `\n⚠️ INSTRUÇÃO IMPORTANTE DO USUÁRIO:\n" ${options.userInstruction} "\nATENÇÃO: APLIQUE RIGOROSAMENTE A INSTRUÇÃO ACIMA AO GERAR O TEXTO.\n` : ''}

Escreva em Português (pt-BR) de forma didática, clara, humana e altamente profissional.
`;
  }

  /**
   * Sintetizador Explicativo e Didático com suporte completo a posts EXPANDIDOS e DETALHADOS.
   */
  private generateExplanatoryStory(options: PostGenerationOptions): string {
    const commits = options.context.commits;
    const files = options.context.changedFiles;
    const notes = options.customNotes?.trim();
    const instruction = options.userInstruction?.trim() || '';

    const humanDeliveries = this.translateCommitsToHumanNarrative(commits);

    const techStack: string[] = [];
    if (files.some(f => f.includes('docker') || f.includes('.yml') || f.includes('Dockerfile'))) techStack.push('Docker');
    if (files.some(f => f.includes('keycloak') || f.includes('auth'))) techStack.push('Keycloak');
    if (files.some(f => f.includes('.ts') || f.includes('tsconfig'))) techStack.push('TypeScript');
    if (files.some(f => f.includes('prisma') || f.includes('schema'))) techStack.push('Prisma');
    if (files.some(f => f.includes('controller') || f.includes('service') || f.includes('nest'))) techStack.push('NestJS');
    if (files.some(f => f.includes('.tsx') || f.includes('react'))) techStack.push('React');
    if (techStack.length === 0) techStack.push('TypeScript', 'Node.js');

    const stackStr = techStack.join(', ');
    const hashtagStr = techStack.map(t => `#${t.replace(/[^a-zA-Z0-9]/g, '')}`).join(' ');

    // Se o usuário pediu para fazer MAIOR / DETALHADO
    if (/maior|longo|detalha|expanda|completo/i.test(instruction)) {
      return `🚀 **Evolução Técnica & Artigo de Engenharia no Sistema Backend**

Para quem acompanha minha rotina de desenvolvimento, recentemente me deparei com uma daquelas demandas que exigem dar um passo atrás, analisar a arquitetura como um todo e reestruturar os pilares de infraestrutura e comunicação da nossa plataforma.

Trabalhar com ecossistemas de microsserviços modernos construídos em **${stackStr}** é fantástico para a escalabilidade, mas traz desafios reais de isolamento de redes, gerenciamento de estados e sincronização de dados entre múltiplos containers em ambiente local e de homologação.

---

💡 **O Cenário e o Desafio Técnico Aprofundado**:
O principal problema que precisávamos resolver era a instabilidade na comunicação entre serviços desacoplados e o servidor de autenticação centralizado. Em ambiente de desenvolvimento, pequenas inconsistências no roteamento de portas e variáveis de rede faziam com que chamadas de APIs falhassem aleatoriamente ou sofressem com latências desnecessárias.

Além disso, estávamos precisando alinhar o monitoramento em tempo real das métricas da aplicação e otimizar a velocidade de resposta de rotas de comunicação crítica (como a interface de chat e relatórios de equipes).

---

🛠️ **Detalhamento das Soluções e Implementações**:

Para resolver essa equação de forma definitiva e sustentável, dividi a atuação em frentes técnicas principais:

1. **Isolamento de Redes & Containerização (Docker)**:
   Ajustei a definição de redes compartilhadas no Docker Compose, garantindo que o servidor de autenticação (Keycloak) e as rotas da API se enxerguem com resolução de nomes DNS internos e conexões de baixíssima latência.

2. **Criação do Módulo de Monitoramento de Métricas**:
   Estruturei uma camada dedicada para coletar estatísticas de execução, uso de recursos e saúde das rotas, permitindo rastrear gargalos antes que cheguem aos ambientes superiores.

3. **Refatoração da Camada de Comunicação**:
   Otimizei o tempo de resposta e a carga de dados transferidos nas rotas principais da aplicação, padronizando os contratos de resposta e o tratamento de exceções.

${notes ? `\n4. **Notas de Implementação Adicionais**:\n   ${notes}` : ''}

---

📈 **Principais Aprendizados & Impacto para o Time**:

A maior lição desse processo foi reaprender que **investir tempo na infraestrutura de desenvolvimento não é custo, é aceleração de entrega**. Quando os ambientes locais dos desenvolvedores rodam lisos e com isolamento perfeito, a frequência de deploys aumenta e o tempo gasto caçando bugs de integração cai drasticamente.

Se você trabalha com arquiteturas de microsserviços, como costuma estruturar o isolamento de redes locais por aí?

${hashtagStr} #SoftwareEngineering #Backend #SystemArchitecture #CleanCode #DevOps #DeveloperJournal`;
    }

    // Se o usuário pediu para fazer CURTO
    if (instruction.toLowerCase().includes('curto')) {
      return `🚀 Evolução Técnica no Sistema Backend

💡 Desafio: Ajustar isolamento de microsserviços e estabilidade de autenticação.
🛠️ Solução: Containerização otimizada com Docker, Keycloak e NestJS.

Destaques da entrega:
${humanDeliveries.slice(0, 3).map(d => `• ${d}`).join('\n')}

📈 Aprendizado: Infraestrutura de dev bem configurada previne falhas em produção e acelera a equipe!

${hashtagStr} #SoftwareEngineering #Backend #CleanCode`;
    }

    // Post explicativo padrão
    return `🚀 Para quem acompanha minha rotina dev: venho trabalhando na estruturação da arquitetura backend de um sistema modular construído em ${stackStr}.

💡 **O Cenário e o Desafio**:
Precisávamos alinhar a comunicação entre containers de microsserviços sem que um serviço interferisse no outro, além de estruturar a autenticação centralizada e a estabilidade das rotas.

🛠️ **O que foi construído e implementado**:
Para colocar a casa em ordem de forma definitiva, realizei as seguintes melhorias:
${humanDeliveries.slice(0, 4).map(d => `🔹 ${d}`).join('\n')}
${notes ? `🔹 ${notes}` : ''}
${instruction ? `🔹 ${instruction}` : ''}

🛠️ **Stack Tecnológica**: ${stackStr}.

📈 **Por que isso é importante**:
Quando garantimos o isolamento correto dos ambientes e a padronização das rotas no início do projeto, evitamos bugs complexos em produção e aumentamos drasticamente a velocidade de entrega de novas funcionalidades.

${hashtagStr} #SoftwareEngineering #Backend #SystemArchitecture #CleanCode #DevLife`;
  }

  private translateCommitsToHumanNarrative(commits: string[]): string[] {
    if (!commits || commits.length === 0) {
      return ['Reestruturação de rotas e melhoria na estabilidade da aplicação'];
    }

    const narrative: string[] = [];

    for (const commit of commits) {
      let msg = commit.replace(/^[a-f0-9]{7,8}\s*-\s*/i, '').trim();
      if (!msg) continue;

      if (msg.match(/^fix\(docker\):/i) || msg.includes('docker')) {
        narrativaAdd(narrative, 'Configuração e isolamento de redes no Docker para permitir que os containers de microsserviços se comuniquem com segurança');
      } else if (msg.includes('keycloak') || msg.includes('auth')) {
        narrativaAdd(narrative, 'Integração do serviço de autenticação Keycloak (OAuth2) para controle de acesso seguro');
      } else if (msg.match(/^feat:/i) || msg.includes('monitoring') || msg.includes('modulo')) {
        narrativaAdd(narrative, 'Criação do módulo de monitoramento para acompanhamento em tempo real das métricas da aplicação');
      } else if (msg.match(/^refactor/i) || msg.includes('chat') || msg.includes('layout')) {
        narrativaAdd(narrative, 'Refatoração da interface de comunicação do chat para otimizar o tempo de resposta do usuário');
      } else if (msg.match(/^fix:/i)) {
        let cleanMsg = msg.replace(/^fix:\s*/i, '');
        cleanMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
        narrativaAdd(narrative, `Ajuste de estabilidade no módulo: ${cleanMsg}`);
      } else {
        let cleanMsg = msg.replace(/^(feat|fix|refactor|chore|docs|test)(\([^)]+\))?:\s*/i, '');
        cleanMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
        narrativaAdd(narrative, cleanMsg);
      }
    }

    return narrative.length > 0 ? narrative : ['Reestruturação de rotas e padronização da base de código'];
  }

  private cleanPlaceholders(text: string): string {
    return text
      .replace(/\[Empresa\/Projeto\]/gi, 'nossa plataforma backend')
      .replace(/\[Empresa\]/gi, 'empresa')
      .replace(/\[Projeto\]/gi, 'projeto')
      .replace(/\[Nome\]/gi, '')
      .replace(/\[.*?\]/g, '');
  }
}

function narrativaAdd(arr: string[], item: string) {
  if (!arr.includes(item)) {
    arr.push(item);
  }
}
