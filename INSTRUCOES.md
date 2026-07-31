# 📖 Guia de Uso Prático - DevToLinkedIn CLI

Manual rápido de instruções de uso no terminal para rodar o gerador e publicador de posts em qualquer projeto ou repositório.

---

## 🚀 1. Como Rodar em um Repositório Específico

Você pode executar o analisador apontando para qualquer pasta de projeto no seu computador usando a flag `-d` (directory):

### Exemplo 1: Rodar no projeto `MeuProjeto1`
```bash
node /home/vitorgabriel/dev/vitor/linkedin-dev-logger/dist/index.js -d /home/vitorgabriel/dev/vitor/MeuProjeto1
```

### Exemplo 2: Rodar no projeto `WebAPP`
```bash
node /home/vitorgabriel/dev/vitor/linkedin-dev-logger/dist/index.js -d /home/vitorgabriel/dev/vitor/WebAPP
```

### Exemplo 3: Rodar no projeto `MeuProjeto2`
```bash
node /home/vitorgabriel/dev/vitor/linkedin-dev-logger/dist/index.js -d /home/vitorgabriel/dev/vitor/MeuProjeto2
```

---

## ⚡ 2. Atalho Rápido (Alias no Linux)

Para não precisar digitar o caminho completo toda vez, você pode criar um atalho no seu terminal:

1. Abra o arquivo de configuração do seu terminal:
   ```bash
   nano ~/.bashrc
   ```
2. Adicione esta linha no final do arquivo:
   ```bash
   alias linkedin-logger="node /home/vitorgabriel/dev/vitor/linkedin-dev-logger/dist/index.js"
   ```
3. Salve e recarregue o terminal:
   ```bash
   source ~/.bashrc
   ```

### Como usar o atalho:
Agora você pode entrar em qualquer pasta de projeto e rodar diretamente:
```bash
cd /home/vitorgabriel/dev/vitor/MeuProjeto1
linkedin-logger
```

---

## 🔄 3. Rodar na Pasta Própria do Gerador

Se preferir rodar dentro da pasta da própria ferramenta:

```bash
cd /home/vitorgabriel/dev/vitor/linkedin-dev-logger
npm start
```

---

## 🛡️ 4. Adicionar Novas Palavras Proibidas (Anonimização)

Se você começar a trabalhar em um novo cliente ou empresa e quiser garantir que o nome da marca seja 100% omitido dos posts:

1. Abra o arquivo `config.json`:
   ```bash
   nano /home/vitorgabriel/dev/vitor/linkedin-dev-logger/config.json
   ```
2. Adicione a palavra na lista `forbiddenWords`:
   ```json
   {
     "privacy": {
       "forbiddenWords": [
         "EmpresaExemplo1",
         "EmpresaExemplo2",
         "NovoCliente",
         "MarcaSecreta"
       ]
     }
   }
   ```

---

## 💾 5. Onde os Posts Ficam Salvos?

Toda vez que você seleciona a opção **"💾 Salvar localmente em Markdown"**, o post é gravado com data e hora na pasta:

`file:///home/vitorgabriel/dev/vitor/linkedin-dev-logger/.posts/`

Exemplo de arquivo gerado:
`post_sistema-backend_2026-07-31_12-24.md`

---

## 🚀 6. Fluxo de Publicação Direta no LinkedIn

Quando a prévia do post aparecer na tela, você verá o menu interativo:

```text
? O que deseja fazer com este post?
  💾 Salvar localmente em Markdown (.posts/)
  🔄 Regenerar / Pedir ajustes para a IA
❯ 🚀 Publicar no LinkedIn (Fase 6 - API)
  ❌ Sair
```

Ao selecionar **"🚀 Publicar no LinkedIn"**, o post é enviado e publicado imediatamente na sua conta do LinkedIn!
