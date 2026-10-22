const equipmentVisual44UApplied = true;


function installEquipmentVisualStyles() {
  if (
    document.getElementById(
      "equipmentVisual44UStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement("style");

  style.id =
    "equipmentVisual44UStyles";

  style.textContent = `
    .rack-face-grid {
      grid-template-columns:
        repeat(8, minmax(0, 1fr));
      grid-template-rows:
        repeat(44, minmax(0, 1fr));
    }

    .rack-cell {
      min-width: 0;
      min-height: 0;
    }

    .rack-equipment {
      min-width: 0;
      min-height: 0;
      margin: 1px;
      padding: 1px 4px;
      font-size: 9px;
      line-height: 1;
      font-weight: 700;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      position: relative;
      z-index: 2;
    }

    .rack-equipment:hover,
    .rack-equipment:focus-visible {
      z-index: 20;
      overflow: visible;
      white-space: nowrap;
      text-overflow: clip;
      background: #205979;
      border-color: #7bdbff;
      color: #ffffff;
      box-shadow:
        0 0 0 2px #55dcff66,
        0 7px 20px #000000aa;
      filter: brightness(1.2);
      outline: none;
    }

    .rack-equipment.editable:hover,
    .rack-equipment.editable:focus-visible {
      border-color: #f59e0b;
      box-shadow:
        0 0 0 2px #f59e0b77,
        0 7px 20px #000000aa;
    }

    .rack-equipment[data-units="1"] {
      padding-top: 0;
      padding-bottom: 0;
      font-size: 8px;
      line-height: 1;
    }
  `;

  document.head.appendChild(style);
}


function createRackCell44U(
  grid,
  row,
  column
) {
  const cell =
    document.createElement("div");

  cell.className = "rack-cell";

  cell.style.gridRow =
    String(row);

  cell.style.gridColumn =
    String(column);

  cell.dataset.ru =
    String(45 - row);

  cell.dataset.module =
    String(column);

  cell.title =
    "Rack "
    + column
    + " - U"
    + (45 - row);

  grid.appendChild(cell);
}


function createRackEquipment44U(
  rack,
  item
) {
  const equipment =
    document.createElement("button");

  equipment.type = "button";

  equipment.className =
    "rack-equipment"
    + (editMode ? " editable" : "");

  equipment.dataset.itemId =
    String(
      item.id
      || item.equipmentKey
      || ""
    );

  const moduleNumber = Number(
    item.moduloRack
    || item.column
    || 1
  );

  const start = Number(
    item.start
    || 1
  );

  const units = Number(
    item.units
    || 1
  );

  const highestOccupiedRu =
    start + units - 1;

  const rowStart =
    45 - highestOccupiedRu;

  const rowEnd =
    rowStart + units;

  equipment.dataset.module =
    String(moduleNumber);

  equipment.dataset.start =
    String(start);

  equipment.dataset.units =
    String(units);

  equipment.style.gridColumn =
    String(moduleNumber);

  equipment.style.gridRow =
    rowStart
    + " / "
    + rowEnd;

  const equipmentName =
    String(
      item.name
      || "Equipamento sem nome"
    );

  equipment.textContent =
    "U"
    + start
    + " "
    + equipmentName;

  equipment.title =
    equipmentName
    + "\nModulo "
    + moduleNumber
    + "\nU"
    + start
    + " a U"
    + highestOccupiedRu
    + "\nAltura: "
    + units
    + "U";

  equipment.setAttribute(
    "aria-label",
    equipmentName
    + ", rack "
    + moduleNumber
    + ", U"
    + start
    + ", altura "
    + units
    + "U"
  );

  equipment.onclick = () => {
    if (!rackPanMoved) {
      showEquipmentModal(
        rack,
        item
      );
    }

    rackPanMoved = false;
  };

  return equipment;
}


function renderRackWorkspace(rack) {
  installEquipmentVisualStyles();

  const body =
    document.querySelector(
      ".drawer-body"
    );

  body.innerHTML = `
    <div class="rack-workspace">
      <div class="rack-toolbar">
        <input
          id="rackSearch"
          class="rack-search"
          placeholder="Buscar equipamento nesta fileira"
        >
        <div class="zoom-bar">
          <button
            id="rackZoomOut"
            class="zoom-btn"
            type="button"
          >-</button>
          <span
            id="rackZoomValue"
            class="zoom-value"
          >100%</span>
          <button
            id="rackZoomReset"
            class="zoom-btn"
            type="button"
          >100%</button>
          <button
            id="rackZoomIn"
            class="zoom-btn"
            type="button"
          >+</button>
        </div>
        ${
          editMode
            ? `
              <button
                id="addItemButton"
                class="mini-btn primary"
                type="button"
              >
                + Adicionar equipamento
              </button>
              <button
                id="editRackButton"
                class="mini-btn"
                type="button"
              >
                Editar fileira
              </button>
            `
            : ""
        }
      </div>
      <div
        id="rackViewport"
        class="rack-viewport"
      >
        <div
          id="rackStage"
          class="rack-stage"
        >
          <div
            id="rackFaceGrid"
            class="rack-face-grid"
          ></div>
        </div>
      </div>
    </div>
  `;

  const grid =
    document.getElementById(
      "rackFaceGrid"
    );

  for (
    let row = 1;
    row <= 44;
    row += 1
  ) {
    for (
      let column = 1;
      column <= 8;
      column += 1
    ) {
      createRackCell44U(
        grid,
        row,
        column
      );
    }
  }

  const rackItems =
    Array.isArray(rack.items)
      ? rack.items
      : [];

  rackItems.forEach(item => {
    const equipment =
      createRackEquipment44U(
        rack,
        item
      );

    grid.appendChild(equipment);
  });

  document.getElementById(
    "rackSearch"
  ).oninput = event => {
    filterRackItems(
      rack,
      event.target.value
    );
  };

  document.getElementById(
    "rackZoomOut"
  ).onclick = () => {
    setRackZoom(
      rackZoom - 0.1
    );
  };

  document.getElementById(
    "rackZoomIn"
  ).onclick = () => {
    setRackZoom(
      rackZoom + 0.1
    );
  };

  document.getElementById(
    "rackZoomReset"
  ).onclick = () => {
    setRackZoom(1);
  };

  const rackViewport =
    document.getElementById(
      "rackViewport"
    );

  rackViewport.addEventListener(
    "wheel",
    event => event.preventDefault(),
    {
      passive: false
    }
  );

  rackViewport.addEventListener(
    "pointerdown",
    startRackPan
  );

  rackViewport.addEventListener(
    "pointermove",
    moveRackPan
  );

  rackViewport.addEventListener(
    "pointerup",
    endRackPan
  );

  rackViewport.addEventListener(
    "pointercancel",
    endRackPan
  );

  if (editMode) {
    document.getElementById(
      "addItemButton"
    ).onclick = () => {
      showItemForm(rack);
    };

    document.getElementById(
      "editRackButton"
    ).onclick = () => {
      showRackForm(rack);
    };
  }

  setRackZoom(rackZoom);
}


installEquipmentVisualStyles();