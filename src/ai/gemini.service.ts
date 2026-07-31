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

    const randomHooksPrompt = [
      'Comece o post de forma direta e entusiasmada sobre o aprendizado prático.',
      'Comece com um questionamento sobre os desafios de arquitetura backend.',
      'Comece como um diário de bordo pessoal contando a experiência do dia.',
      'Comece destacando o impacto da refatoração de código na produtividade.',
      'Comece explicando o cenário inicial de forma extremamente simples para leigos.'
    ];

    const chosenHookDirective = randomHooksPrompt[Math.floor(Math.random() * randomHooksPrompt.length)];

    return `
Você é um Engenheiro de Software Sênior escrevendo um post EXPLICATIVO, DIDÁTICO E HUMANO no LinkedIn.
Seu objetivo é contar a um público de desenvolvedores O QUE VOCÊ CONSTRUUIU E COMO RESOLVEU UM DESAFIO TÉCNICO.

SEED ÚNICO DE CRIAÇÃO (VARIABILIDADE TOTAL): ${randomSeed}
ESTILO DA PRIMEIRA FRASE DE HOJE: ${chosenHookDirective}

REGRAS RÍGIDAS E ABSOLUTAS DE CONTEÚDO (CRÍTICO):
1. 🛑 NUNCA USE A FRASE "Para quem acompanha minha rotina dev" OU FRASES REPETITIVAS. Mude completamente a frase de abertura a cada geração.
2. 🛑 JAMAIS COPIE MENSAGENS BRUTAS DE COMMIT, HASHES, PRs OU IDs DE TAREFAS/JIRA (ex: JAMAIS use "DEV-126", "DEV-127", "Merge pull request #770", "fe7e4741").
3. 🛑 TRADUZA SEMPRE AS TAREFAS PARA LINGUAGEM NATURAL DE ENGENHARIA. Explique a funcionalidade em português claro.
4. 🛑 ASSUMA QUE O LEITOR NÃO CONHECE SEU PROJETO INTERNO: Explique o contexto de forma ampla e didática.
5. 🛑 JAMAIS USE COLCHETES OU PLACEHOLDERS ("no nosso backend", "na nossa aplicação").
6. 🛑 NUNCA mencione o nome de nenhuma empresa, cliente ou marca comercial.
${isLongRequested ? '7. 📜 **O USUÁRIO PEDIU UM POST MAIOR E DETALHADO**: Escreva um artigo LONGO, aprofundado, com múltiplos parágrafos detalhando a arquitetura, os desafios e as soluções técnicas.' : ''}

DADOS DAS ALTERAÇÕES (SINTETIZE EM FRASES HUMANAS):
- Repositório / Módulo: ${options.context.repoName}
- Alterações Recentes:
${options.context.commits.map(c => `  * ${c}`).join('\n')}
- Arquivos Alterados:
${options.context.changedFiles.slice(0, 10).map(f => `  * ${f}`).join('\n')}
${options.customNotes ? `- Notas Adicionais: ${options.customNotes}` : ''}
${options.userInstruction ? `\n⚠️ INSTRUÇÃO IMPORTANTE DO DESENVOLVEDOR:\n" ${options.userInstruction} "\n` : ''}

Escreva em Português (pt-BR) de forma extremamente explicativa, humana, fluída e profissional sem frases repetidas.
`;
  }

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

    // Pool diversificado de frases de abertura para garantir que NUNCA repita a primeira frase
    const openingHooks = [
      `🚀 No desenvolvimento do nosso ecossistema backend em ${stackStr}, hoje o foco foi totalmente voltado para refatoração e sincronização de serviços.`,
      `🚀 Quem trabalha com arquitetura modular em ${stackStr} sabe a importância de manter a comunicação entre serviços transparente e à prova de falhas.`,
      `🚀 Mais um dia de aprendizado prático em engenharia de software! Desta vez, trabalhei no alinhamento da infraestrutura backend.`,
      `🚀 Garantir alta disponibilidade e sincronização em tempo real é sempre um desafio instigante na nossa rotina em ${stackStr}.`,
      `🚀 Hoje passei por uma experiência rica de desenvolvimento ajustando pontos críticos de integração e processamento no nosso backend.`,
      `🚀 Sabe aquele tipo de demanda que parece pontual, mas traz um ganho de estabilidade enorme para a aplicação? Foi o foco do meu dia em ${stackStr}.`,
      `🚀 Compartilhando um pouco do meu diário de código: trabalhei recentemente na reestruturação e melhoria das nossas rotas principais.`
    ];

    const chosenOpening = openingHooks[Math.floor(Math.random() * openingHooks.length)];

    if (/maior|longo|detalha|expanda|completo/i.test(instruction)) {
      return `🚀 **Evolução Técnica & Artigo de Engenharia no Sistema Backend**

Para quem acompanha minha rotina de desenvolvimento, recentemente me deparei com uma daquelas demandas que exigem dar um passo atrás, analisar a arquitetura como um todo e reestruturar os pilares de infraestrutura e comunicação da nossa plataforma.

Trabalhar com ecossistemas de microsserviços modernos construídos em **${stackStr}** é fantástico para a escalabilidade, mas traz desafios reais de sincronização de dados em tempo real, gerenciamento de logs e integração de serviços.

---

💡 **O Cenário e o Desafio Técnico Aprofundado**:
O principal problema que precisávamos resolver era garantir a importação e o processamento de registros em tempo real sem gargalo de comunicação ou perdas de eventos de auditoria. Em sistemas de grande volume, chamadas assíncronas mal otimizadas podem gerar inconsistências nos dados de presença e controle de acesso.

---

🛠️ **Detalhamento das Soluções e Implementações**:

Para resolver essa equação de forma definitiva e sustentável, dividi a atuação em frentes técnicas principais:

${humanDeliveries.map((d, idx) => `${idx + 1}. **${d}**`).join('\n\n')}
${notes ? `\n4. **Notas Adicionais de Implementação**:\n   ${notes}` : ''}

---

📈 **Principais Aprendizados & Impacto para o Time**:

A maior lição desse processo foi reaprender que **garantir a sincronização em tempo real com tratamento gracioso de falhas é a chave para a confiabilidade de sistemas críticos**. Quando a arquitetura trata as exceções logo na entrada, o sistema se torna previsível e à prova de falhas em produção.

Se você trabalha com integração em tempo real e microsserviços, como costuma estruturar a sincronização de logs por aí?

${hashtagStr} #SoftwareEngineering #Backend #SystemArchitecture #CleanCode #DevOps #DeveloperJournal`;
    }

    return `${chosenOpening}

💡 **O Cenário e o Desafio**:
Precisávamos alinhar o fluxo de cadastro, importação de dados e sincronização de eventos em tempo real, garantindo que as chamadas fossem processadas sem latência e com total confiabilidade.

🛠️ **O que foi construído e implementado**:
Para colocar a casa em ordem de forma definitiva, realizei as seguintes melhorias:
${humanDeliveries.map(d => `🔹 ${d}`).join('\n')}
${notes ? `🔹 ${notes}` : ''}

🛠️ **Stack Tecnológica**: ${stackStr}.

📈 **Por que isso é importante**:
Quando garantimos o fluxo correto de sincronização e importação de dados no backend, evitamos falhas complexas em produção e aumentamos drasticamente a estabilidade da aplicação.

${hashtagStr} #SoftwareEngineering #Backend #SystemArchitecture #CleanCode #DevLife`;
  }

  private translateCommitsToHumanNarrative(commits: string[]): string[] {
    if (!commits || commits.length === 0) {
      return ['Reestruturação de rotas e melhoria na estabilidade da aplicação'];
    }

    const narrative: string[] = [];

    for (const commit of commits) {
      let msg = commit.trim();

      if (msg.toLowerCase().includes('merge pull request') || msg.toLowerCase().includes('sincronização de branch')) {
        continue;
      }

      msg = msg
        .replace(/^[a-f0-9]{7,8}\s*-\s*/i, '')
        .replace(/\b[A-Z]{2,8}-\d{1,6}\b/gi, '')
        .replace(/#\d+/g, '')
        .replace(/\(\d+\s+(hours|days|minutes|weeks|ago)\)/gi, '')
        .trim();

      if (!msg) continue;

      if (msg.includes('cadastro/edição de usuário em tempo real') || msg.includes('rep-events')) {
        narrativaAdd(narrative, 'Implementação de cadastro e sincronização de usuários em tempo real para controle de acesso');
      } else if (msg.includes('importação manual de logs') || msg.includes('rep-agent')) {
        narrativaAdd(narrative, 'Estruturação do agente de importação e processamento manual de logs de auditoria');
      } else if (msg.includes('importação manual de logs por período') || msg.includes('idface')) {
        narrativaAdd(narrative, 'Otimização da filtragem e busca de histórico de registros por intervalo de datas');
      } else if (msg.includes('docker') || msg.includes('redes')) {
        narrativaAdd(narrative, 'Configuração e isolamento de redes no Docker para comunicação segura entre microsserviços');
      } else if (msg.includes('keycloak') || msg.includes('auth')) {
        narrativaAdd(narrative, 'Integração e ajuste da camada de autenticação centralizada com Keycloak');
      } else {
        let cleanMsg = msg.replace(/^(feat|fix|refactor|chore|docs|test)(\([^)]+\))?:\s*/i, '').trim();
        if (cleanMsg.length > 3) {
          cleanMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
          narrativaAdd(narrative, cleanMsg);
        }
      }
    }

    return narrative.length > 0 ? narrative : [
      'Implementação de fluxo de sincronização de eventos em tempo real',
      'Estruturação da rotina de importação e filtros de logs de auditoria'
    ];
  }

  private cleanPlaceholders(text: string): string {
    return text
      .replace(/\[Empresa\/Projeto\]/gi, 'nossa plataforma backend')
      .replace(/\[Empresa\]/gi, 'empresa')
      .replace(/\[Projeto\]/gi, 'projeto')
      .replace(/\[Nome\]/gi, '')
      .replace(/\bDEV-\d+\b/gi, '')
      .replace(/Merge pull request #\d+ from [^\n]+/gi, '')
      .replace(/\[.*?\]/g, '');
  }
}

function narrativaAdd(arr: string[], item: string) {
  if (!arr.includes(item)) {
    arr.push(item);
  }
}
