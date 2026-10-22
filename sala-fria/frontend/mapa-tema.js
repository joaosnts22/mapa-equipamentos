const ionTemaApplied = true;


/*
 * Tema "Preto absoluto + prata" da sala fria, parte 2.
 *
 * Os scripts do mapa injetam CSS com cores fixas do tema azul
 * original (ciano, roxo do destaque, azul-marinho). Este arquivo
 * troca essas cores pelas do tema em todas as folhas de estilo da
 * pagina, inclusive as criadas depois (historico, patch...).
 *
 * Verde (conectado/sucesso), vermelho (erro/porta) e laranja (modo
 * edicao) nao mudam.
 */
const ION_TEMA_CORES = {
  // acentos ciano -> prata
  "34,211,238": "228,228,231",
  "85,220,255": "228,228,231",
  "87,232,255": "228,228,231",
  "94,200,255": "228,228,231",
  "123,219,255": "228,228,231",
  "14,116,144": "212,212,216",
  "35,159,208": "161,161,170",
  "24,155,213": "161,161,170",
  "22,155,213": "161,161,170",
  "116,207,255": "161,161,170",

  // textos azul-claro -> cinza claro
  "175,234,255": "228,228,231",
  "184,239,255": "228,228,231",
  "142,232,255": "212,212,216",
  "121,220,244": "212,212,216",
  "143,194,230": "154,154,160",
  "141,162,186": "154,154,160",
  "142,163,189": "140,140,148",
  "159,181,202": "170,170,176",
  "168,185,202": "154,154,160",
  "185,201,217": "190,190,196",
  "205,217,229": "212,212,216",
  "228,237,245": "228,228,231",
  "237,244,251": "242,242,243",
  "157,183,206": "200,200,205",
  "113,134,155": "120,120,128",
  "113,134,156": "120,120,128",
  "104,130,156": "120,120,128",
  "86,106,129": "100,100,108",
  "99,120,143": "100,100,108",
  "111,132,154": "100,100,108",

  // destaque roxo da busca -> prata claro
  "155,44,255": "228,228,231",
  "77,22,200": "113,113,122",
  "224,177,255": "244,244,245",
  "189,104,255": "228,228,231",
  "167,63,255": "228,228,231",

  // fundos azul-marinho -> preto e grafite neutro
  "3,7,12": "38,38,41",
  "3,8,16": "0,0,0",
  "4,11,19": "0,0,0",
  "5,13,23": "3,3,4",
  "7,13,24": "0,0,0",
  "7,17,31": "5,5,6",
  "8,20,36": "8,8,9",
  "8,21,38": "10,10,11",
  "8,27,43": "20,20,22",
  "11,21,34": "12,12,13",
  "11,23,39": "14,14,16",
  "11,36,51": "30,30,34",
  "11,37,57": "26,26,29",
  "12,24,40": "12,12,13",
  "12,29,48": "16,16,18",
  "16,38,58": "26,26,29",
  "17,42,64": "34,34,38",
  "18,34,56": "26,26,29",
  "23,36,52": "26,26,29",
  "23,37,54": "26,26,29",
  "23,40,60": "26,26,29",
  "23,49,74": "30,30,34",
  "23,60,90": "38,38,42",
  "25,69,103": "44,44,48",
  "26,43,61": "20,20,22",
  "28,48,69": "20,20,22",
  "38,56,78": "42,42,46",
  "38,59,80": "24,24,27",

  // linhas, bordas e selecao -> cinza
  "14,66,87": "50,50,56",
  "22,65,90": "60,60,66",
  "23,61,85": "39,39,42",
  "32,89,121": "63,63,70",
  "53,81,109": "63,63,70",
  "74,106,134": "46,46,51",
  "95,120,146": "82,82,91",
  "111,139,166": "52,52,58"
};


const ION_TEMA_RGB =
  /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/g;


function ionTemaTrocarCores(
  value
) {
  return value.replace(
    ION_TEMA_RGB,
    (match, r, g, b, alpha) => {
      const novo =
        ION_TEMA_CORES[
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


function ionTemaAplicarRegras(
  rules
) {
  for (const rule of rules) {
    if (rule.cssRules) {
      ionTemaAplicarRegras(
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
        ionTemaTrocarCores(
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


function ionTemaAplicarFolha(
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
    ionTemaAplicarRegras(
      sheet.cssRules
    );
  } catch {
    // folha externa sem acesso as regras: ignora
  }
}


for (const sheet of document.styleSheets) {
  ionTemaAplicarFolha(
    sheet
  );
}


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
      ionTemaAplicarFolha
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
