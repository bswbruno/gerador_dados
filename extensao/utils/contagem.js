/**
 * utils/contagem.js
 * Módulo compartilhado de contagem de texto (caracteres, espaços, palavras, linhas).
 * Sem ES modules — expõe window.GDT_CONTAGEM (ou globalThis.GDT_CONTAGEM no service worker).
 * Reutilizado por content.js, popup.js (via <script>) e background.js (via importScripts).
 */

(function (global) {
  "use strict";

  /**
   * Conta as métricas de um texto.
   * "espaços" considera qualquer whitespace (espaço, tab, quebra de linha),
   * de forma que comEspaco - espacos === semEspaco sempre bate.
   */
  function contar(texto) {
    texto = texto || "";

    const comEspaco = texto.length;
    const espacos = (texto.match(/\s/g) || []).length;
    const semEspaco = comEspaco - espacos;
    const palavras = texto.trim().length === 0 ? 0 : texto.trim().split(/\s+/).length;
    const linhas = texto.length === 0 ? 0 : texto.split(/\r\n|\r|\n/).length;

    return { comEspaco, espacos, semEspaco, palavras, linhas };
  }

  global.GDT_CONTAGEM = {
    contar: contar,

    // Ordem de exibição padrão
    ORDEM: ["comEspaco", "espacos", "semEspaco", "palavras", "linhas"],

    LABELS: {
      comEspaco: "Caracteres (com espaços)",
      espacos: "Espaços",
      semEspaco: "Caracteres (sem espaços)",
      palavras: "Palavras",
      linhas: "Linhas",
    },

    // Métricas habilitadas por padrão (usuário pode desligar cada uma nas configurações)
    METRICAS_PADRAO: {
      comEspaco: true,
      espacos: true,
      semEspaco: true,
      palavras: true,
      linhas: true,
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
