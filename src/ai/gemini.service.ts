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
              topK: 50
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

    return this.cleanPlaceholders(this.generateZeroRepetitionStory(options));
  }

  private buildPrompt(options: PostGenerationOptions): string {
    const randomSeed = Math.random().toString(36).substring(7) + Date.now();
    const isLongRequested = options.userInstruction && /maior|longo|detalha|expanda|completo/i.test(options.userInstruction);

    const randomStylePrompt = [
      'Use estilo de diário de bordo com títulos informais e parágrafos curtos.',
      'Use estilo Q&A com perguntas e respostas didáticas (ex: ❓ O desafio?, 💡 Como foi resolvido?).',
      'Use estilo de estudo de caso de arquitetura limpa e sem seções robóticas.',
      'Use estilo de conversa direta de dev para dev com ganchos de perrengues e aprendizados.',
      'Use estilo de artigo técnico focado no impacto de performance e boas práticas.'
    ];

    const chosenStyleDirective = randomStylePrompt[Math.floor(Math.random() * randomStylePrompt.length)];

    return `
Você é um Engenheiro de Software Sênior escrevendo um post EXPLICATIVO, DIDÁTICO E TOTALMENTE ÚNICO no LinkedIn.
Seu objetivo é contar O QUE VOCÊ CONSTRUUIU E COMO RESOLVEU UM DESAFIO TÉCNICO.

SEED ÚNICO DE CRIAÇÃO (VARIABILIDADE ABSOLUTA): ${randomSeed}
DIRETRIZ DE ESTILO DE HOJE: ${chosenStyleDirective}

REGRAS DE ZERO REPETIÇÃO (MUITO IMPORTANTE):
1. 🛑 NUNCA REPITA ESTRUTURAS FIXAS OU SEÇÕES PADRONIZADAS como "💡 O Cenário e o Desafio:", "🛠️ O que foi construído:". Crie títulos, conectivos e formatações completamente novos a cada post.
2. 🛑 NUNCA USE A FRASE "Para quem acompanha minha rotina dev" OU QUALQUER OUTRA FRASE FIXA. A primeira linha deve ser 100% inédita.
3. 🛑 JAMAIS COPIE MENSAGENS BRUTAS DE COMMIT, HASHES, PRs OU IDs DE TAREFAS/JIRA (ex: DEV-126, PR #770, hashes).
4. 🛑 TRADUZA SEMPRE AS TAREFAS PARA LINGUAGEM NATURAL DE ENGENHARIA.
5. 🛑 ASSUMA QUE O LEITOR NÃO CONHECE SEU PROJETO INTERNO: Explique o contexto de forma ampla e didática.
6. 🛑 JAMAIS USE COLCHETES OU PLACEHOLDERS ("no nosso backend", "na nossa aplicação").
7. 🛑 NUNCA mencione o nome de nenhuma empresa, cliente ou marca comercial.
${isLongRequested ? '8. 📜 **O USUÁRIO PEDIU UM POST MAIOR E DETALHADO**: Escreva um artigo LONGO, aprofundado, com múltiplos parágrafos detalhando a arquitetura, os desafios e as soluções técnicas.' : ''}

DADOS DAS ALTERAÇÕES (SINTETIZE EM FRASES HUMANAS INÉDITAS):
- Repositório / Módulo: ${options.context.repoName}
- Alterações Recentes:
${options.context.commits.map(c => `  * ${c}`).join('\n')}
- Arquivos Alterados:
${options.context.changedFiles.slice(0, 10).map(f => `  * ${f}`).join('\n')}
${options.customNotes ? `- Notas Adicionais: ${options.customNotes}` : ''}
${options.userInstruction ? `\n⚠️ INSTRUÇÃO IMPORTANTE DO DESENVOLVEDOR:\n" ${options.userInstruction} "\n` : ''}

Escreva em Português (pt-BR) de forma viva, Didática, fluída, humana e com ZERO repetição de estrutura.
`;
  }

  /**
   * Gerador Combinatório de Zero Repetição (Offline Fallback)
   * Alterna dinamicamente 5 estruturas de títulos, 5 formatos de tópicos, 5 cabeçalhos e 5 desfechos.
   */
  private generateZeroRepetitionStory(options: PostGenerationOptions): string {
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

    const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // 1. Primeiras frases 100% variadas
    const openingHooks = [
      `🚀 No desenvolvimento do nosso ecossistema backend em ${stackStr}, hoje o foco foi totalmente voltado para refatoração e sincronização de serviços.`,
      `🚀 Quem trabalha com arquitetura modular em ${stackStr} sabe a importância de manter a comunicação entre serviços transparente e à prova de falhas.`,
      `🚀 Mais um dia de aprendizado prático em engenharia de software! Desta vez, trabalhei no alinhamento da infraestrutura backend.`,
      `🚀 Garantir alta disponibilidade e sincronização em tempo real é sempre um desafio instigante na nossa rotina em ${stackStr}.`,
      `🚀 Hoje passei por uma experiência rica de desenvolvimento ajustando pontos críticos de integração e processamento no nosso backend.`,
      `🚀 Sabe aquele tipo de demanda que parece pontual, mas traz um ganho de estabilidade enorme para a aplicação? Foi o foco do meu dia em ${stackStr}.`,
      `🚀 Compartilhando um pouco do meu diário de código: trabalhei recentemente na reestruturação e melhoria das nossas rotas principais.`
    ];

    // 2. Títulos de Seção de Desafio variados
    const challengeHeaders = [
      '🎯 **Contexto & O Desafio da Vez**:',
      '❓ **Qual era o problema principal?**',
      '🔍 **O Cenário de Engenharia Enfrentado**:',
      '💡 **A Necessidade Técnica**:',
      '📍 **Onde estava a fricção?**'
    ];

    // 3. Títulos de Seção de Solução variados
    const solutionHeaders = [
      '🛠️ **Entregas & Melhorias Aplicadas**:',
      '⚙️ **Como resolvemos na prática**:',
      '💡 **Soluções Implementadas**:',
      '🚀 **O que foi construído na arquitetura**:',
      '🛠️ **Etapas da Implementação**:'
    ];

    // 4. Marcadores de tópicos variados (bullets)
    const bulletIcons = ['🔹', '•', '⚡', '✔', '👉'];
    const chosenBullet = getRandom(bulletIcons);

    // 5. Títulos da Stack variados
    const stackHeaders = [
      '🛠️ **Stack Tecnológica**:',
      '💻 **Tecnologias Envolvidas**:',
      '⚡ **Ferramentas Utilizadas**:',
      '🛠️ **Tecnologias Chave**:'
    ];

    // 6. Desfecho e Aprendizado variados
    const takeaways = [
      '📈 **Por que isso é importante**:\nQuando garantimos o fluxo correto de sincronização e importação de dados no backend, evitamos falhas complexas em produção e aumentamos drasticamente a estabilidade da aplicação.',
      '📈 **Resultado Prático**:\nInvestir tempo na refatoração da comunicação de microsserviços reduz o tempo de resposta e torna a arquitetura previsível diante de picos de carga.',
      '📈 **Aprendizado de Dev**:\nA maior lição foi ver como um tratamento de exceções gracioso logo na camada de entrada evita falhas de integração que antes tomavam horas de debug.',
      '📈 **Impacto na Produção**:\nPadronizar o isolamento e o processamento de registros permite deploys mais frequentes e com risco próximo de zero.'
    ];

    const chosenOpening = getRandom(openingHooks);
    const chosenChallengeHead = getRandom(challengeHeaders);
    const chosenSolutionHead = getRandom(solutionHeaders);
    const chosenStackHead = getRandom(stackHeaders);
    const chosenTakeaway = getRandom(takeaways);

    if (/maior|longo|detalha|expanda|completo/i.test(instruction)) {
      return `🚀 **Evolução Técnica & Artigo de Engenharia no Sistema Backend**

Para quem acompanha minha rotina de desenvolvimento, recentemente me deparei com uma daquelas demandas que exigem dar um passo atrás, analisar a arquitetura como um todo e reestruturar os pilares de infraestrutura e comunicação da nossa plataforma.

Trabalhar com ecossistemas de microsserviços modernos construídos em **${stackStr}** é fantástico para a escalabilidade, mas traz desafios reais de sincronização de dados em tempo real, gerenciamento de logs e integração de serviços.

---

${chosenChallengeHead}
O principal problema que precisávamos resolver era garantir a importação e o processamento de registros em tempo real sem gargalo de comunicação ou perdas de eventos de auditoria. Em sistemas de grande volume, chamadas assíncronas mal otimizadas podem gerar inconsistências nos dados.

---

${chosenSolutionHead}

Para resolver essa equação de forma definitiva e sustentável, dividi a atuação em frentes técnicas principais:

${humanDeliveries.map((d, idx) => `${idx + 1}. **${d}**`).join('\n\n')}
${notes ? `\n4. **Notas Adicionais de Implementação**:\n   ${notes}` : ''}

---

${chosenTakeaway}

Se você trabalha com integração em tempo real e microsserviços, como costuma estruturar a sincronização de logs por aí?

${hashtagStr} #SoftwareEngineering #Backend #SystemArchitecture #CleanCode #DevOps #DeveloperJournal`;
    }

    return `${chosenOpening}

${chosenChallengeHead}
Precisávamos alinhar o fluxo de cadastro, importação de dados e sincronização de eventos em tempo real, garantindo que as chamadas fossem processadas sem latência e com total confiabilidade.

${chosenSolutionHead}
Para colocar a casa em ordem de forma definitiva, realizei as seguintes melhorias:
${humanDeliveries.map(d => `${chosenBullet} ${d}`).join('\n')}
${notes ? `${chosenBullet} ${notes}` : ''}

${chosenStackHead} ${stackStr}.

${chosenTakeaway}

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
