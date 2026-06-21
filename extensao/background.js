/**
 * background.js — Service Worker (Manifest V3)
 * Sem ES modules: usa importScripts para carregar os generators.
 */

importScripts("utils/contagem.js", "generators/cpf.js", "generators/cns.js", "generators/nome.js", "generators/texto.js");

// ─── Instalação ───────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  await criarMenus();
  await inicializarStorage();
});

chrome.runtime.onStartup.addListener(criarMenus);

// ─── Menus de Contexto ────────────────────────────────────────────────────────

async function criarMenus() {
  await chrome.contextMenus.removeAll();

  chrome.contextMenus.create({
    id: "preencher-cpf",
    title: "Preencher CPF de teste",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "preencher-cns",
    title: "Preencher CNS de teste",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "preencher-nome",
    title: "Preencher Nome de teste",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "sep1",
    type: "separator",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "contar-selecao",
    title: "Contar caracteres da seleção",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "copiar-cpf",
    title: "Copiar CPF de teste",
    contexts: ["editable", "page"],
  });

  chrome.contextMenus.create({
    id: "copiar-cns",
    title: "Copiar CNS de teste",
    contexts: ["editable", "page"],
  });

  chrome.contextMenus.create({
    id: "copiar-nome",
    title: "Copiar Nome de teste",
    contexts: ["editable", "page"],
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const config = await getConfig();
  const fmt = config.cpfFormatado !== false;

  switch (info.menuItemId) {
    case "preencher-cpf": {
      const cpf = GDT_CPF.gerar(fmt);
      const r = await injectFill(tab.id, cpf);
      if (r.ok) {
        await addHistorico({ tipo: "CPF", valor: cpf });
        await injectToast(tab.id, `CPF preenchido: ${cpf}`);
      } else {
        await injectToast(tab.id, "Clique em um campo de texto antes de usar o menu", "erro");
      }
      break;
    }
    case "preencher-cns": {
      const cns = GDT_CNS.gerar();
      const r = await injectFill(tab.id, cns);
      if (r.ok) {
        await addHistorico({ tipo: "CNS", valor: cns });
        await injectToast(tab.id, `CNS preenchido: ${cns}`);
      } else {
        await injectToast(tab.id, "Clique em um campo de texto antes de usar o menu", "erro");
      }
      break;
    }
    case "preencher-nome": {
      const nome = GDT_NOME.gerar(config.nomePrefixoTeste !== false, config.nomeMaiusculo !== false);
      const r = await injectFill(tab.id, nome);
      if (r.ok) {
        await addHistorico({ tipo: "NOME", valor: nome });
        await injectToast(tab.id, `Nome preenchido: ${nome}`);
      } else {
        await injectToast(tab.id, "Clique em um campo de texto antes de usar o menu", "erro");
      }
      break;
    }
    case "contar-selecao": {
      await injectContagem(tab.id, info.selectionText || "");
      break;
    }
    case "copiar-cpf": {
      const cpf = GDT_CPF.gerar(fmt);
      await addHistorico({ tipo: "CPF", valor: cpf });
      await injectCopy(tab.id, cpf);
      await injectToast(tab.id, `CPF copiado: ${cpf}`);
      break;
    }
    case "copiar-cns": {
      const cns = GDT_CNS.gerar();
      await addHistorico({ tipo: "CNS", valor: cns });
      await injectCopy(tab.id, cns);
      await injectToast(tab.id, `CNS copiado: ${cns}`);
      break;
    }
    case "copiar-nome": {
      const nome = GDT_NOME.gerar(config.nomePrefixoTeste !== false, config.nomeMaiusculo !== false);
      await addHistorico({ tipo: "NOME", valor: nome });
      await injectCopy(tab.id, nome);
      await injectToast(tab.id, `Nome copiado: ${nome}`);
      break;
    }
  }
});

// ─── Atalhos de Teclado ───────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command, tab) => {
  const config = await getConfig();
  const fmt = config.cpfFormatado !== false;

  if (command === "gerar-cpf") {
    const cpf = GDT_CPF.gerar(fmt);
    const r = await injectFill(tab.id, cpf);
    if (r.ok) {
      await addHistorico({ tipo: "CPF", valor: cpf });
      await injectToast(tab.id, `CPF gerado: ${cpf}`);
    } else {
      await injectToast(tab.id, "Clique em um campo de texto antes de usar o atalho", "erro");
    }
  }

  if (command === "gerar-cns") {
    const cns = GDT_CNS.gerar();
    const r = await injectFill(tab.id, cns);
    if (r.ok) {
      await addHistorico({ tipo: "CNS", valor: cns });
      await injectToast(tab.id, `CNS gerado: ${cns}`);
    } else {
      await injectToast(tab.id, "Clique em um campo de texto antes de usar o atalho", "erro");
    }
  }
});

// ─── Mensagens do Popup ───────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMsg(msg).then(sendResponse).catch((e) => sendResponse({ erro: e.message }));
  return true;
});

async function handleMsg(msg) {
  const config = await getConfig();
  const fmt = config.cpfFormatado !== false;

  switch (msg.acao) {
    case "gerar-cpf":
      return { valor: GDT_CPF.gerar(fmt) };

    case "gerar-cns":
      return { valor: GDT_CNS.gerar() };

    case "gerar-nome":
      return { valor: GDT_NOME.gerar(config.nomePrefixoTeste !== false, config.nomeMaiusculo !== false) };

    case "gerar-texto":
      return { valor: GDT_TEXTO.gerar(msg.tema, msg.tamanho) };

    case "salvar-historico":
      await addHistorico(msg.item);
      return { ok: true };

    case "preencher-campo": {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return { ok: false, erro: "Nenhuma aba ativa" };
      return await injectFill(tab.id, msg.valor);
    }

    default:
      return { erro: "Ação desconhecida" };
  }
}

// ─── Helpers de Injeção ───────────────────────────────────────────────────────

async function injectFill(tabId, valor) {
  try {
    const resultados = await chrome.scripting.executeScript({
      target: { tabId },
      func: (val) => {
        // Tenta o campo focado; se não houver, cai para o último campo
        // memorizado pelo content.js (cobre o caso do clique direito
        // não manter o foco, comum em vários sites)
        let el = document.activeElement;
        if (!el || !["INPUT", "TEXTAREA"].includes(el.tagName)) {
          el = window.__GDT_LAST_FIELD__ || null;
        }
        if (!el || !["INPUT", "TEXTAREA"].includes(el.tagName)) {
          return { ok: false, erro: "Nenhum campo de texto focado" };
        }
        const proto =
          el.tagName === "TEXTAREA"
            ? HTMLTextAreaElement.prototype
            : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
        setter ? setter.call(el, val) : (el.value = val);
        ["input", "change", "blur"].forEach((t) =>
          el.dispatchEvent(new Event(t, { bubbles: true }))
        );
        el.focus();
        return { ok: true };
      },
      args: [valor],
    });
    return resultados?.[0]?.result || { ok: false, erro: "Sem resposta da página" };
  } catch (e) {
    console.warn("injectFill falhou:", e.message);
    return { ok: false, erro: e.message };
  }
}

async function injectCopy(tabId, texto) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (val) => navigator.clipboard.writeText(val).catch(() => {}),
      args: [texto],
    });
  } catch (e) {
    console.warn("injectCopy falhou:", e.message);
  }
}

async function injectToast(tabId, mensagem, tipo) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (msg, tp) => {
        window.dispatchEvent(new CustomEvent("gdt:toast", { detail: { mensagem: msg, tipo: tp } }));
      },
      args: [mensagem, tipo || "sucesso"],
    });
  } catch (e) {
    console.warn("injectToast falhou:", e.message);
  }
}

async function injectContagem(tabId, texto) {
  try {
    await chrome.tabs.sendMessage(tabId, { acao: "mostrar-contagem", texto });
  } catch (e) {
    console.warn("injectContagem falhou:", e.message);
  }
}

// ─── Storage ──────────────────────────────────────────────────────────────────

async function addHistorico(item) {
  const { historico = [] } = await chrome.storage.local.get("historico");
  const atualizado = [{ ...item, timestamp: Date.now() }, ...historico].slice(0, 10);
  await chrome.storage.local.set({ historico: atualizado });
}

async function getConfig() {
  const { config = {} } = await chrome.storage.local.get("config");
  return config;
}

async function inicializarStorage() {
  const dados = await chrome.storage.local.get(["historico", "config"]);
  if (!dados.historico) await chrome.storage.local.set({ historico: [] });
  if (!dados.config)
    await chrome.storage.local.set({
      config: {
        cpfFormatado: true,
        tema: "auto",
        nomePrefixoTeste: true,
        nomeMaiusculo: true,
        contagemAutomatica: true,
        mostrarLimiteCampo: true,
        metricas: Object.assign({}, GDT_CONTAGEM.METRICAS_PADRAO),
      },
    });
}
