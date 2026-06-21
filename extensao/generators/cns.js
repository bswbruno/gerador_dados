/**
 * generators/cns.js — Gerador de CNS (Cartão Nacional de Saúde) válido
 * Algoritmo real do CADSUS: soma de todos os 15 dígitos com pesos 15 a 1,
 * resultado deve ser divisível por 11.
 * Gera CNS definitivos (início com 1, 2 ou 7).
 * Expõe objeto global GDT_CNS.
 */

var GDT_CNS = (function () {
  "use strict";

  function validar(cns) {
    if (!cns || cns.length !== 15) return false;
    var soma = 0;
    for (var i = 0; i < 15; i++) {
      soma += parseInt(cns[i], 10) * (15 - i);
    }
    return soma % 11 === 0;
  }

  function gerar() {
    var prefixos = ["1", "2", "7"];

    for (var t = 0; t < 1000; t++) {
      // Gera os 14 primeiros dígitos com prefixo definitivo
      var cns = prefixos[Math.floor(Math.random() * prefixos.length)];
      for (var i = 0; i < 13; i++) {
        cns += String(Math.floor(Math.random() * 10));
      }

      // Calcula o 15º dígito (peso 1) para que soma % 11 === 0
      var soma = 0;
      for (var i = 0; i < 14; i++) {
        soma += parseInt(cns[i], 10) * (15 - i);
      }
      // peso do 15º dígito é 1: d = (11 - soma%11) % 11
      var d = (11 - (soma % 11)) % 11;

      // d deve ser 0-9 para caber em 1 dígito
      if (d <= 9) {
        var cnsCompleto = cns + String(d);
        if (validar(cnsCompleto)) return cnsCompleto;
      }
      // se d === 10 não cabe, tenta novamente
    }

    // Fallback: CNS fixo válido confirmado
    return "291202355360000";
  }

  return { gerar: gerar, validar: validar };
})();
