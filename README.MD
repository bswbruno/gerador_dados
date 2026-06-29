# Gerador de Dados de Teste

Extensão para navegador baseada em Manifest V3, desenvolvida para ajudar em testes, homologações e preenchimento rápido de campos com dados fictícios válidos. Ela gera CPF, CNS, nomes e textos aleatórios, além de oferecer recursos de cópia, preenchimento automático em campos de formulário e contagem de caracteres.

## 📌 O que a extensão faz

A extensão foi criada para facilitar a vida de quem precisa:

- gerar dados sintéticos para testes de sistemas;
- preencher campos de formulário rapidamente;
- copiar valores para colar em outros contextos;
- validar limites de campos com contagem de caracteres e palavras;
- manter um histórico dos dados gerados recentemente.

## ✨ Funcionalidades

- Geração de CPF com ou sem formatação.
- Geração de CNS válido.
- Geração de nomes fictícios com opções de prefixo e formatação.
- Geração de texto aleatório por tema.
- Preenchimento automático em campos de formulário.
- Copiar valores diretamente para a área de transferência.
- Histórico de dados gerados.
- Contador de caracteres, palavras, linhas e espaços.
- Suporte a atalhos de teclado e menus de contexto.
- Tema claro/escuro.

## 🧩 Requisitos

A extensão funciona em navegadores baseados em Chromium, como:

- Google Chrome
- Microsoft Edge
- Brave
- Opera

## 🚀 Instalação

1. Clone este repositório:

   ```bash
   git clone https://github.com/seu-usuario/gerador_dados.git
   ```

2. Acesse a página de extensões do seu navegador:

   - Chrome/Edge: `chrome://extensions` ou `edge://extensions`

3. Ative o modo de desenvolvedor.

4. Clique em “Carregar sem compactação” ou “Load unpacked”.

5. Selecione a pasta `extensao` do projeto.

A extensão será instalada e disponível na barra de ferramentas do navegador.

## 🛠️ Como usar

### Via popup da extensão

- Abra a extensão pelo ícone na barra de ferramentas.
- Clique em um dos botões para gerar um dado.
- Use os botões “Copiar” ou “Preencher campo” para interagir com a página aberta.

### Atalhos de teclado

- `Alt + Shift + C` → gerar CPF e preencher o campo ativo
- `Alt + Shift + S` → gerar CNS e preencher o campo ativo

### Menus de contexto

Ao clicar com o botão direito em campos editáveis ou em texto selecionado, a extensão também disponibiliza ações para:

- preencher CPF, CNS ou nome;
- copiar dados gerados;
- contar caracteres da seleção.

## ⚙️ Configurações disponíveis

No popup da extensão você pode ajustar:

- formato do CPF (com ou sem máscara);
- prefixo “TESTE” nos nomes gerados;
- nome em maiúsculas ou em formato título;
- contagem automática de seleção;
- exibição do limite de caracteres (`maxlength`);
- métricas de contagem (com espaços, sem espaços, palavras, linhas, etc.).

## 📁 Estrutura do projeto

```text
gerador_dados/
├── LICENSE
├── README.MD
├── politica_de_privacidade.html
├── extensao/
│   ├── background.js
│   ├── content.js
│   ├── manifest.json
│   ├── popup.css
│   ├── popup.html
│   ├── popup.js
│   ├── generators/
│   │   ├── cns.js
│   │   ├── cpf.js
│   │   ├── nome.js
│   │   └── texto.js
│   ├── icons/
│   └── utils/
│       └── contagem.js
```

## 🔧 Desenvolvimento

Se quiser contribuir ou personalizar a extensão:

- edite os geradores em `extensao/generators/`;
- ajuste a interface em `extensao/popup.html`, `extensao/popup.css` e `extensao/popup.js`;
- altere o comportamento da página em `extensao/content.js` e `extensao/background.js`.

Depois de modificar os arquivos, recarregue a extensão no navegador para ver as mudanças.

## 🔒 Privacidade

Esta extensão:

- armazena dados localmente no navegador;
- não envia informações para servidores externos;
- usa armazenamento local apenas para histórico e preferências da interface.

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.

## ❤️ Agradecimentos

Obrigado por usar ou contribuir com este projeto. Se quiser, você pode adaptar os geradores para outros cenários de teste, como e-mails, telefones, CEPs ou documentos adicionais.
