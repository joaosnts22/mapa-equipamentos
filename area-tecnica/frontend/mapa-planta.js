const bhPlantaApplied = true;


/*
 * Planta baixa da area tecnica. As medidas abaixo estao em "unidades
 * da planta" (cerca de 236 unidades = 1 metro): sao as coordenadas
 * tiradas do PDF da planta baixa. Esta versao publica usa uma planta
 * ficticia de exemplo; para usar a sua, troque os pontos de "salas"
 * pelas coordenadas da sua planta (piso, canaletas e corredor).
 *
 * Tamanho das fileiras: cada rack ocupa um tamanho fixo (igual ao da
 * planta), entao uma fileira com N racks tem N vezes esse tamanho.
 * O tamanho e recalculado em toda renderizacao, a partir da
 * quantidade de racks da fileira.
 */
const BH_PLANTA = {
  // pixels na tela por unidade do PDF
  escala: 0.75,

  // um rack na planta: 157,3 x 195,6 unidades (69 cm de largura)
  rack: {
    largura: 157.3,
    profundidade: 195.6
  },

  salas: {
    sala_a: {
      titulo: "Sala A",
      subtitulo: "DATACENTER PRINCIPAL",
      // area desenhada na tela: [x, y, largura, altura]
      area: [-60, 40, 3020, 1920],
      // contorno do piso (com um recorte no canto inferior direito)
      piso: [
        [100, 100],
        [2900, 100],
        [2900, 1500],
        [2000, 1500],
        [2000, 1900],
        [100, 1900]
      ],
      canaletas: [
        [200, 380, 2800, 470],
        [200, 900, 2800, 990],
        [200, 1400, 1900, 1490],
        [1400, 470, 1490, 900]
      ],
      // canaleta vertical que liga as salas (fora delas)
      corredor: [-40, 300, 40, 1960],
      posicaoTitulo: [1050, 1790]
    },

    sala_b: {
      titulo: "Sala B",
      subtitulo: "CONTROLE E MONITORAMENTO",
      area: [-60, 40, 2220, 1520],
      piso: [
        [100, 100],
        [2100, 100],
        [2100, 1500],
        [100, 1500]
      ],
      canaletas: [
        [200, 600, 2000, 690]
      ],
      corredor: [-40, 40, 40, 1560],
      posicaoTitulo: [1100, 1420]
    }
  }
};


/*
 * Zoom do mapa: multiplica a escala da planta. Como as fileiras sao
 * posicionadas em % da sala, mudar a escala redimensiona tudo junto
 * (arrastar no modo edicao continua funcionando).
 */
const BH_ZOOM = {
  minimo: 0.3,
  maximo: 1.3,
  passo: 0.1,
  chave: "mapaBhZoom"
};


let bhZoom = null;

try {
  const salvo = Number(
    localStorage.getItem(
      BH_ZOOM.chave
    )
  );

  if (
    salvo >= BH_ZOOM.minimo
    && salvo <= BH_ZOOM.maximo
  ) {
    bhZoom = salvo;
  }
} catch {
  // sem localStorage: usa o zoom automatico
}


function getBhEscala() {
  return (
    BH_PLANTA.escala
    * (bhZoom || 1)
  );
}


/*
 * Textos do mapa um nivel de zoom abaixo: em cada zoom, o texto fica
 * do tamanho (em relacao as fileiras) que teria no zoom seguinte
 * (40% usa a proporcao de 50%, 50% a de 60%...).
 */
function updateBhTextScale() {
  const zoom =
    bhZoom || 1;

  room?.style.setProperty(
    "--bh-texto",
    (
      zoom
      / (zoom + BH_ZOOM.passo)
    ).toFixed(4)
  );
}


function getBhSala(
  roomKey
) {
  return BH_PLANTA.salas[
    roomKey
    || window.activeRoomKey
  ] || null;
}


function getBhRackCount(
  rack
) {
  return Math.max(
    1,
    Math.round(
      Number(
        rack?.quantidadeModulos
        || rack?.quantidade_modulos
        || 1
      )
    )
  );
}


/*
 * Tamanho da fileira em % da sala:
 * horizontal = N racks lado a lado; vertical = N racks empilhados.
 */
function getBhFileiraSize(
  layout,
  rackCount,
  roomKey
) {
  const sala =
    getBhSala(roomKey);

  if (!sala) {
    return null;
  }

  const [, , areaWidth, areaHeight] =
    sala.area;

  const length =
    rackCount
    * BH_PLANTA.rack.largura;

  const depth =
    BH_PLANTA.rack.profundidade;

  const horizontal =
    layout === "horizontal";

  return {
    w: Number(
      (
        (horizontal ? length : depth)
        / areaWidth
        * 100
      ).toFixed(4)
    ),
    h: Number(
      (
        (horizontal ? depth : length)
        / areaHeight
        * 100
      ).toFixed(4)
    ),
    front:
      horizontal
        ? "bottom"
        : "right"
  };
}


function applyBhFileiraSizes() {
  racks.forEach(
    rack => {
      const size =
        getBhFileiraSize(
          rack.layout,
          getBhRackCount(rack),
          getRackRoom(rack)
        );

      if (!size) {
        return;
      }

      rack.w = size.w;
      rack.h = size.h;

      if (!rack.front) {
        rack.front = size.front;
      }

      rack.x = Math.max(
        0,
        Math.min(
          Number(rack.x) || 0,
          Number(
            (100 - rack.w).toFixed(4)
          )
        )
      );

      rack.y = Math.max(
        0,
        Math.min(
          Number(rack.y) || 0,
          Number(
            (100 - rack.h).toFixed(4)
          )
        )
      );
    }
  );
}


/*
 * Divisorias entre os racks dentro de cada fileira desenhada.
 */
function markBhFileiraElements() {
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
          "bh-fileira"
        );

        element.style.setProperty(
          "--bh-racks",
          getBhRackCount(rack)
        );
      }
    );
}


function buildBhPlantaSvg(
  roomKey,
  sala
) {
  const [areaX, areaY, areaWidth, areaHeight] =
    sala.area;

  const floor =
    sala.piso
      .map(
        ([x, y]) => x + "," + y
      )
      .join(" ");

  const channels =
    sala.canaletas
      .map(
        ([x0, y0, x1, y1]) => {
          const vertical =
            (y1 - y0) > (x1 - x0);

          const centerX =
            (x0 + x1) / 2;

          const centerY =
            (y0 + y1) / 2;

          return `
            <rect
              class="bh-canaleta"
              x="${x0}"
              y="${y0}"
              width="${x1 - x0}"
              height="${y1 - y0}"
            ></rect>
            <text
              class="bh-canaleta-texto"
              x="${centerX}"
              y="${centerY}"
              ${
                vertical
                  ? `transform="rotate(-90 ${centerX} ${centerY})"`
                  : ""
              }
            >CANALETA DE PISO</text>
          `;
        }
      )
      .join("");

  const [cx0, cy0, cx1, cy1] =
    sala.corredor;

  const corridorCenterX =
    (cx0 + cx1) / 2;

  const corridorCenterY =
    (cy0 + cy1) / 2;

  const [titleX, titleY] =
    sala.posicaoTitulo;

  return `
    <svg
      class="bh-planta-svg"
      viewBox="${areaX} ${areaY} ${areaWidth} ${areaHeight}"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="bhGrade-${roomKey}"
          width="59"
          height="59"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 59 0 L 0 0 0 59"
            fill="none"
            stroke="#24282d"
            stroke-width="2"
          ></path>
        </pattern>
      </defs>

      <!-- parede primeiro: o piso cobre a metade interna do traco,
           entao a parede fica toda do lado de fora e nao invade as
           fileiras encostadas nela -->
      <polygon
        class="bh-parede"
        points="${floor}"
      ></polygon>
      <polygon
        class="bh-piso"
        points="${floor}"
      ></polygon>
      <polygon
        points="${floor}"
        fill="url(#bhGrade-${roomKey})"
      ></polygon>

      <rect
        class="bh-canaleta"
        x="${cx0}"
        y="${cy0}"
        width="${cx1 - cx0}"
        height="${cy1 - cy0}"
      ></rect>
      <text
        class="bh-canaleta-texto"
        x="${corridorCenterX}"
        y="${corridorCenterY}"
        transform="rotate(-90 ${corridorCenterX} ${corridorCenterY})"
      >CANALETA DE PISO</text>

      ${channels}

      <text
        class="bh-titulo"
        x="${titleX}"
        y="${titleY}"
      >${sala.titulo}</text>
      <text
        class="bh-subtitulo"
        x="${titleX}"
        y="${titleY + 80}"
      >(${sala.subtitulo})</text>
    </svg>
  `;
}


function drawBhPlanta() {
  const roomKey =
    window.activeRoomKey;

  const sala =
    getBhSala(roomKey);

  const stage =
    document.getElementById(
      "roomStage"
    );

  if (!sala || !stage || !room) {
    return;
  }

  const width =
    Math.round(
      sala.area[2]
      * getBhEscala()
    ) + "px";

  const height =
    Math.round(
      sala.area[3]
      * getBhEscala()
    ) + "px";

  for (const element of [stage, room]) {
    element.style.width = width;
    element.style.minWidth = width;
    element.style.height = height;
    element.style.minHeight = height;
  }

  updateBhTextScale();

  let layer =
    room.querySelector(
      ".bh-planta"
    );

  if (
    layer
    && layer.dataset.sala === roomKey
  ) {
    return;
  }

  layer?.remove();

  layer =
    document.createElement(
      "div"
    );

  layer.className =
    "bh-planta";

  layer.dataset.sala =
    roomKey;

  layer.innerHTML =
    buildBhPlantaSvg(
      roomKey,
      sala
    );

  room.prepend(
    layer
  );
}


/*
 * Posicao livre para uma fileira nova: dentro do piso da sala,
 * sem sobrepor canaletas nem outras fileiras.
 */
function findBhFreePosition(
  wPercent,
  hPercent
) {
  const sala =
    getBhSala();

  if (!sala) {
    return null;
  }

  const [areaX, areaY, areaWidth, areaHeight] =
    sala.area;

  const toPercent = (
    [x0, y0, x1, y1]
  ) => ({
    x: (x0 - areaX) / areaWidth * 100,
    y: (y0 - areaY) / areaHeight * 100,
    w: (x1 - x0) / areaWidth * 100,
    h: (y1 - y0) / areaHeight * 100
  });

  const xs =
    sala.piso.map(p => p[0]);

  const ys =
    sala.piso.map(p => p[1]);

  const floorBox =
    toPercent([
      Math.min(...xs),
      Math.min(...ys),
      Math.max(...xs),
      Math.max(...ys)
    ]);

  const obstacles = [
    ...sala.canaletas.map(toPercent),
    ...racks
      .filter(
        rack =>
          getRackRoom(rack)
          === window.activeRoomKey
      )
      .map(rack => ({
        x: Number(rack.x),
        y: Number(rack.y),
        w: Number(rack.w),
        h: Number(rack.h)
      }))
  ];

  const insideFloor = (
    x,
    y
  ) => {
    const px =
      areaX + x / 100 * areaWidth;

    const py =
      areaY + y / 100 * areaHeight;

    let inside = false;

    for (
      let i = 0, j = sala.piso.length - 1;
      i < sala.piso.length;
      j = i++
    ) {
      const [xi, yi] = sala.piso[i];
      const [xj, yj] = sala.piso[j];

      if (
        (yi > py) !== (yj > py)
        && px < (xj - xi) * (py - yi) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }

    return inside;
  };

  const overlaps = (
    a,
    b
  ) =>
    a.x < b.x + b.w
    && b.x < a.x + a.w
    && a.y < b.y + b.h
    && b.y < a.y + a.h;

  const step = 0.5;

  for (
    let y = floorBox.y + 1;
    y + hPercent <= floorBox.y + floorBox.h - 1;
    y += step
  ) {
    for (
      let x = floorBox.x + 1;
      x + wPercent <= floorBox.x + floorBox.w - 1;
      x += step
    ) {
      const candidate = {
        x,
        y,
        w: wPercent,
        h: hPercent
      };

      const cornersInside =
        insideFloor(x, y)
        && insideFloor(x + wPercent, y)
        && insideFloor(x, y + hPercent)
        && insideFloor(x + wPercent, y + hPercent);

      if (
        cornersInside
        && !obstacles.some(
          obstacle =>
            overlaps(
              candidate,
              obstacle
            )
        )
      ) {
        return {
          x: Number(x.toFixed(4)),
          y: Number(y.toFixed(4))
        };
      }
    }
  }

  return null;
}


const findFreeRackPositionBeforeBhPlanta =
  findFreeRackPosition;


findFreeRackPosition =
  function findFreeRackPositionInBhPlanta(
    wPercent,
    hPercent
  ) {
    const layout =
      document.getElementById(
        "fNewRackLayout"
      )?.value
      || "horizontal";

    const rackCount =
      Number(
        document.getElementById(
          "fNewRackModuleCount"
        )?.value
      ) || 1;

    const size =
      getBhFileiraSize(
        layout,
        rackCount
      );

    if (!size) {
      return findFreeRackPositionBeforeBhPlanta(
        wPercent,
        hPercent
      );
    }

    return findBhFreePosition(
      size.w,
      size.h
    );
  };


function clampBhZoom(
  value
) {
  return Math.round(
    Math.max(
      BH_ZOOM.minimo,
      Math.min(
        BH_ZOOM.maximo,
        value
      )
    ) * 100
  ) / 100;
}


/*
 * Zoom em que a sala inteira (largura e altura) cabe na tela.
 */
function getBhZoomAjustado() {
  const sala =
    getBhSala();

  if (!sala) {
    return 1;
  }

  return clampBhZoom(
    Math.floor(
      Math.min(
        roomWrap.clientWidth
        / (sala.area[2] * BH_PLANTA.escala),
        roomWrap.clientHeight
        / (sala.area[3] * BH_PLANTA.escala)
      ) * 20
    ) / 20
  );
}


function updateBhZoomLabel() {
  const label =
    document.getElementById(
      "bhZoomValue"
    );

  if (label) {
    label.textContent =
      Math.round(
        (bhZoom || 1) * 100
      ) + "%";
  }
}


function setBhZoom(
  value,
  options = {}
) {
  const previous =
    bhZoom || 1;

  const next =
    clampBhZoom(value);

  // mantem no centro da tela o ponto que estava no centro
  const centerX =
    (roomWrap.scrollLeft + roomWrap.clientWidth / 2)
    / previous;

  const centerY =
    (roomWrap.scrollTop + roomWrap.clientHeight / 2)
    / previous;

  bhZoom = next;

  if (options.salvar !== false) {
    try {
      localStorage.setItem(
        BH_ZOOM.chave,
        String(next)
      );
    } catch {
      // sem localStorage: o zoom vale so ate recarregar
    }
  }

  drawBhPlanta();
  updateBhZoomLabel();

  roomWrap.scrollLeft =
    centerX * next
    - roomWrap.clientWidth / 2;

  roomWrap.scrollTop =
    centerY * next
    - roomWrap.clientHeight / 2;
}


function installBhZoomControls() {
  if (
    document.getElementById(
      "bhZoomControls"
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

  const controls =
    document.createElement(
      "div"
    );

  controls.id =
    "bhZoomControls";

  controls.className =
    "bh-zoom-controls";

  controls.innerHTML = `
    <span id="editStatusSlot"></span>
    <button type="button" class="zoom-btn" id="bhZoomOut" title="Diminuir zoom" aria-label="Diminuir zoom">−</button>
    <span id="bhZoomValue" class="zoom-value">100%</span>
    <button type="button" class="zoom-btn" id="bhZoomIn" title="Aumentar zoom" aria-label="Aumentar zoom">+</button>
    <button type="button" class="zoom-btn" id="bhZoomFit" title="Mostrar a sala inteira">Ajustar</button>
  `;

  // o status de edicao continua no mesmo canto, antes dos botoes
  const status =
    document.getElementById(
      "editStatus"
    );

  title.appendChild(
    controls
  );

  if (status) {
    controls
      .querySelector(
        "#editStatusSlot"
      )
      .replaceWith(
        status
      );
  }

  document.getElementById(
    "bhZoomOut"
  ).onclick = () =>
    setBhZoom(
      (bhZoom || 1) - BH_ZOOM.passo
    );

  document.getElementById(
    "bhZoomIn"
  ).onclick = () =>
    setBhZoom(
      (bhZoom || 1) + BH_ZOOM.passo
    );

  document.getElementById(
    "bhZoomFit"
  ).onclick = () => {
    setBhZoom(
      getBhZoomAjustado()
    );

    roomWrap.scrollLeft = 0;
    roomWrap.scrollTop = 0;
  };

  updateBhZoomLabel();
}


function installBhPlantaStyles() {
  if (
    document.getElementById(
      "bhPlantaStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "bhPlantaStyles";

  style.textContent = `
    #roomWrap {
      overflow: auto !important;
      scrollbar-width: none;
    }

    #roomWrap::-webkit-scrollbar {
      display: none;
    }

    #roomStage {
      position: relative !important;
      margin: 0 !important;
    }

    #room {
      position: relative !important;
      left: 0 !important;
      top: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      overflow: visible !important;
    }

    #room.editing .bh-planta-svg .bh-piso {
      fill: #20242a;
    }

    #room > .wall,
    #room > .door-gap,
    #room > .door-text,
    #room > .orientation-note,
    #roomStage > .wall,
    #roomStage > .door-gap,
    #roomStage > .door-text,
    #roomStage > .orientation-note {
      display: none !important;
    }

    .bh-planta {
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
    }

    .bh-planta-svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    .bh-piso {
      fill: #1b1e22;
    }

    .bh-parede {
      fill: none;
      stroke: #e8a33d;
      stroke-width: 10;
      stroke-linejoin: miter;
    }

    .bh-canaleta {
      fill: #2a2e33;
      stroke: #3a3f45;
      stroke-width: 2;
    }

    .bh-canaleta-texto {
      fill: #8a9097;
      font-size: calc(30px * var(--bh-texto, 1));
      font-weight: 800;
      letter-spacing: .05em;
      text-anchor: middle;
      dominant-baseline: central;
    }

    .bh-titulo {
      fill: #e8a33d55;
      font-size: calc(96px * var(--bh-texto, 1));
      font-weight: 950;
      letter-spacing: .06em;
      text-anchor: middle;
    }

    .bh-subtitulo {
      fill: #e8a33d40;
      font-size: calc(48px * var(--bh-texto, 1));
      font-weight: 850;
      text-anchor: middle;
    }

    #room .rack {
      z-index: 10;
    }

    .map-title {
      align-items: center;
    }

    .bh-zoom-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bh-zoom-controls .edit-status {
      margin-right: 8px;
    }

    .bh-zoom-controls .zoom-btn {
      min-width: 34px;
      padding: 6px 10px;
    }

    #room .rack.bh-fileira {
      padding: 4px 8px;
      border-width: 2px;
      border-radius: 4px;
      background-image:
        linear-gradient(
          145deg,
          #2a2e34,
          #22252a
        );
    }

    /*
     * Fileira fica sempre dentro do proprio contorno: sem sombra,
     * sem crescer no destaque da busca e sem subir no hover, para
     * nao invadir paredes e canaletas.
     */
    #room .rack.bh-fileira,
    #room .rack.bh-fileira:hover {
      transform: none;
      box-shadow: none;
    }

    #room .rack.bh-fileira:hover {
      border-color: #b8bcc2;
    }

    #room.searching .rack.bh-fileira.match {
      transform: none;
      background-image: none;
      background-color: #f5b5442e;
      border-color: #f5b544;
      box-shadow:
        inset 0 0 0 1px #f5b544,
        inset 0 0 22px #f5b5445c;
    }

    #room.searching .rack.bh-fileira:not(.match) {
      transform: none;
    }

    #room.editing .rack.bh-fileira.dragging {
      box-shadow:
        inset 0 0 0 2px #7cb4e8;
    }

    #room .rack.bh-fileira::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    #room .rack.bh-fileira.horizontal::after {
      background-image:
        linear-gradient(
          90deg,
          transparent calc(100% - 1px),
          #3e434a calc(100% - 1px)
        );
      background-size:
        calc(100% / var(--bh-racks, 1)) 100%;
    }

    #room .rack.bh-fileira.vertical::after {
      background-image:
        linear-gradient(
          180deg,
          transparent calc(100% - 1px),
          #3e434a calc(100% - 1px)
        );
      background-size:
        100% calc(100% / var(--bh-racks, 1));
    }

    #room .rack.bh-fileira .id,
    #room .rack.bh-fileira .owner {
      position: relative;
      z-index: 1;
    }

    #room .rack.bh-fileira .id {
      font-size: calc(14px * var(--bh-texto, 1));
    }

    #room .rack.bh-fileira .owner {
      font-size: calc(10px * var(--bh-texto, 1));
    }
  `;

  document.head.appendChild(
    style
  );
}


const renderBeforeBhPlanta =
  render;


render =
  function renderBhPlanta(
    ...args
  ) {
    applyBhFileiraSizes();
    drawBhPlanta();

    const result =
      renderBeforeBhPlanta(
        ...args
      );

    markBhFileiraElements();

    return result;
  };


const changeActiveRoomBeforeBhPlanta =
  changeActiveRoom;


changeActiveRoom =
  function changeActiveRoomWithBhPlanta(
    roomKey
  ) {
    const result =
      changeActiveRoomBeforeBhPlanta(
        roomKey
      );

    roomWrap.scrollLeft = 0;
    roomWrap.scrollTop = 0;

    return result;
  };


installBhPlantaStyles();
installBhZoomControls();

// primeira visita: comeca mostrando a sala inteira
if (!bhZoom) {
  bhZoom = getBhZoomAjustado();
  updateBhZoomLabel();
}

render();
