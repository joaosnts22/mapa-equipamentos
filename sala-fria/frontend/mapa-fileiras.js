const ionFileirasApplied = true;


/*
 * Fileiras da sala fria com tamanho proporcional a quantidade de racks e
 * divisoria visual entre cada rack (mesma ideia do mapa de area tecnica).
 *
 * Referencia: a fileira de 8 racks continua exatamente do tamanho de
 * antes (vertical 1,625% x 57,4679%; horizontal 8,5313% x 7,7064% da
 * sala). Cada rack vale 1/8 desse comprimento. A fileira mantem o
 * canto superior esquerdo onde esta.
 */
const ION_FILEIRA = {
  racksReferencia: 8,
  vertical: {
    largura: 1.625,
    comprimento: 57.4679
  },
  horizontal: {
    comprimento: 8.5313,
    altura: 7.7064
  }
};


function getIonRackCount(
  rack
) {
  return Math.max(
    1,
    Math.round(
      Number(
        rack?.quantidadeModulos
        || rack?.quantidade_modulos
        || ION_FILEIRA.racksReferencia
      )
    )
  );
}


function applyIonFileiraSize(
  rack
) {
  const proporcao =
    getIonRackCount(rack)
    / ION_FILEIRA.racksReferencia;

  if (rack.layout === "vertical") {
    rack.w =
      ION_FILEIRA.vertical.largura;

    rack.h = Number(
      (
        ION_FILEIRA.vertical.comprimento
        * proporcao
      ).toFixed(4)
    );
  } else if (rack.layout === "horizontal") {
    rack.w = Number(
      (
        ION_FILEIRA.horizontal.comprimento
        * proporcao
      ).toFixed(4)
    );

    rack.h =
      ION_FILEIRA.horizontal.altura;
  }
}


function applyIonFileiraSizes() {
  racks.forEach(
    applyIonFileiraSize
  );
}


function markIonFileiraElements() {
  room
    .querySelectorAll(
      ".rack"
    )
    .forEach(
      element => {
        const rack =
          racks.find(
            current =>
              String(current.id)
              === String(
                element.dataset.rackId
              )
          );

        if (!rack) {
          return;
        }

        element.classList.add(
          "ion-fileira"
        );

        element.style.setProperty(
          "--ion-racks",
          getIonRackCount(rack)
        );

        let quantidade =
          element.querySelector(
            ".ion-qtd"
          );

        if (!quantidade) {
          quantidade =
            document.createElement(
              "span"
            );

          quantidade.className =
            "ion-qtd";

          element.appendChild(
            quantidade
          );
        }

        const total =
          getIonRackCount(rack);

        quantidade.textContent =
          total
          + (total === 1 ? " rack" : " racks");
      }
    );
}


function installIonFileiraStyles() {
  if (
    document.getElementById(
      "ionFileiraStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "ionFileiraStyles";

  style.textContent = `
    /*
     * Visual mais tecnico: cantos retos, sem sombra, sem crescer no
     * destaque nem subir no hover (nao invade paredes e vizinhas).
     */
    #room .rack.ion-fileira {
      border-width: 2px;
      border-radius: 3px;
      box-shadow: none;
      transform: none;
    }

    #room .rack.ion-fileira:hover {
      transform: none;
      filter: brightness(1.15);
    }

    #room .rack.ion-fileira::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    /*
     * Cada rack e uma celula: divisoria fina + celulas alternadas
     * levemente mais claras (o fundo repete a cada 2 racks).
     */
    #room .rack.ion-fileira.vertical::after {
      background-image:
        linear-gradient(
          180deg,
          transparent calc(100% - 1px),
          #4a6a86 calc(100% - 1px)
        ),
        linear-gradient(
          180deg,
          transparent 50%,
          #ffffff08 50%
        );
      background-size:
        100% calc(100% / var(--ion-racks, 8)),
        100% calc(200% / var(--ion-racks, 8));
    }

    #room .rack.ion-fileira.horizontal::after {
      background-image:
        linear-gradient(
          90deg,
          transparent calc(100% - 1px),
          #4a6a86 calc(100% - 1px)
        ),
        linear-gradient(
          90deg,
          transparent 50%,
          #ffffff08 50%
        );
      background-size:
        calc(100% / var(--ion-racks, 8)) 100%,
        calc(200% / var(--ion-racks, 8)) 100%;
    }

    /* nome em uma etiqueta no topo, quantidade de racks embaixo */
    #room .rack.ion-fileira.vertical {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 5px 3px 6px;
    }

    #room .rack.ion-fileira.horizontal {
      padding: 4px 8px;
    }

    #room .rack.ion-fileira .id {
      position: relative;
      z-index: 1;
      padding: 2px 5px;
      border: 1px solid #ffffff1f;
      border-radius: 2px;
      background: #00000059;
      font-size: 13px;
      line-height: 1.2;
      letter-spacing: .04em;
    }

    #room .rack.ion-fileira .owner {
      position: relative;
      z-index: 1;
    }

    #room .rack.ion-fileira.vertical .owner {
      display: none;
    }

    #room .rack.ion-fileira .ion-qtd {
      position: relative;
      z-index: 1;
      color: #8ea3bd;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: .04em;
      white-space: nowrap;
    }

    #room .rack.ion-fileira.vertical .ion-qtd {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }

    #room .rack.ion-fileira.horizontal .ion-qtd {
      margin-left: auto;
    }

    #room .rack.ion-fileira .front {
      box-shadow: none;
    }

    #room .rack.ion-fileira .front-right {
      width: 3px;
      border-radius: 0;
    }

    #room .rack.ion-fileira .front-bottom {
      height: 3px;
      border-radius: 0;
    }

    #room.searching .rack.ion-fileira:not(.match) {
      transform: none;
    }

    #room.searching .rack.ion-fileira.match {
      transform: none;
      box-shadow:
        inset 0 0 0 1px #e0b1ff,
        inset 0 0 20px #bd68ff66;
    }

    #room.editing .rack.ion-fileira {
      box-shadow: none;
    }

    #room.editing .rack.ion-fileira.dragging {
      box-shadow:
        inset 0 0 0 2px #f59e0b;
    }
  `;

  document.head.appendChild(
    style
  );
}


const normalizeDataBeforeIonFileiras =
  normalizeData;


normalizeData =
  function normalizeIonFileiras(
    ...args
  ) {
    const result =
      normalizeDataBeforeIonFileiras(
        ...args
      );

    applyIonFileiraSizes();

    return result;
  };


const renderBeforeIonFileiras =
  render;


render =
  function renderIonFileiras(
    ...args
  ) {
    applyIonFileiraSizes();

    const result =
      renderBeforeIonFileiras(
        ...args
      );

    markIonFileiraElements();

    return result;
  };


installIonFileiraStyles();
render();
