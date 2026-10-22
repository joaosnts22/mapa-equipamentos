const ionPlantaApplied = true;


/*
 * Planta das salas da sala fria desenhada como uma camada unica (SVG),
 * no lugar das paredes montadas com varias barras sobrepostas.
 *
 * - Sala Fria: medidas em pixels do "mundo" de sala-fria-extension.js
 *   (4200 x 1500). A parede e desenhada toda do lado de fora do piso.
 *   Esta versao publica usa um contorno ficticio de exemplo (sala
 *   principal, corredor e anexo); troque os pontos pelos da sua sala.
 * - Sala B: o contorno e lido das paredes atuais da pagina, entao
 *   acompanha o tamanho que a sala tiver.
 *
 * As fileiras continuam posicionadas em % de #room, sem mudanca.
 */
const ION_SALA_FRIA = {
  largura: 4200,
  altura: 1500,
  // piso: sala principal + corredor + anexo, em um contorno so
  piso: [
    [1489, 60],
    [1613, 60],
    [1613, 127],
    [2225, 127],
    [2225, 543],
    [1613, 543],
    [1613, 935],
    [3155, 935],
    [3155, 1419],
    [45, 1419],
    [45, 935],
    [1489, 935]
  ],
  // parede entre corredor e anexo, com a porta lateral (y 250 a 332)
  paredesInternas: [
    [1616.5, 127, 1616.5, 250],
    [1616.5, 332, 1616.5, 543]
  ],
  portas: [
    // entrada no topo do corredor
    { tipo: "horizontal", x0: 1489, x1: 1613, y: 60 },
    // porta lateral corredor <-> anexo
    { tipo: "vertical", x: 1616.5, y0: 250, y1: 332 },
    // passagem corredor -> sala principal
    { tipo: "horizontal", x0: 1489, x1: 1613, y: 935, aberta: true }
  ],
  textos: [
    {
      texto: "ENTRADA / SAÍDA",
      x: 1551,
      y: 975,
      classe: "ion-porta-texto"
    },
    {
      texto: "SALA FRIA",
      x: 3120,
      y: 1395,
      classe: "ion-marca",
      ancora: "end"
    }
  ]
};


const ION_PAREDE = 12;


function ionRelativeRect(
  element,
  origin
) {
  const rect =
    element.getBoundingClientRect();

  return {
    left: rect.left - origin.left,
    top: rect.top - origin.top,
    right: rect.right - origin.left,
    bottom: rect.bottom - origin.top
  };
}


/*
 * Sala B: contorno interno a partir das 5 barras de parede e da
 * abertura da porta no topo.
 */
function getIonHpaPlanta(
  stage
) {
  const origin =
    stage.getBoundingClientRect();

  const walls = {};

  for (const name of [
    "top-left",
    "top-right",
    "left-top",
    "right",
    "bottom-left"
  ]) {
    const element =
      stage.querySelector(
        ".wall." + name
      );

    if (!element) {
      return null;
    }

    walls[name] =
      ionRelativeRect(
        element,
        origin
      );
  }

  const left = walls["left-top"].right;
  const right = walls.right.left;
  const top = walls["top-left"].bottom;
  const bottom = walls["bottom-left"].top;
  const doorLeft = walls["top-left"].right;
  const doorRight = walls["top-right"].left;

  return {
    largura: stage.offsetWidth,
    altura: stage.offsetHeight,
    piso: [
      [left, top],
      [right, top],
      [right, bottom],
      [left, bottom]
    ],
    paredesInternas: [],
    portas: [
      {
        tipo: "horizontal",
        x0: doorLeft,
        x1: doorRight,
        y: top
      }
    ],
    textos: [
      {
        texto: "ENTRADA / SAÍDA",
        x: (doorLeft + doorRight) / 2,
        y: top + 26,
        classe: "ion-porta-texto"
      },
      {
        texto: "SALA B",
        x: right - 24,
        y: bottom - 22,
        classe: "ion-marca ion-marca-pequena",
        ancora: "end"
      }
    ]
  };
}


function getIonPlanta() {
  const stage =
    document.getElementById(
      "roomStage"
    );

  if (!stage) {
    return null;
  }

  if (
    window.activeRoomKey === "sala_hpa"
  ) {
    return getIonHpaPlanta(
      stage
    );
  }

  return ION_SALA_FRIA;
}


function buildIonDoor(
  porta
) {
  const meia =
    ION_PAREDE / 2;

  if (porta.tipo === "horizontal") {
    const largura =
      porta.x1 - porta.x0;

    // apaga a parede na abertura e marca os batentes
    return `
      <rect
        class="ion-piso"
        x="${porta.x0}"
        y="${porta.y - ION_PAREDE - 1}"
        width="${largura}"
        height="${ION_PAREDE + 2}"
      ></rect>
      <line class="ion-batente"
        x1="${porta.x0}" y1="${porta.y - ION_PAREDE}"
        x2="${porta.x0}" y2="${porta.y + (porta.aberta ? 0 : 18)}"></line>
      <line class="ion-batente"
        x1="${porta.x1}" y1="${porta.y - ION_PAREDE}"
        x2="${porta.x1}" y2="${porta.y + (porta.aberta ? 0 : 18)}"></line>
      <line class="ion-soleira"
        x1="${porta.x0}" y1="${porta.y - meia}"
        x2="${porta.x1}" y2="${porta.y - meia}"></line>
    `;
  }

  return `
    <rect
      class="ion-piso"
      x="${porta.x - meia - 1}"
      y="${porta.y0}"
      width="${ION_PAREDE + 2}"
      height="${porta.y1 - porta.y0}"
    ></rect>
    <line class="ion-batente"
      x1="${porta.x - 10}" y1="${porta.y0}"
      x2="${porta.x + 10}" y2="${porta.y0}"></line>
    <line class="ion-batente"
      x1="${porta.x - 10}" y1="${porta.y1}"
      x2="${porta.x + 10}" y2="${porta.y1}"></line>
    <line class="ion-soleira"
      x1="${porta.x}" y1="${porta.y0}"
      x2="${porta.x}" y2="${porta.y1}"></line>
  `;
}


function buildIonPlantaSvg(
  planta,
  key
) {
  const pontos =
    planta.piso
      .map(
        ([x, y]) => x + "," + y
      )
      .join(" ");

  const internas =
    planta.paredesInternas
      .map(
        ([x1, y1, x2, y2]) => `
          <line class="ion-parede-interna"
            x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line>
        `
      )
      .join("");

  const textos =
    planta.textos
      .map(
        texto => `
          <text
            class="${texto.classe}"
            x="${texto.x}"
            y="${texto.y}"
            text-anchor="${texto.ancora || "middle"}"
          >${texto.texto}</text>
        `
      )
      .join("");

  return `
    <svg
      class="ion-planta-svg"
      width="${planta.largura}"
      height="${planta.altura}"
      viewBox="0 0 ${planta.largura} ${planta.altura}"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="ionGrade-${key}"
          width="25"
          height="25"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 25 0 L 0 0 0 25"
            class="ion-grade-linha"
          ></path>
        </pattern>
        <pattern
          id="ionPontos-${key}"
          width="25"
          height="25"
          patternUnits="userSpaceOnUse"
        >
          <circle
            cx="0.5"
            cy="0.5"
            r="1.3"
            class="ion-grade-ponto"
          ></circle>
        </pattern>
      </defs>

      <polygon
        class="ion-parede"
        points="${pontos}"
      ></polygon>
      <polygon
        class="ion-piso"
        points="${pontos}"
      ></polygon>
      <polygon
        class="ion-grade"
        points="${pontos}"
        fill="url(#ionGrade-${key})"
      ></polygon>
      <polygon
        class="ion-pontos"
        points="${pontos}"
        fill="url(#ionPontos-${key})"
      ></polygon>
      <polygon
        class="ion-contorno"
        points="${pontos}"
      ></polygon>

      ${internas}
      ${planta.portas.map(buildIonDoor).join("")}
      ${textos}
    </svg>
  `;
}


function drawIonPlanta() {
  const stage =
    document.getElementById(
      "roomStage"
    );

  const planta =
    getIonPlanta();

  if (!stage || !planta) {
    return;
  }

  document.body.classList.add(
    "ion-planta"
  );

  const key =
    window.activeRoomKey
    + ":"
    + planta.largura
    + "x"
    + planta.altura;

  let layer =
    stage.querySelector(
      ":scope > .ion-planta-camada"
    );

  if (
    layer
    && layer.dataset.chave === key
  ) {
    return;
  }

  layer?.remove();

  layer =
    document.createElement(
      "div"
    );

  layer.className =
    "ion-planta-camada";

  layer.dataset.chave =
    key;

  layer.innerHTML =
    buildIonPlantaSvg(
      planta,
      String(
        window.activeRoomKey
      ).replace(/\W/g, "")
    );

  stage.prepend(
    layer
  );

  updateIonMinimapa(true);
}


/*
 * Minimapa: a sala inteira em miniatura, com as fileiras e um
 * retangulo mostrando a parte visivel. Clicar leva a vista para la.
 */
function installIonMinimapa() {
  if (
    document.getElementById(
      "ionMinimapa"
    )
  ) {
    return;
  }

  const card =
    roomWrap.closest(
      ".map-card"
    )
    || roomWrap.parentElement;

  card.classList.add(
    "ion-mapa-card"
  );

  const minimapa =
    document.createElement(
      "div"
    );

  minimapa.id =
    "ionMinimapa";

  minimapa.className =
    "ion-minimapa";

  minimapa.title =
    "Clique para ir a esta parte da sala";

  card.appendChild(
    minimapa
  );

  minimapa.addEventListener(
    "pointerdown",
    event => {
      event.preventDefault();

      const svg =
        minimapa.querySelector(
          "svg"
        );

      if (!svg) {
        return;
      }

      const rect =
        svg.getBoundingClientRect();

      const stage =
        document.getElementById(
          "roomStage"
        );

      const x =
        (event.clientX - rect.left)
        / rect.width
        * stage.offsetWidth;

      const y =
        (event.clientY - rect.top)
        / rect.height
        * stage.offsetHeight;

      roomWrap.scrollTo({
        left: x - roomWrap.clientWidth / 2,
        top: y - roomWrap.clientHeight / 2,
        behavior: "smooth"
      });
    }
  );

  roomWrap.addEventListener(
    "scroll",
    () => updateIonMinimapa(false),
    { passive: true }
  );

  window.addEventListener(
    "resize",
    () => updateIonMinimapa(true)
  );
}


function updateIonMinimapa(
  rebuild
) {
  const minimapa =
    document.getElementById(
      "ionMinimapa"
    );

  const stage =
    document.getElementById(
      "roomStage"
    );

  const planta =
    getIonPlanta();

  if (!minimapa || !stage || !planta) {
    return;
  }

  const cabe =
    stage.offsetWidth <= roomWrap.clientWidth + 2
    && stage.offsetHeight <= roomWrap.clientHeight + 2;

  minimapa.hidden = cabe;

  if (cabe) {
    return;
  }

  if (
    rebuild
    || !minimapa.firstChild
  ) {
    const pontos =
      planta.piso
        .map(
          ([x, y]) => x + "," + y
        )
        .join(" ");

    const roomLeft =
      room.offsetLeft;

    const roomTop =
      room.offsetTop;

    const fileiras =
      racks
        .filter(
          rack =>
            typeof getRackRoom !== "function"
            || getRackRoom(rack)
            === window.activeRoomKey
        )
        .map(
          rack => `
            <rect
              class="ion-mini-fileira"
              x="${roomLeft + rack.x / 100 * room.offsetWidth}"
              y="${roomTop + rack.y / 100 * room.offsetHeight}"
              width="${rack.w / 100 * room.offsetWidth}"
              height="${rack.h / 100 * room.offsetHeight}"
            ></rect>
          `
        )
        .join("");

    minimapa.innerHTML = `
      <svg
        viewBox="0 0 ${stage.offsetWidth} ${stage.offsetHeight}"
        preserveAspectRatio="xMidYMid meet"
      >
        <polygon class="ion-mini-piso" points="${pontos}"></polygon>
        ${fileiras}
        <rect class="ion-mini-vista" x="0" y="0" width="0" height="0"></rect>
      </svg>
    `;
  }

  const vista =
    minimapa.querySelector(
      ".ion-mini-vista"
    );

  vista?.setAttribute("x", roomWrap.scrollLeft);
  vista?.setAttribute("y", roomWrap.scrollTop);
  vista?.setAttribute("width", roomWrap.clientWidth);
  vista?.setAttribute("height", roomWrap.clientHeight);
}


/*
 * Legenda discreta no titulo do mapa.
 */
function installIonLegenda() {
  if (
    document.getElementById(
      "ionLegenda"
    )
  ) {
    return;
  }

  const title =
    document.querySelector(
      ".map-title"
    );

  if (!title) {
    return;
  }

  const legenda =
    document.createElement(
      "div"
    );

  legenda.id =
    "ionLegenda";

  legenda.className =
    "ion-legenda";

  legenda.innerHTML = `
    <span><i class="ion-leg-frente"></i>Frente da fileira</span>
    <span><i class="ion-leg-rack"></i>1 rack</span>
    <span><i class="ion-leg-porta"></i>Porta</span>
  `;

  const status =
    document.getElementById(
      "editStatus"
    );

  title.insertBefore(
    legenda,
    status
  );
}


function installIonPlantaStyles() {
  if (
    document.getElementById(
      "ionPlantaStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "ionPlantaStyles";

  style.textContent = `
    /* a planta nova substitui paredes, portas e o anexo antigos */
    body.ion-planta #roomStage > .wall,
    body.ion-planta #roomStage > .door-gap,
    body.ion-planta #roomStage > .door-text,
    body.ion-planta #roomStage > .orientation-note,
    body.ion-planta #room > .wall,
    body.ion-planta #room > .door-gap,
    body.ion-planta #room > .door-text,
    body.ion-planta #room > .orientation-note,
    body.ion-planta .sala-fria-extension,
    body.ion-planta .sala-fria-connection-mask {
      visibility: hidden !important;
    }

    body.ion-planta #room,
    body.ion-planta #room.editing {
      border-color: transparent !important;
      background: transparent !important;
      box-shadow: none !important;
    }

    .ion-planta-camada {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 0;
      pointer-events: none;
    }

    .ion-planta-svg {
      display: block;
      overflow: visible;
    }

    .ion-piso {
      fill: var(--ion-piso, #0b1524);
      stroke: none;
    }

    .ion-grade-linha {
      fill: none;
      stroke: var(--ion-grade, #15233a);
      stroke-width: 1;
    }

    .ion-grade-ponto {
      fill: var(--ion-ponto, #5ec8ff66);
    }

    .ion-pontos {
      display: none;
    }

    body.ion-editando .ion-pontos {
      display: inline;
    }

    body.ion-editando .ion-grade {
      display: none;
    }

    .ion-parede {
      fill: none;
      stroke: var(--ion-parede, #1b3d66);
      stroke-width: ${ION_PAREDE * 2};
      stroke-linejoin: miter;
    }

    .ion-contorno {
      fill: none;
      stroke: var(--ion-contorno, #2f78c466);
      stroke-width: 2;
    }

    .ion-parede-interna {
      stroke: var(--ion-parede, #1b3d66);
      stroke-width: 7;
    }

    .ion-batente {
      stroke: #ef4444;
      stroke-width: 4;
      stroke-linecap: square;
    }

    .ion-soleira {
      stroke: #ef444488;
      stroke-width: 2;
      stroke-dasharray: 6 6;
    }

    .ion-porta-texto {
      fill: #ff8080;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: .14em;
    }

    .ion-marca {
      fill: var(--ion-marca, #2f78c42e);
      font-size: 64px;
      font-weight: 950;
      letter-spacing: .12em;
    }

    .ion-marca-pequena {
      font-size: 28px;
    }

    #room {
      z-index: 4;
    }

    /* minimapa */
    .ion-mapa-card {
      position: relative;
    }

    .ion-minimapa {
      position: absolute;
      right: 30px;
      bottom: 30px;
      z-index: 15;
      width: 240px;
      padding: 6px;
      border: 1px solid var(--line);
      border-radius: 4px;
      background: #070d18e6;
      cursor: pointer;
    }

    .ion-minimapa[hidden] {
      display: none;
    }

    .ion-minimapa svg {
      display: block;
      width: 100%;
      height: auto;
    }

    .ion-mini-piso {
      fill: var(--ion-piso, #0b1524);
      stroke: var(--ion-parede, #1b3d66);
      stroke-width: 18;
    }

    .ion-mini-fileira {
      fill: var(--ion-mini-fileira, #2f78c4);
      opacity: .7;
    }

    .ion-mini-vista {
      fill: #5ec8ff1f;
      stroke: #5ec8ff;
      stroke-width: 28;
    }

    /* legenda */
    .ion-legenda {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-left: auto;
      margin-right: 16px;
      color: var(--muted);
      font-size: 11px;
      font-weight: 600;
    }

    .ion-legenda span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .ion-legenda i {
      display: inline-block;
    }

    .ion-leg-frente {
      width: 4px;
      height: 14px;
      background: var(--front);
    }

    .ion-leg-rack {
      width: 12px;
      height: 12px;
      border: 1px solid var(--rackline);
      background: var(--rack);
    }

    .ion-leg-porta {
      width: 14px;
      height: 4px;
      background: #ef4444;
    }

    @media(max-width: 900px) {
      .ion-legenda {
        display: none;
      }

      .ion-minimapa {
        width: 160px;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


const renderBeforeIonPlanta =
  render;


render =
  function renderIonPlanta(
    ...args
  ) {
    const result =
      renderBeforeIonPlanta(
        ...args
      );

    drawIonPlanta();
    updateIonMinimapa(true);

    return result;
  };


const changeActiveRoomBeforeIonPlanta =
  changeActiveRoom;


changeActiveRoom =
  function changeActiveRoomWithIonPlanta(
    ...args
  ) {
    const result =
      changeActiveRoomBeforeIonPlanta(
        ...args
      );

    // a geometria da Sala B so existe depois do layout da sala
    window.requestAnimationFrame(
      () => {
        drawIonPlanta();
        updateIonMinimapa(true);
      }
    );

    return result;
  };


const setEditModeBeforeIonPlanta =
  setEditMode;


setEditMode =
  function setEditModeWithIonPlanta(
    active
  ) {
    const result =
      setEditModeBeforeIonPlanta(
        active
      );

    document.body.classList.toggle(
      "ion-editando",
      Boolean(active)
    );

    return result;
  };


installIonPlantaStyles();
installIonLegenda();
installIonMinimapa();
render();
