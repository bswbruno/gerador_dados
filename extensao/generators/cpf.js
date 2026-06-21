/**
 * generators/cpf.js — Gerador de CPF sintético válido
 * Expõe objeto global GDT_CPF.
 */

var GDT_CPF = (function () {
  "use strict";

  function calcDigito(numeros) {
    var soma = 0;
    var peso = numeros.length + 1;
    for (var i = 0; i < numeros.length; i++) {
      soma += numeros[i] * peso--;
    }
    var resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  function gerar(formatado) {
    var n = [];
    for (var i = 0; i < 9; i++) {
      n.push(Math.floor(Math.random() * 9));
    }
    n.push(calcDigito(n));
    n.push(calcDigito(n));

    var cpf = n.join("");
    if (formatado === false) return cpf;
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }

  return { gerar: gerar };
})();
