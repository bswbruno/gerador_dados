/**
 * generators/texto.js — Gerador de texto aleatório por tema, com tamanho exato.
 * Expõe objeto global GDT_TEXTO para uso via importScripts no service worker.
 *
 * Útil para teste de limite de campos (boundary testing): o texto gerado
 * sempre tem EXATAMENTE o número de caracteres pedido (ex: testar maxlength=255).
 */

var GDT_TEXTO = (function () {
  "use strict";

  const TEMAS = {
    lorem: [
      "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
      "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
      "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
      "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi",
      "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure",
      "in", "reprehenderit", "voluptate", "velit", "esse", "cillum", "eu",
      "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat",
      "cupidatat", "non", "proident", "sunt", "culpa", "qui", "officia",
      "deserunt", "mollit", "anim", "id", "est", "laborum",
    ],
    comentario: [
      "produto", "muito", "bom", "adorei", "recomendo", "chegou", "rápido",
      "qualidade", "excelente", "atendimento", "ótimo", "preço", "justo",
      "compraria", "novamente", "superou", "expectativas", "entrega", "no",
      "prazo", "embalagem", "perfeita", "vale", "a", "pena", "gostei",
      "bastante", "uso", "diário", "satisfeito", "com", "compra", "ajudou",
      "bastante", "funciona", "como", "esperado", "fácil", "de", "usar",
      "indico", "para", "amigos", "e", "família", "nota", "dez",
    ],
    produto: [
      "material", "resistente", "design", "moderno", "tamanho", "ideal",
      "cores", "disponíveis", "fabricado", "com", "alta", "qualidade",
      "garantia", "de", "doze", "meses", "dimensões", "compactas", "fácil",
      "manuseio", "tecnologia", "avançada", "acabamento", "premium",
      "indicado", "para", "uso", "profissional", "ou", "doméstico", "leve",
      "durável", "prático", "versátil", "compatível", "com", "diversos",
      "modelos", "embalagem", "reforçada", "pronto", "entrega",
    ],
    corporativo: [
      "a", "empresa", "reforça", "seu", "compromisso", "com", "a",
      "inovação", "e", "a", "excelência", "operacional", "buscando",
      "sempre", "entregar", "resultados", "consistentes", "aos", "nossos",
      "clientes", "parceiros", "e", "colaboradores", "investimos", "em",
      "processos", "eficientes", "governança", "transparente", "e",
      "sustentabilidade", "para", "o", "crescimento", "contínuo", "do",
      "negócio", "alinhado", "às", "melhores", "práticas", "do", "mercado",
    ],
    juridico: [
      "considerando", "o", "disposto", "na", "cláusula", "terceira", "do",
      "presente", "instrumento", "as", "partes", "acordam", "que",
      "eventuais", "divergências", "serão", "dirimidas", "por", "meio",
      "de", "negociação", "prévia", "ficando", "eleito", "o", "foro", "da",
      "comarca", "para", "dirimir", "quaisquer", "controvérsias",
      "oriundas", "deste", "contrato", "ressalvado", "o", "direito", "de",
      "recurso", "nos", "termos", "da", "legislação", "vigente",
    ],
  };

  const LABELS = {
    lorem: "Lorem Ipsum",
    comentario: "Comentário de usuário",
    produto: "Descrição de produto",
    corporativo: "Texto corporativo",
    juridico: "Texto jurídico/formal",
  };

  function aleatorio(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Gera texto aleatório de um tema com exatamente `tamanho` caracteres.
   * @param {string} tema - chave em TEMAS (cai para "lorem" se inválida)
   * @param {number} tamanho - quantidade exata de caracteres desejada
   * @returns {string}
   */
  function gerar(tema, tamanho) {
    const banco = TEMAS[tema] || TEMAS.lorem;
    const alvo = Math.max(1, Math.min(20000, parseInt(tamanho, 10) || 100));

    let texto = "";
    while (texto.length < alvo) {
      texto += (texto ? " " : "") + aleatorio(banco);
    }
    return texto.slice(0, alvo);
  }

  return {
    gerar: gerar,
    TEMAS: Object.keys(TEMAS),
    LABELS: LABELS,
  };
})();
