import fs from 'fs';
import path from 'path';

export class HookInstallerService {
  /**
   * Instala um Git Hook de post-push no repositório atual ou especificado.
   * Toda vez que você der 'git push', o hook avisa ou dispara o linkedin-logger.
   */
  public installHook(targetDir?: string): { success: boolean; message: string; hookPath?: string } {
    const rootDir = targetDir || process.cwd();
    const gitHooksDir = path.join(rootDir, '.git', 'hooks');

    if (!fs.existsSync(path.join(rootDir, '.git'))) {
      return {
        success: false,
        message: `O diretório "${rootDir}" não é a raiz de um repositório Git (.git não encontrado).`
      };
    }

    if (!fs.existsSync(gitHooksDir)) {
      fs.mkdirSync(gitHooksDir, { recursive: true });
    }

    const hookPath = path.join(gitHooksDir, 'post-push');
    const cliScriptPath = path.join(__dirname, '..', 'index.js');

    const hookContent = `#!/bin/sh
# Git Hook post-push instalado pelo DevToLinkedIn CLI
echo ""
echo "🚀 [DevToLinkedIn CLI] Você acabou de enviar código para o repositório!"
echo "💡 Para gerar um post técnico anônimo sobre o que fez, rode: linkedin-logger"
echo ""
`;

    try {
      fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
      return {
        success: true,
        message: `Git Hook 'post-push' instalado com sucesso em: ${hookPath}`,
        hookPath
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao gravar o Git Hook: ${error.message}`
      };
    }
  }
}
