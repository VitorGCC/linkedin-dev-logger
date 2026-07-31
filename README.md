# 🚀 DevToLinkedIn CLI

> **Gerador & Publicador Automático de Posts Técnicos Anônimos para o LinkedIn.**
> Transforme suas implementações de código do dia a dia em conteúdo profissional para o LinkedIn sem expor dados confidenciais ou violar NDAs.

---

## 📌 Sobre o Projeto

O **DevToLinkedIn CLI** é uma ferramenta de linha de comando em Node.js e TypeScript desenvolvida para engenheiros de software. Ela analisa suas alterações de código locais (via Git), filtra automaticamente qualquer menção a marcas, empresas ou credenciais sensíveis, gera um artigo/post com Inteligência Artificial no formato de **Estudo de Caso de Engenharia** e publica diretamente no seu perfil do LinkedIn.

---

## 🛡️ Política de Privacidade Absoluta (Zero-Company Policy)

A ferramenta conta com um **Motor de Sanitização de 2 Camadas**:

1. **Filtro Automático de Sanitização**: Antes de qualquer envio de dados para a IA, o script remove e substitui:
   - Nomes de empresas configurados (ex: `Soltech`, `Ultraponto`, etc.).
   - E-mails corporativos (`[email-protegido]`).
   - URLs e domínios internos (`[url-interna]`).
   - Tokens, chaves de API e credenciais (`[credencial-ocultada]`).
2. **Engenharia de Prompt Restritiva**: A IA é instruída a focar **exclusivamente** no desafio técnico de engenharia de software, na stack utilizada, padrões de projeto e aprendizados, **jamais citando o contexto de negócios ou nome da empresa**.

---

## ✨ Funcionalidades Principais

- 🔍 **Coletor do Git (`GitCollector`)**: Extrai commits do dia, diffs de código, arquivos alterados e resumos de branches.
- 🛡️ **Sanitizador Inteligente (`SanitizerService`)**: Anonimiza termos confidenciais de forma totalmente personalizável via `config.json`.
- 🤖 **IA DevRel (`GeminiService`)**: Utiliza a SDK oficial do Google Gemini (`gemini-2.0-flash`) com fallback para templates estruturados.
- 💾 **Histórico Local em Markdown (`PostRepository`)**: Todos os posts gerados são salvos automaticamente na pasta `.posts/`.
- 💻 **Terminal UI Interativo (`TerminalUI`)**: Interface visual moderna com carregadores gráficos, preview formatado e refinamento dinâmico de texto.
- 🚀 **Integração com LinkedIn API (`LinkedInPublisherService`)**: Publica posts ao vivo no seu perfil via API oficial do LinkedIn (`/v2/ugcPosts`).

---

## 🛠️ Tecnologias Utilizadas

- **Linguagem**: Node.js, TypeScript
- **Interface CLI**: `commander`, `inquirer`, `chalk`, `ora`
- **Inteligência Artificial**: `@google/generative-ai` (Gemini AI API)
- **Integração com Rede Social**: LinkedIn REST API (`v2`)
- **Controle de Versão**: Git CLI

---

## ⚙️ Configuração Inicial

### 1. Clonar ou Acessar a Pasta
```bash
cd /home/vitorgabriel/dev/vitor/linkedin-dev-logger
```

### 2. Instalar Dependências e Compilar
```bash
npm install
npm run build
```

### 3. Configurar Variáveis de Ambiente (`.env`)
Crie ou edite o arquivo `.env` na raiz do projeto com as suas credenciais:

```env
# Chave da API do Google Gemini (Obtenha em https://aistudio.google.com)
GEMINI_API_KEY=sua_chave_gemini_aqui

# Token da API Oficial do LinkedIn
LINKEDIN_ACCESS_TOKEN=seu_access_token_aqui

# ID de Autor do LinkedIn
LINKEDIN_PERSON_URN=iwVxPnsT51
```

### 4. Configurar Palavras Proibidas (`config.json`)
No arquivo `config.json`, adicione os nomes de empresas ou clientes que devem ser **obrigatoriamente mascarados**:

```json
{
  "privacy": {
    "forbiddenWords": [
      "Soltech",
      "Ultraponto",
      "EmpresaX",
      "ClienteY"
    ],
    "maskEmails": true,
    "maskDomains": true,
    "maskSecrets": true
  }
}
```

---

## 📖 Como Usar

### Modo Interativo (Padrão)
Execute o comando dentro da pasta da aplicação:
```bash
npm start
```

### Analisar um Repositório Específico
Você pode apontar a CLI para a pasta de qualquer projeto seu:
```bash
node dist/index.js -d /caminho/do/seu/projeto
```

### 💡 Criando um Atalho Global no Linux (Opcional)
Para executar a ferramenta apenas digitando `linkedin-logger` em qualquer pasta do terminal:

```bash
alias linkedin-logger="node /home/vitorgabriel/dev/vitor/linkedin-dev-logger/dist/index.js"
```

---

## 📂 Estrutura do Projeto

```
linkedin-dev-logger/
├── config.json                 # Regras de privacidade e filtro de palavras
├── package.json                # Dependências e scripts do projeto
├── tsconfig.json               # Configurações do TypeScript
├── .env                        # Chaves de API (Gemini e LinkedIn)
├── .posts/                     # Histórico local dos posts gerados em Markdown
└── src/
    ├── index.ts                # Ponto de entrada da aplicação CLI
    ├── collectors/
    │   └── git.collector.ts    # Extração de estatísticas e diffs do Git
    ├── sanitizer/
    │   └── sanitizer.service.ts# Anonimização e remoção de dados sensíveis
    ├── ai/
    │   └── gemini.service.ts   # Chamada e instrução de engenharia para a IA
    ├── ui/
    │   └── terminal.ui.ts      # Menu interativo e interface de terminal
    ├── storage/
    │   └── post.repository.ts  # Armazenamento de arquivos .md locais
    └── publisher/
        └── linkedin.service.ts # Publicador direto via API Oficial do LinkedIn
```

---

## 📄 Licença
Este projeto está sob a licença MIT. Desenvolvido para auxílio no engajamento e compartilhamento de conhecimento técnico.
