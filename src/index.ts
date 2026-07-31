#!/usr/bin/env node
import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import { TerminalUI } from './ui/terminal.ui';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(process.cwd(), '.env') });

const program = new Command();

program
  .name('linkedin-dev-logger')
  .description('Ferramenta CLI para analisar desenvolvimento de código e gerar posts técnicos para o LinkedIn')
  .version('1.0.0')
  .option('-d, --dir <path>', 'Diretório do repositório a ser analisado', process.cwd())
  .action(async (options) => {
    const ui = new TerminalUI(options.dir);
    await ui.start();
  });

program.parse(process.argv);
