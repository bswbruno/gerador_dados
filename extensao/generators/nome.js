/**
 * generators/nome.js — Gerador de nomes fictícios
 * Expõe objeto global GDT_NOME para uso via importScripts no service worker.
 */

var GDT_NOME = (function () {
  "use strict";

  const PRIMEIROS = [
    "ANA", "BEATRIZ", "CARLA", "DANIELA", "EDUARDA", "FERNANDA", "GABRIELA",
    "HELENA", "ISABELA", "JULIANA", "KAREN", "LARISSA", "MARIANA", "NATALIA",
    "OLIVIA", "PATRICIA", "RAFAELA", "SABRINA", "TATIANA", "VANESSA",
    "ALINE", "BRUNA", "CAMILA", "DEBORA", "ELISA", "FABIANA", "GIOVANNA",
    "HELOISA", "INGRID", "JESSICA", "LETICIA", "MARTA", "NICOLE", "PAULA",
    "RENATA", "SIMONE", "THAIS", "VIVIANE", "ANDRESSA", "BIANCA",
    "ANDRE", "BRUNO", "CARLOS", "DANIEL", "EDUARDO", "FELIPE", "GABRIEL",
    "HENRIQUE", "IGOR", "JOAO", "LUCAS", "MARCOS", "NICOLAS", "OTAVIO",
    "PEDRO", "RAFAEL", "SERGIO", "THIAGO", "VITOR", "WILLIAN",
    "ALAN", "BERNARDO", "CAIO", "DIEGO", "EMERSON", "FABRICIO", "GUSTAVO",
    "HUGO", "IVAN", "JORGE", "LEANDRO", "MATHEUS", "NELSON", "PAULO",
    "RODRIGO", "SAMUEL", "TIAGO", "VALTER", "ALEX", "BRENO",
  ];

  const SOBRENOMES = [
    "SILVA", "SANTOS", "OLIVEIRA", "SOUZA", "RODRIGUES", "FERREIRA",
    "ALVES", "PEREIRA", "LIMA", "GOMES", "COSTA", "RIBEIRO", "MARTINS",
    "CARVALHO", "ALMEIDA", "LOPES", "SOUSA", "FERNANDES", "VIEIRA", "BARBOSA",
    "ROCHA", "DIAS", "NASCIMENTO", "ANDRADE", "MOREIRA", "NUNES", "MARQUES",
    "MACHADO", "MENDES", "FREITAS", "CARDOSO", "RAMOS", "GONÇALVES", "ARAUJO",
    "MELO", "CAVALCANTI", "PINTO", "TEIXEIRA", "MONTEIRO", "CORREIA",
    "CAMPOS", "FARIAS", "BRAGA", "AZEVEDO", "Miranda", "MOURA", "CUNHA",
    "PEIXOTO", "BORGES", "TAVARES", "SIQUEIRA", "BATISTA", "FONSECA", "LEITE",
    "GUIMARAES", "XAVIER", "PIRES", "COELHO", "DUARTE", "MEDEIROS",
  ];

  function aleatorio(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Gera um nome fictício.
   * @param {boolean} prefixoTeste - se true, primeiro nome será "TESTE"
   * @param {boolean} maiusculo - se true, retorna em maiúsculas; false = Title Case
   * @returns {string}
   */
  function gerar(prefixoTeste, maiusculo) {
    const primeiro = prefixoTeste ? "TESTE" : aleatorio(PRIMEIROS);
    const meio = aleatorio(PRIMEIROS);
    const sobre = aleatorio(SOBRENOMES);

    const nome = primeiro + " " + meio + " " + sobre;

    if (maiusculo !== false) return nome;

    // Title Case
    return nome
      .toLowerCase()
      .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
  }

  return { gerar };
})();
