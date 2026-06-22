/**
 * popup.js — Lógica do popup. Script clássico (sem ES modules).
 */

(function () {
  "use strict";

  // TODO: troque pela sua chave PIX real (CPF, e-mail, telefone ou chave aleatória)
  const PIX_KEY = "6abc8f01-362f-4959-9046-189a0394ab83";

  let valorAtual = null;
  let tipoAtual = null;

  // ─── Init ─────────────────────────────────────────────────────────────────

  document.addEventListener("DOMContentLoaded", async () => {
    await aplicarTema();
    await carregarConfig();
    await renderHistorico();
    bindEventos();

    // Contador de caracteres
    bindContagemEventos();
    await carregarConfigContagem();
    await buscarSelecaoDaPagina(true); // silencioso: só preenche se já houver seleção
  });

  // ─── Eventos ──────────────────────────────────────────────────────────────

  function bindEventos() {
    document.getElementById("btn-gerar-cpf").addEventListener("click", () => gerar("cpf"));
    document.getElementById("btn-gerar-cns").addEventListener("click", () => gerar("cns"));
    document.getElementById("btn-gerar-nome").addEventListener("click", () => gerar("nome"));
    document.getElementById("btn-gerar-texto").addEventListener("click", gerarTexto);
    document.getElementById("btn-doar").addEventListener("click", abrirModalPix);
    document.getElementById("btn-copiar-pix").addEventListener("click", copiarChavePix);
    document.getElementById("pix-fechar").addEventListener("click", fecharModalPix);
    document.getElementById("pix-overlay").addEventListener("click", (e) => {
      if (e.target.id === "pix-overlay") fecharModalPix(); // clique fora do card fecha
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !document.getElementById("pix-overlay").hidden) fecharModalPix();
    });
    document.getElementById("btn-copiar").addEventListener("click", copiar);
    document.getElementById("btn-preencher").addEventListener("click", preencher);
    document.getElementById("result-valor").addEventListener("click", copiar);
    document.getElementById("chk-formato").addEventListener("change", async (e) => {
      await salvarConfig({ cpfFormatado: e.target.checked });
    });
    document.getElementById("chk-nome-prefixo").addEventListener("change", async (e) => {
      await salvarConfig({ nomePrefixoTeste: e.target.checked });
    });
    document.getElementById("chk-nome-maiusculo").addEventListener("change", async (e) => {
      await salvarConfig({ nomeMaiusculo: e.target.checked });
    });
    document.getElementById("btn-tema").addEventListener("click", toggleTema);
    document.getElementById("btn-limpar").addEventListener("click", limparHistorico);
  }

  // ─── Geração ──────────────────────────────────────────────────────────────

  async function gerar(tipo) {
    const acaoMap = { cpf: "gerar-cpf", cns: "gerar-cns", nome: "gerar-nome" };
    const acao = acaoMap[tipo];
    try {
      const res = await chrome.runtime.sendMessage({ acao });
      if (!res || res.erro) throw new Error(res?.erro || "Erro desconhecido");

      valorAtual = res.valor;
      tipoAtual = tipo.toUpperCase();

      await chrome.runtime.sendMessage({
        acao: "salvar-historico",
        item: { tipo: tipoAtual, valor: valorAtual },
      });

      mostrarResultado(tipoAtual, valorAtual);
      await renderHistorico();
    } catch (e) {
      mostrarErro("Erro ao gerar. Tente novamente.");
    }
  }

  // ─── Geração de texto aleatório por tema ───────────────────────────────────

  async function gerarTexto() {
    const tema = document.getElementById("sel-texto-tema").value;
    const tamanhoCampo = document.getElementById("input-texto-tamanho");
    const tamanhoRaw = parseInt(tamanhoCampo.value, 10);
    const tamanho = Number.isFinite(tamanhoRaw) && tamanhoRaw > 0 ? Math.min(tamanhoRaw, 20000) : 100;
    tamanhoCampo.value = tamanho;

    try {
      const res = await chrome.runtime.sendMessage({ acao: "gerar-texto", tema, tamanho });
      if (!res || res.erro) throw new Error(res?.erro || "Erro desconhecido");

      valorAtual = res.valor;
      tipoAtual = "TEXTO";

      await chrome.runtime.sendMessage({
        acao: "salvar-historico",
        item: { tipo: tipoAtual, valor: valorAtual },
      });

      mostrarResultado(tipoAtual, valorAtual);
      await renderHistorico();
    } catch (e) {
      mostrarErro("Erro ao gerar texto. Tente novamente.");
    }
  }

  // ─── UI Resultado ─────────────────────────────────────────────────────────

  function mostrarResultado(tipo, valor) {
    document.getElementById("result-placeholder").style.display = "none";
    document.getElementById("result-content").style.display = "flex";
    document.getElementById("result-tipo").textContent = tipo;
    document.getElementById("result-valor").textContent = valor;
    document.getElementById("result-area").classList.add("ativo");
  }

  function mostrarErro(msg) {
    const el = document.getElementById("result-valor");
    el.textContent = msg;
    el.style.fontSize = "11px";
    el.style.color = "#ef4444";
  }

  // ─── Copiar ───────────────────────────────────────────────────────────────

  async function copiar() {
    if (!valorAtual) return;
    try {
      await navigator.clipboard.writeText(valorAtual);
      feedback("btn-copiar", "✓ Copiado!");
    } catch (_) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && !urlRestrita(tab.url)) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (v) => navigator.clipboard.writeText(v).catch(() => {}),
            args: [valorAtual],
          });
        }
        feedback("btn-copiar", "✓ Copiado!");
      } catch (_2) {
        feedback("btn-copiar", "⚠ Erro ao copiar");
      }
    }
  }

  // ─── Rodapé: modal de doação via Pix (QR Code + chave) ─────────────────────

  function abrirModalPix() {
    const overlay = document.getElementById("pix-overlay");
    const chaveEl = document.getElementById("pix-chave-texto");
    const img = document.getElementById("pix-qrcode-img");
    const placeholder = document.getElementById("pix-qrcode-placeholder");

    chaveEl.textContent = PIX_KEY;

    // Se a imagem do QR Code não existir ainda (icons/qrcode-pix.png), mostra um aviso
    // em vez de deixar o ícone de imagem quebrada.
    img.style.display = "block";
    placeholder.style.display = "none";
    img.onerror = () => {
      img.style.display = "none";
      placeholder.style.display = "block";
    };

    overlay.hidden = false;
  }

  function fecharModalPix() {
    document.getElementById("pix-overlay").hidden = true;
  }

  async function copiarChavePix() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      feedback("btn-copiar-pix", "✓ Copiado!");
    } catch (_) {
      feedback("btn-copiar-pix", "⚠ Erro ao copiar");
    }
  }

  // ─── Preencher ────────────────────────────────────────────────────────────

  function urlRestrita(url) {
    if (!url) return true;
    return (
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("edge://") ||
      url.startsWith("brave://") ||
      url.startsWith("opera://") ||
      url.startsWith("about:") ||
      url.startsWith("data:")
    );
  }

  async function preencher() {
    if (!valorAtual) return;

    let tab;
    try {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    } catch (_) {}

    if (!tab) {
      feedback("btn-preencher", "⚠ Sem aba ativa");
      return;
    }

    if (urlRestrita(tab.url)) {
      feedback("btn-preencher", "⚠ Abra um site primeiro");
      return;
    }

    let results;
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function (valor, tipo) {
          let el = document.activeElement;
          if (!el || !["INPUT", "TEXTAREA"].includes(el.tagName)) {
            el = window.__GDT_LAST_FIELD__ || null;
          }

          if (!el || !["INPUT", "TEXTAREA"].includes(el.tagName)) {
            return { ok: false, erro: "Nenhum campo focado" };
          }

          const proto =
            el.tagName === "TEXTAREA"
              ? HTMLTextAreaElement.prototype
              : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
          setter ? setter.call(el, valor) : (el.value = valor);

          ["input", "change", "blur"].forEach((t) =>
            el.dispatchEvent(new Event(t, { bubbles: true, cancelable: true }))
          );
          el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
          el.focus();

          (function toast(msg) {
            const old = document.getElementById("__gdt_toast__");
            if (old) old.remove();
            const div = document.createElement("div");
            div.id = "__gdt_toast__";
            Object.assign(div.style, {
              position: "fixed", bottom: "24px", right: "24px",
              zIndex: "2147483647", background: "#22c55e", color: "#fff",
              padding: "11px 16px", borderRadius: "10px", fontSize: "13px",
              fontFamily: "'Segoe UI',system-ui,sans-serif", fontWeight: "600",
              boxShadow: "0 4px 20px rgba(0,0,0,.25)",
              display: "flex", alignItems: "center", gap: "8px",
              opacity: "0", transform: "translateY(8px)",
              transition: "opacity .25s ease,transform .25s ease",
              pointerEvents: "none",
            });
            div.innerHTML = '<span style="font-size:15px">✓</span><span>' + msg + "</span>";
            document.body.appendChild(div);
            requestAnimationFrame(() => requestAnimationFrame(() => {
              div.style.opacity = "1";
              div.style.transform = "translateY(0)";
            }));
            setTimeout(() => {
              div.style.opacity = "0";
              div.style.transform = "translateY(8px)";
              setTimeout(() => div.remove(), 300);
            }, 3000);
          })(tipo + " preenchido!");

          return { ok: true };
        },
        args: [valorAtual, tipoAtual],
      });
    } catch (_) {
      feedback("btn-preencher", "⚠ Abra um site primeiro");
      return;
    }

    const res = results?.[0]?.result;
    if (res?.ok) {
      feedback("btn-preencher", "✓ Preenchido!");
    } else {
      feedback("btn-preencher", "⚠ " + (res?.erro || "Sem campo focado"));
    }
  }

  // ─── Feedback visual ──────────────────────────────────────────────────────

  function feedback(id, texto) {
    const btn = document.getElementById(id);
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.textContent = texto;
    btn.classList.add("ok");
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.classList.remove("ok");
    }, 2000);
  }

  // ─── Histórico ────────────────────────────────────────────────────────────

  async function renderHistorico() {
    const { historico = [] } = await chrome.storage.local.get("historico");
    const lista = document.getElementById("hist-list");
    const vazio = document.getElementById("hist-empty");

    lista.querySelectorAll(".hist-item").forEach((el) => el.remove());

    if (historico.length === 0) {
      vazio.style.display = "block";
      return;
    }
    vazio.style.display = "none";

    historico.forEach((item) => {
      const li = document.createElement("li");
      li.className = "hist-item";
      li.title = "Clique para copiar";

      const hora = fmtHora(item.timestamp);
      const cls = item.tipo.toLowerCase();

      li.innerHTML =
        '<span class="hist-chip ' + cls + '">' + item.tipo + "</span>" +
        '<span class="hist-val">' + item.valor + "</span>" +
        '<span class="hist-hora">' + hora + "</span>";

      li.addEventListener("click", async () => {
        await navigator.clipboard.writeText(item.valor).catch(() => {});
        const v = li.querySelector(".hist-val");
        const orig = v.textContent;
        v.textContent = "✓ Copiado!";
        v.style.color = "var(--green)";
        setTimeout(() => { v.textContent = orig; v.style.color = ""; }, 1200);
      });

      lista.appendChild(li);
    });
  }

  async function limparHistorico() {
    await chrome.storage.local.set({ historico: [] });
    await renderHistorico();
  }

  function fmtHora(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  // ─── Tema ─────────────────────────────────────────────────────────────────

  async function aplicarTema() {
    const { config = {} } = await chrome.storage.local.get("config");
    setTema(config.tema || "auto");
  }

  function setTema(tema) {
    const html = document.documentElement;
    const lua = document.getElementById("icon-lua");
    const sol = document.getElementById("icon-sol");
    const escuro =
      tema === "escuro" ||
      (tema === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (escuro) {
      html.setAttribute("data-tema", "escuro");
      lua.style.display = "none";
      sol.style.display = "block";
    } else {
      html.removeAttribute("data-tema");
      lua.style.display = "block";
      sol.style.display = "none";
    }
  }

  async function toggleTema() {
    const { config = {} } = await chrome.storage.local.get("config");
    const atual = config.tema || "auto";
    const proximo = atual === "auto" ? "escuro" : atual === "escuro" ? "claro" : "auto";
    await salvarConfig({ tema: proximo });
    setTema(proximo);
  }

  // ─── Contador de Caracteres ───────────────────────────────────────────────

  function bindContagemEventos() {
    document.getElementById("contagem-input").addEventListener("input", renderContagem);
    document.getElementById("btn-usar-selecao").addEventListener("click", () => buscarSelecaoDaPagina(false));

    document.getElementById("chk-contagem-auto").addEventListener("change", async (e) => {
      await salvarConfig({ contagemAutomatica: e.target.checked });
    });

    document.getElementById("chk-limite-campo").addEventListener("change", async (e) => {
      await salvarConfig({ mostrarLimiteCampo: e.target.checked });
    });

    GDT_CONTAGEM.ORDEM.forEach((chave) => {
      document.getElementById("chk-m-" + chave).addEventListener("change", async (e) => {
        const { config = {} } = await chrome.storage.local.get("config");
        const metricas = Object.assign({}, config.metricas, { [chave]: e.target.checked });
        await salvarConfig({ metricas });
        renderContagem();
      });
    });
  }

  async function carregarConfigContagem() {
    const { config = {} } = await chrome.storage.local.get("config");
    document.getElementById("chk-contagem-auto").checked = config.contagemAutomatica !== false;
    document.getElementById("chk-limite-campo").checked = config.mostrarLimiteCampo !== false;

    const metricas = Object.assign({}, GDT_CONTAGEM.METRICAS_PADRAO, config.metricas || {});
    GDT_CONTAGEM.ORDEM.forEach((chave) => {
      const chk = document.getElementById("chk-m-" + chave);
      if (chk) chk.checked = metricas[chave] !== false;
    });
  }

  async function renderContagem() {
    const texto = document.getElementById("contagem-input").value;
    const area = document.getElementById("contagem-resultado");

    if (!texto) {
      area.innerHTML = '<span class="contagem-vazio">Nenhum texto para contar ainda</span>';
      return;
    }

    const contagem = GDT_CONTAGEM.contar(texto);
    const { config = {} } = await chrome.storage.local.get("config");
    const metricas = Object.assign({}, GDT_CONTAGEM.METRICAS_PADRAO, config.metricas || {});

    const chips = GDT_CONTAGEM.ORDEM.filter((chave) => metricas[chave] !== false)
      .map(
        (chave) =>
          '<div class="contagem-chip"><span>' +
          GDT_CONTAGEM.LABELS[chave] +
          "</span><strong>" +
          contagem[chave] +
          "</strong></div>"
      )
      .join("");

    area.innerHTML = chips || '<span class="contagem-vazio">Nenhuma métrica ativada nas configurações</span>';
  }

  async function buscarSelecaoDaPagina(silencioso) {
    let tab;
    try {
      [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    } catch (_) {}

    if (!tab || urlRestrita(tab.url)) {
      if (!silencioso) feedback("btn-usar-selecao", "⚠ Indisponível aqui");
      return;
    }

    let results;
    try {
      results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function () {
          const ativo = document.activeElement;
          if (ativo && ["INPUT", "TEXTAREA"].includes(ativo.tagName)) {
            const ini = ativo.selectionStart;
            const fim = ativo.selectionEnd;
            if (ini != null && fim != null && fim > ini) return ativo.value.slice(ini, fim);
          }
          const sel = window.getSelection();
          return sel ? sel.toString() : "";
        },
      });
    } catch (_) {
      if (!silencioso) feedback("btn-usar-selecao", "⚠ Erro ao buscar");
      return;
    }

    const texto = results?.[0]?.result || "";
    if (!texto) {
      if (!silencioso) feedback("btn-usar-selecao", "⚠ Nada selecionado");
      return;
    }

    document.getElementById("contagem-input").value = texto;
    await renderContagem();
  }

  // ─── Config ───────────────────────────────────────────────────────────────

  async function carregarConfig() {
    const { config = {} } = await chrome.storage.local.get("config");
    document.getElementById("chk-formato").checked = config.cpfFormatado !== false;
    document.getElementById("chk-nome-prefixo").checked = config.nomePrefixoTeste !== false;
    document.getElementById("chk-nome-maiusculo").checked = config.nomeMaiusculo !== false;
  }

  async function salvarConfig(parcial) {
    const { config = {} } = await chrome.storage.local.get("config");
    await chrome.storage.local.set({ config: Object.assign({}, config, parcial) });
  }

})();
