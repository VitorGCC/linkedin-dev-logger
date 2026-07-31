import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import ora from 'ora';
import { GitCollector } from '../collectors/git.collector';
import { SanitizerService } from '../sanitizer/sanitizer.service';
import { GeminiService } from '../ai/gemini.service';
import { PostRepository } from '../storage/post.repository';
import { LinkedInPublisherService } from '../publisher/linkedin.service';

export class TerminalUI {
  private gitCollector: GitCollector;
  private sanitizer: SanitizerService;
  private aiService: GeminiService;
  private postRepo: PostRepository;
  private publisher: LinkedInPublisherService;

  constructor(targetDir?: string) {
    this.gitCollector = new GitCollector(targetDir);
    this.sanitizer = new SanitizerService();
    this.aiService = new GeminiService();
    this.postRepo = new PostRepository();
    this.publisher = new LinkedInPublisherService();
  }

  public async start(): Promise<void> {
    console.clear();
    console.log(chalk.bold.cyan('===================================================='));
    console.log(chalk.bold.cyan('   🚀 DevToLinkedIn CLI - Gerador de Posts Anônimos'));
    console.log(chalk.bold.cyan('====================================================\n'));

    if (!this.gitCollector.isGitRepository()) {
      console.log(chalk.yellow('⚠️ O diretório atual não é um repositório Git.'));
      console.log(chalk.white('Ainda assim, você pode digitar notas manuais para gerar o post.\n'));
    }

    // Prompt for custom notes
    const { customNotes } = await inquirer.prompt([
      {
        type: 'input',
        name: 'customNotes',
        message: 'Deseja adicionar alguma nota técnica extra sobre o que fez hoje? (opcional):',
        default: ''
      }
    ]);

    // 1. Coleta do Git
    const spinnerGit = ora('Analisando o histórico e diffs do Git...').start();
    const rawContext = this.gitCollector.collectContext({ since: '00:00:00' });
    spinnerGit.succeed(`Git analisado! (${rawContext.commits.length} commits encontrados)`);

    // 2. Sanitização & Privacidade
    const spinnerSanitize = ora('Sanitizando dados para garantir privacidade e anonimato...').start();
    const { sanitizedContext, sanitizedNotes, redactedTermsCount } = this.sanitizer.sanitizeContext(
      rawContext,
      customNotes
    );
    spinnerSanitize.succeed(
      `Dados sanitizados com sucesso! (${redactedTermsCount} termos/dados sensíveis removidos ou mascarados)`
    );

    // 3. Checagem da IA
    if (!this.aiService.isConfigured()) {
      console.log('\n' + chalk.bold.yellow('💡 Nenhuma GEMINI_API_KEY foi detectada no .env.'));
      console.log(chalk.gray('Executando em Modo de Demonstração para testes dos módulos.\n'));
    }

    // 4. Geração do Post pela IA
    await this.generatePost(sanitizedContext, sanitizedNotes);
  }

  private async generatePost(sanitizedContext: any, sanitizedNotes: string, userInstruction?: string): Promise<void> {
    const spinnerAI = ora('IA está escrevendo um post técnico engajador para o LinkedIn...').start();
    try {
      const postText = await this.aiService.generateLinkedInPost({
        context: sanitizedContext,
        customNotes: sanitizedNotes,
        userInstruction
      });
      spinnerAI.succeed('Post gerado com sucesso!\n');
      
      this.displayPost(postText);
      await this.showOptionsMenu(postText, sanitizedContext, sanitizedNotes);
    } catch (error: any) {
      spinnerAI.fail(`Erro ao gerar post com a IA: ${error.message}`);
    }
  }

  private displayPost(postText: string): void {
    console.log(chalk.bold.green('----------------------------------------------------'));
    console.log(chalk.bold.white(' PREVIEW DO POST PARA O LINKEDIN:'));
    console.log(chalk.bold.green('----------------------------------------------------'));
    console.log(chalk.white(postText));
    console.log(chalk.bold.green('----------------------------------------------------\n'));
  }

  private async showOptionsMenu(postText: string, sanitizedContext: any, sanitizedNotes: string): Promise<void> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'O que deseja fazer com este post?',
        choices: [
          { name: '💾 Salvar localmente em Markdown (.posts/)', value: 'save' },
          { name: '🔄 Regenerar / Pedir ajustes para a IA', value: 'refine' },
          { name: '🚀 Publicar no LinkedIn (Fase 6 - API)', value: 'publish' },
          { name: '❌ Sair', value: 'exit' }
        ]
      }
    ]);

    switch (action) {
      case 'save': {
        const savedPath = this.postRepo.savePost(postText, sanitizedContext.repoName);
        console.log(chalk.green(`\n✅ Post salvo com sucesso em: ${chalk.bold(savedPath)}\n`));
        await this.showOptionsMenu(postText, sanitizedContext, sanitizedNotes);
        break;
      }
      case 'refine': {
        const { instruction } = await inquirer.prompt([
          {
            type: 'input',
            name: 'instruction',
            message: 'O que gostaria de alterar no post? (ex: "faça mais curto", "enfatize o banco de dados"):',
          }
        ]);
        await this.generatePost(sanitizedContext, sanitizedNotes, instruction);
        break;
      }
      case 'publish': {
        let token = process.env.LINKEDIN_ACCESS_TOKEN;

        if (!token || token.trim() === '') {
          console.log('\n' + chalk.bold.cyan('----------------------------------------------------'));
          console.log(chalk.bold.cyan(' 🔑 CONFIGURAÇÃO DO LINKEDIN ACCESS TOKEN (Fase 6)'));
          console.log(chalk.bold.cyan('----------------------------------------------------'));
          console.log(
            chalk.white(
              'Para publicar diretamente no seu perfil do LinkedIn, você precisa de um Access Token do LinkedIn.\n' +
              'Instruções rápidas:\n' +
              '1. Acesse: https://www.linkedin.com/developers/tools/oauth/token-generator\n' +
              '2. Selecione as permissões: w_member_social (Share on LinkedIn)\n' +
              '3. Cole o token abaixo:\n'
            )
          );

          const { userToken } = await inquirer.prompt([
            {
              type: 'password',
              name: 'userToken',
              message: 'Cole o seu Access Token do LinkedIn (ou pressione Enter para cancelar):',
              mask: '*'
            }
          ]);

          if (!userToken || userToken.trim() === '') {
            console.log(chalk.gray('\nPublicação cancelada. O post continuará salvo para cópia manual!\n'));
            await this.showOptionsMenu(postText, sanitizedContext, sanitizedNotes);
            return;
          }

          token = userToken.trim();

          // Salvar token no .env para uso futuro
          const envPath = path.join(process.cwd(), '.env');
          let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
          if (!envContent.includes('LINKEDIN_ACCESS_TOKEN')) {
            envContent += `\nLINKEDIN_ACCESS_TOKEN=${token}\n`;
            fs.writeFileSync(envPath, envContent, 'utf-8');
            console.log(chalk.green('✅ Token do LinkedIn salvo no arquivo .env para uso futuro!\n'));
          }
        }

        const publisher = new LinkedInPublisherService(token);
        let personUrn = process.env.LINKEDIN_PERSON_URN;

        if (!personUrn) {
          try {
            personUrn = await publisher.getPersonUrn();
          } catch {
            console.log('\n' + chalk.yellow('ℹ️ Precisamos registrar o ID do seu perfil do LinkedIn uma única vez.'));
            console.log(chalk.gray('Abra o seu perfil no LinkedIn no navegador (ex: https://www.linkedin.com/in/seu-nome).\n'));

            const { inputUrn } = await inquirer.prompt([
              {
                type: 'input',
                name: 'inputUrn',
                message: 'Digite o seu ID do LinkedIn ou a URL do seu perfil:',
              }
            ]);

            if (inputUrn && inputUrn.trim()) {
              let cleanId = inputUrn.trim();
              if (cleanId.includes('/in/')) {
                cleanId = cleanId.split('/in/')[1].replace(/\//g, '');
              }
              personUrn = cleanId;

              // Salvar no .env
              const envPath = path.join(process.cwd(), '.env');
              let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
              if (!envContent.includes('LINKEDIN_PERSON_URN')) {
                envContent += `\nLINKEDIN_PERSON_URN=${personUrn}\n`;
                fs.writeFileSync(envPath, envContent, 'utf-8');
              }
            }
          }
        }

        const publisherWithUrn = new LinkedInPublisherService(token, personUrn);
        const spinnerPub = ora('Enviando o post para a API do LinkedIn...').start();

        const result = await publisherWithUrn.publishPost(postText);

        if (result.success) {
          spinnerPub.succeed(chalk.bold.green('🎉 POST PUBLICADO NO LINKEDIN COM SUCESSO!'));
          console.log(chalk.cyan(`\nVeja seu perfil no LinkedIn: ${result.postUrl}\n`));
        } else {
          spinnerPub.fail(chalk.bold.red('Erro ao publicar no LinkedIn:'));
          console.log(chalk.red(result.message + '\n'));
        }

        await this.showOptionsMenu(postText, sanitizedContext, sanitizedNotes);
        break;
      }
      case 'exit':
        console.log(chalk.cyan('Até logo! Bons códigos e bons posts. 🚀'));
        break;
    }
  }
}
