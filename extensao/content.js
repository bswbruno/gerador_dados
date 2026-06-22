/**
 * content.js
 * Injetado em todas as páginas. Sem ES modules.
 *
 * FIX PRINCIPAL: memoriza o último campo focado em `window.__GDT_LAST_FIELD__`
 * para que o popup possa preencher mesmo após perder o foco para si mesmo.
 */

(function () {
  "use strict";

  if (window.__GDT_LOADED__) return;
  window.__GDT_LOADED__ = true;

  // Último campo que recebeu foco — persiste mesmo após o popup abrir
  window.__GDT_LAST_FIELD__ = null;

  // ─── Config de contagem em cache (evita storage.get a cada seleção) ──────

  let configCache = {
    contagemAutomatica: true,
    mostrarLimiteCampo: true,
    metricas: Object.assign({}, GDT_CONTAGEM.METRICAS_PADRAO),
  };

  chrome.storage.local.get("config", ({ config }) => {
    if (!config) return;
    configCache.contagemAutomatica = config.contagemAutomatica !== false;
    configCache.mostrarLimiteCampo = config.mostrarLimiteCampo !== false;
    configCache.metricas = Object.assign({}, configCache.metricas, config.metricas || {});
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.config) return;
    const novo = changes.config.newValue || {};
    configCache.contagemAutomatica = novo.contagemAutomatica !== false;
    configCache.mostrarLimiteCampo = novo.mostrarLimiteCampo !== false;
    configCache.metricas = Object.assign({}, configCache.metricas, novo.metricas || {});
  });

  // ─── Painel flutuante de contagem ───────────────────────────────────────

  let painelContagem = null;
  let debounceSelecao = null;
  let painelSuprimido = false;
  let ultimoTextoPainel = null;
  let timeoutAutoOcultar = null;
  let painelModoSelecao = false; // true = mostrando contagem de seleção | false = mostrando limite de campo

  // Agenda o fechamento automático do painel em 10s (reinicia a cada exibição/atualização)
  function agendarAutoOcultar() {
    clearTimeout(timeoutAutoOcultar);
    timeoutAutoOcultar = setTimeout(ocultarPainel, 10000);
  }

  function montarPainel() {
    if (painelContagem && document.body.contains(painelContagem)) return painelContagem;

    const div = document.createElement("div");
    div.id = "__gdt_contagem_painel__";
    Object.assign(div.style, {
      position: "fixed",
      zIndex: "2147483647",
      background: "#1e293b",
      color: "#f1f5f9",
      borderRadius: "10px",
      padding: "10px 12px",
      fontSize: "12px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
      display: "none",
      minWidth: "170px",
      maxWidth: "260px",
      lineHeight: "1.55",
      wordBreak: "break-word",
      pointerEvents: "none", // não bloqueia clique na página por baixo
    });

    // ─── Botão de fechar/diminuir o balão ───────────────────────────────
    const botaoFechar = document.createElement("button");
    botaoFechar.type = "button";
    botaoFechar.className = "gdt-painel-fechar";
    botaoFechar.setAttribute("aria-label", "Fechar contagem");
    botaoFechar.textContent = "×";
    Object.assign(botaoFechar.style, {
      position: "absolute",
      top: "4px",
      right: "6px",
      width: "16px",
      height: "16px",
      lineHeight: "14px",
      textAlign: "center",
      background: "transparent",
      border: "none",
      color: "#94a3b8",
      fontSize: "15px",
      fontWeight: "700",
      cursor: "pointer",
      padding: "0",
      pointerEvents: "auto", // este sim precisa receber clique
    });
    botaoFechar.addEventListener("mouseenter", function () {
      botaoFechar.style.color = "#f1f5f9";
    });
    botaoFechar.addEventListener("mouseleave", function () {
      botaoFechar.style.color = "#94a3b8";
    });
    botaoFechar.addEventListener("click", function (e) {
      e.stopPropagation();
      painelSuprimido = true;
      ocultarPainel();
    });
    div.appendChild(botaoFechar);

    // Container do conteúdo (separado do botão de fechar)
    const conteudo = document.createElement("div");
    conteudo.id = "__gdt_contagem_conteudo__";
    conteudo.style.paddingRight = "14px";
    div.appendChild(conteudo);

    document.body.appendChild(div);
    painelContagem = div;
    return div;
  }

  function obterConteudoPainel() {
    return document.getElementById("__gdt_contagem_conteudo__");
  }

  function ocultarPainel() {
    if (painelContagem) painelContagem.style.display = "none";
    clearTimeout(timeoutAutoOcultar);
  }

  function renderLinhasPainel(contagem) {
    const metricas = configCache.metricas || {};
    const linhas = [];
    GDT_CONTAGEM.ORDEM.forEach(function (chave) {
      if (metricas[chave] === false) return;
      linhas.push(
        '<div style="display:flex;justify-content:space-between;gap:16px;">' +
          '<span style="opacity:.7">' + GDT_CONTAGEM.LABELS[chave] + "</span>" +
          "<strong>" + contagem[chave] + "</strong>" +
        "</div>"
      );
    });
    return linhas.length
      ? linhas.join("")
      : '<span style="opacity:.7">Nenhuma métrica ativada</span>';
  }

  function posicionarPainel(painel, rect) {
    const margem = 8;
    let top = rect.bottom + margem;
    let left = rect.left;

    const altura = painel.offsetHeight || 110;
    const largura = painel.offsetWidth || 180;

    if (top + altura > window.innerHeight) top = rect.top - altura - margem;
    if (top < margem) top = margem;
    if (left + largura > window.innerWidth) left = window.innerWidth - largura - margem;
    if (left < margem) left = margem;

    painel.style.top = top + "px";
    painel.style.left = left + "px";
  }

  function exibirContagemFlutuante(texto, rect) {
    if (!texto || texto.length === 0) {
      ocultarPainel();
      painelSuprimido = false;
      ultimoTextoPainel = null;
      return;
    }

    // Se o texto da seleção mudou, qualquer fechamento manual anterior deixa de valer
    if (texto !== ultimoTextoPainel) {
      painelSuprimido = false;
      ultimoTextoPainel = texto;
    }
    if (painelSuprimido) return;

    const contagem = GDT_CONTAGEM.contar(texto);
    const painel = montarPainel();
    pararEscutaInputCampo(); // este conteúdo é de seleção, não de campo — evita conflito
    painelModoSelecao = true;
    obterConteudoPainel().innerHTML = renderLinhasPainel(contagem);
    painel.style.display = "block";
    posicionarPainel(painel, rect);
    agendarAutoOcultar();
  }

  // ─── Detecção de seleção (campo de formulário ou texto solto da página) ──

  function obterSelecaoAtual() {
    const ativo = document.activeElement;

    if (ativo && ["INPUT", "TEXTAREA"].includes(ativo.tagName)) {
      const ini = ativo.selectionStart;
      const fim = ativo.selectionEnd;
      if (ini != null && fim != null && fim > ini) {
        return { texto: ativo.value.slice(ini, fim), rect: ativo.getBoundingClientRect() };
      }
      return null;
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const texto = sel.toString();
      if (!texto) return null;
      return { texto: texto, rect: sel.getRangeAt(0).getBoundingClientRect() };
    }

    return null;
  }

  function tratarSelecao() {
    if (!configCache.contagemAutomatica) {
      ocultarPainel();
      return;
    }
    const dados = obterSelecaoAtual();
    if (!dados) {
      if (painelModoSelecao) ocultarPainel(); // só esconde se era contagem de seleção
      return;
    }
    exibirContagemFlutuante(dados.texto, dados.rect);
  }

  function agendarTratarSelecao() {
    clearTimeout(debounceSelecao);
    debounceSelecao = setTimeout(tratarSelecao, 130);
  }

  document.addEventListener("selectionchange", agendarTratarSelecao);

  // Reforço: o "selectionchange" nem sempre é confiável para seleção feita
  // DENTRO de <input>/<textarea> (inconsistência conhecida entre navegadores).
  // "select" é o evento nativo desses campos para exatamente esse caso.
  document.addEventListener(
    "select",
    function (e) {
      const el = e.target;
      if (el && ["INPUT", "TEXTAREA"].includes(el.tagName)) agendarTratarSelecao();
    },
    true
  );

  // Mais reforço: cobre seleção via arraste do mouse e via teclado (Shift+setas, Ctrl+A)
  document.addEventListener("mouseup", agendarTratarSelecao, true);
  document.addEventListener("keyup", agendarTratarSelecao, true);

  // Some ao rolar/redimensionar para não ficar "flutuando" fora do lugar
  window.addEventListener("scroll", ocultarPainel, true);
  window.addEventListener("resize", ocultarPainel);

  // ─── Limite de caracteres do campo (maxlength) ────────────────────────────

  let elementoComInfoAtivo = null;
  let handlerInputCampo = null;

  function pararEscutaInputCampo() {
    if (elementoComInfoAtivo && handlerInputCampo) {
      elementoComInfoAtivo.removeEventListener("input", handlerInputCampo);
    }
    elementoComInfoAtivo = null;
    handlerInputCampo = null;
  }

  function linhaInfo(label, valor) {
    return (
      '<div style="display:flex;justify-content:space-between;gap:16px;">' +
        '<span style="opacity:.7">' + label + "</span>" +
        "<strong>" + valor + "</strong>" +
      "</div>"
    );
  }

  function renderInfoCampo(el) {
    const max = el.maxLength; // -1 quando o atributo maxlength não existe
    const atual = (el.value || "").length;

    if (max != null && max > 0) {
      return (
        linhaInfo("Limite máximo", max + " caracteres") +
        linhaInfo("Já preenchido", atual + " / " + max) +
        linhaInfo("Restante", Math.max(max - atual, 0) + " caracteres")
      );
    }
    return (
      linhaInfo("Limite máximo", "Sem maxlength definido") +
      linhaInfo("Já preenchido", atual + " caracteres")
    );
  }

  function exibirInfoCampo(el) {
    if (!configCache.mostrarLimiteCampo) return;

    const painel = montarPainel();
    painelModoSelecao = false;
    obterConteudoPainel().innerHTML = renderInfoCampo(el);
    painelSuprimido = false;
    painel.style.display = "block";
    posicionarPainel(painel, el.getBoundingClientRect());
    agendarAutoOcultar();

    // Atualiza "já preenchido" / "restante" ao vivo enquanto o usuário digita
    pararEscutaInputCampo();
    elementoComInfoAtivo = el;
    handlerInputCampo = function () {
      if (!painelContagem || painelContagem.style.display === "none") return;
      obterConteudoPainel().innerHTML = renderInfoCampo(el);
      agendarAutoOcultar();
    };
    el.addEventListener("input", handlerInputCampo);
  }

  document.addEventListener(
    "focusout",
    function (e) {
      if (e.target === elementoComInfoAtivo) pararEscutaInputCampo();
    },
    true
  );

  // Fecha o painel se o usuário clicar em qualquer outra área da página
  document.addEventListener(
    "mousedown",
    function (e) {
      if (!painelContagem || painelContagem.style.display === "none") return;
      const alvo = e.target;
      if (painelContagem.contains(alvo)) return; // clique no próprio painel (ex: botão fechar)
      if (alvo && ["INPUT", "TEXTAREA"].includes(alvo.tagName)) return; // outro campo: focusin cuida disso
      ocultarPainel();
    },
    true
  );

  // ─── Detecção de padrões ─────────────────────────────────────────────────

  const PADROES = {
    cpf: /cpf/i,
    cns: /cns|cart[aã]o[\s-]?sus/i,
  };

  function corresponde(el, tipo) {
    const p = PADROES[tipo];
    return (
      p.test(el.id || "") ||
      p.test(el.name || "") ||
      p.test(el.placeholder || "") ||
      p.test(el.getAttribute("aria-label") || "") ||
      p.test(el.getAttribute("data-testid") || "")
    );
  }

  // ─── Preenchimento ───────────────────────────────────────────────────────

  function preencherCampo(el, valor) {
    if (!el || !["INPUT", "TEXTAREA"].includes(el.tagName)) return false;

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
    return true;
  }

  // ─── Toast ───────────────────────────────────────────────────────────────

  function exibirToast(mensagem, tipo) {
    document.getElementById("__gdt_toast__")?.remove();

    const cores = { sucesso: "#22c55e", info: "#3b82f6", erro: "#ef4444" };
    const icones = { sucesso: "✓", info: "ℹ", erro: "✕" };
    const t = tipo || "sucesso";

    const toast = document.createElement("div");
    toast.id = "__gdt_toast__";

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "2147483647",
      background: cores[t] || cores.sucesso,
      color: "#fff",
      padding: "11px 16px",
      borderRadius: "10px",
      fontSize: "13px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      fontWeight: "600",
      boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      maxWidth: "300px",
      lineHeight: "1.4",
      opacity: "0",
      transform: "translateY(8px)",
      transition: "opacity 0.25s ease, transform 0.25s ease",
      pointerEvents: "none",
    });

    toast.innerHTML =
      '<span style="font-size:15px">' + (icones[t] || "✓") + "</span>" +
      "<span>" + mensagem + "</span>";

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
      });
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ─── Rastreamento de foco ────────────────────────────────────────────────
  // Salva o último input/textarea focado ANTES do popup abrir e roubar o foco

  document.addEventListener("focusin", function (e) {
    const el = e.target;
    if (!el || !["INPUT", "TEXTAREA"].includes(el.tagName)) return;

    // Memoriza referência direta ao elemento
    window.__GDT_LAST_FIELD__ = el;

    // Detecta tipo e salva no storage para o popup mostrar sugestão
    let tipo = null;
    if (corresponde(el, "cpf")) tipo = "cpf";
    else if (corresponde(el, "cns")) tipo = "cns";
    if (tipo) chrome.storage.local.set({ campoDetectado: tipo });

    // Mostra quantos caracteres o campo aceita (maxlength)
    exibirInfoCampo(el);
  }, true);

  // ─── Listener de mensagens ───────────────────────────────────────────────

  chrome.runtime.onMessage.addListener(function (msg, _sender, sendResponse) {

    // PREENCHER CAMPO FOCADO (ou último campo que teve foco)
    if (msg.acao === "preencher-campo-focado") {
      // Tenta: 1) activeElement atual, 2) último campo memorizado
      let el = document.activeElement;
      if (!el || !["INPUT", "TEXTAREA"].includes(el.tagName)) {
        el = window.__GDT_LAST_FIELD__;
      }

      if (el && ["INPUT", "TEXTAREA"].includes(el.tagName)) {
        const ok = preencherCampo(el, msg.valor);
        if (ok) {
          el.focus();
          exibirToast((msg.tipo || "Dado") + " preenchido!", "sucesso");
        }
        sendResponse({ ok: !!ok });
      } else {
        sendResponse({ ok: false, erro: "Nenhum campo focado encontrado" });
      }
      return true;
    }

    // DETECTAR E PREENCHER (busca por padrão no DOM)
    if (msg.acao === "detectar-e-preencher") {
      const campos = Array.from(document.querySelectorAll("input, textarea"));
      const campo = campos.find((el) => corresponde(el, msg.tipo));
      const alvo = campo || window.__GDT_LAST_FIELD__;

      if (alvo && ["INPUT", "TEXTAREA"].includes(alvo.tagName)) {
        preencherCampo(alvo, msg.valor);
        alvo.focus();
        exibirToast(msg.tipo.toUpperCase() + " preenchido!", "sucesso");
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, erro: "Nenhum campo encontrado" });
      }
      return true;
    }

    // CONTAGEM via menu de contexto (clique manual, ignora o toggle de automático)
    if (msg.acao === "mostrar-contagem") {
      const contagem = GDT_CONTAGEM.contar(msg.texto || "");
      const painel = montarPainel();
      pararEscutaInputCampo();
      obterConteudoPainel().innerHTML = renderLinhasPainel(contagem);
      painelSuprimido = false;
      Object.assign(painel.style, {
        position: "fixed",
        top: "auto",
        left: "auto",
        bottom: "24px",
        right: "24px",
        display: "block",
      });
      sendResponse({ ok: true });
      agendarAutoOcultar();
      return true;
    }

    // TOAST direto
    if (msg.acao === "toast") {
      exibirToast(msg.mensagem, msg.tipo || "sucesso");
      sendResponse({ ok: true });
      return true;
    }
  });

  // Toast disparado via executeScript pelo background
  window.addEventListener("gdt:toast", function (e) {
    exibirToast(e.detail?.mensagem || "Dado copiado!", e.detail?.tipo || "sucesso");
  });

})();
