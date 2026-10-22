const bhTemaApplied = true;


/*
 * Tema "Grafite e ambar" da area tecnica, parte 2.
 *
 * Varios scripts (painel da fileira, historico, patch) injetam CSS com
 * cores fixas do tema azul original. Esses scripts sao os mesmos da sala fria,
 * entao em vez de alterar cada um, este arquivo troca as cores antigas
 * pelas equivalentes do tema em todas as folhas de estilo da pagina,
 * inclusive as que forem criadas depois.
 *
 * Verde (conectado/sucesso) e vermelho (erro/excluir) nao mudam.
 */
const BH_TEMA_CORES = {
  // fundos azul-marinho -> grafite
  "3,8,16": "13,14,16",
  "5,13,23": "16,17,19",
  "7,17,31": "18,20,22",
  "8,20,36": "21,23,26",
  "8,21,38": "27,30,34",
  "8,27,43": "29,32,35",
  "11,21,34": "23,25,28",
  "11,23,39": "26,29,33",
  "11,37,57": "36,39,43",
  "12,24,40": "27,30,34",
  "12,29,48": "29,32,36",
  "16,38,58": "36,39,44",
  "16,39,65": "42,33,15",
  "17,42,64": "42,45,50",
  "23,40,60": "36,40,45",
  "23,49,74": "42,46,51",
  "23,60,90": "46,50,55",
  "25,69,103": "52,56,62",
  "26,43,61": "34,37,42",
  "38,59,80": "42,46,52",
  "4,11,19": "13,14,16",
  "18,34,56": "36,40,45",
  "28,48,69": "36,40,45",
  "23,37,54": "34,38,43",
  "23,36,52": "34,38,43",

  // bordas azuladas -> grafite
  "38,56,78": "51,56,63",
  "53,81,109": "69,74,82",
  "95,120,146": "90,96,104",
  "111,139,166": "74,80,88",
  "157,183,206": "184,188,194",

  // selecao/hover azul -> ambar escuro
  "14,66,87": "58,42,18",
  "22,65,90": "74,54,22",
  "11,36,51": "42,34,20",
  "23,61,85": "58,42,18",
  "32,89,121": "74,54,22",

  // ciano -> ambar
  "14,116,144": "232,163,61",
  "34,211,238": "245,181,68",
  "85,220,255": "232,163,61",
  "35,159,208": "232,163,61",
  "123,219,255": "245,181,68",
  "24,155,213": "232,163,61",
  "22,155,213": "232,163,61",
  "87,232,255": "245,181,68",
  "116,207,255": "124,180,232",

  // textos azul-claro -> tons quentes/neutros
  "175,234,255": "255,217,160",
  "184,239,255": "255,226,176",
  "142,232,255": "240,184,96",
  "121,220,244": "240,184,96",
  "141,162,186": "154,159,166",
  "143,194,230": "154,159,166",
  "159,181,202": "169,174,181",
  "168,185,202": "154,159,166",
  "205,217,229": "213,211,207",
  "228,237,245": "230,228,224",
  "237,244,251": "236,234,230",
  "113,134,155": "122,127,134",
  "113,134,156": "122,127,134",
  "185,201,217": "190,193,198",
  "104,130,156": "122,127,134",
  "86,106,129": "107,113,120",
  "99,120,143": "107,113,120",
  "111,132,154": "107,113,120",

  // destaque roxo da busca -> ambar
  "155,44,255": "245,181,68",
  "77,22,200": "201,131,31",
  "224,177,255": "255,226,176",
  "189,104,255": "245,181,68",
  "167,63,255": "245,181,68"
};


const BH_TEMA_RGB =
  /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g;


function bhTemaTrocarCores(
  value
) {
  return value.replace(
    BH_TEMA_RGB,
    (match, r, g, b, alpha) => {
      const novo =
        BH_TEMA_CORES[
          r + "," + g + "," + b
        ];

      if (!novo) {
        return match;
      }

      return alpha === undefined
        ? "rgb(" + novo + ")"
        : "rgba(" + novo + ", " + alpha + ")";
    }
  );
}


function bhTemaAplicarRegras(
  rules
) {
  for (const rule of rules) {
    if (rule.cssRules) {
      bhTemaAplicarRegras(
        rule.cssRules
      );
    }

    const style =
      rule.style;

    if (!style) {
      continue;
    }

    for (
      let i = 0;
      i < style.length;
      i += 1
    ) {
      const property =
        style[i];

      const value =
        style.getPropertyValue(
          property
        );

      const updated =
        bhTemaTrocarCores(
          value
        );

      if (updated !== value) {
        style.setProperty(
          property,
          updated,
          style.getPropertyPriority(
            property
          )
        );
      }
    }
  }
}


function bhTemaAplicarFolha(
  sheet
) {
  if (
    !sheet
    || sheet.href?.includes(
      "mapa-tema.css"
    )
  ) {
    return;
  }

  try {
    bhTemaAplicarRegras(
      sheet.cssRules
    );
  } catch {
    // folha externa sem acesso as regras: ignora
  }
}


function bhTemaAplicarTudo() {
  for (const sheet of document.styleSheets) {
    bhTemaAplicarFolha(
      sheet
    );
  }
}


bhTemaAplicarTudo();


/*
 * Estilos criados depois (ao abrir historico, patch, etc.) e
 * estilos cujo texto e reescrito tambem recebem o tema.
 */
new MutationObserver(
  mutations => {
    const sheets = new Set();

    for (const mutation of mutations) {
      const nodes = [
        mutation.target,
        ...mutation.addedNodes
      ];

      for (const node of nodes) {
        const element =
          node.nodeType === Node.TEXT_NODE
            ? node.parentElement
            : node;

        if (
          element?.tagName === "STYLE"
          && element.sheet
        ) {
          sheets.add(
            element.sheet
          );
        }
      }
    }

    sheets.forEach(
      bhTemaAplicarFolha
    );
  }
).observe(
  document.head,
  {
    childList: true,
    subtree: true,
    characterData: true
  }
);
