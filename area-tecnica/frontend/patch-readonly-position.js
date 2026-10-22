const patchReadonlyPositionApplied = true;


let patchReadonlyEquipment = null;

let patchReadonlyPositions = [];


function resetPatchReadonlyPositionModal() {
  const input =
    document.getElementById(
      "patchPositionInput"
    );

  const output =
    document.getElementById(
      "patchPositionOutput"
    );

  const saveButton =
    document.getElementById(
      "patchPositionSave"
    );

  const cancelButton =
    document.getElementById(
      "patchPositionCancel"
    );

  if (input) {
    input.readOnly = false;
    input.disabled = false;
  }

  if (output) {
    output.readOnly = false;
    output.disabled = false;
  }

  if (saveButton) {
    saveButton.style.display = "";
  }

  if (cancelButton) {
    cancelButton.textContent =
      "Cancelar";
  }

  document
    .getElementById(
      "patchPositionModal"
    )
    ?.classList.remove(
      "readonly"
    );
}


function installPatchReadonlyPositionStyles() {
  if (
    document.getElementById(
      "patchReadonlyPositionStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "patchReadonlyPositionStyles";

  style.textContent = `
    #patchReadonlyMap
    .patch-map-position {
      cursor: pointer !important;
    }

    #patchReadonlyMap
    .patch-map-position:hover,
    #patchReadonlyMap
    .patch-map-position:focus-visible {
      z-index: 2;
      transform: translateY(-5px);
      background:
        linear-gradient(
          180deg,
          #194567 0,
          #0b2539 48%,
          #081b2b 49%,
          #173c5a 100%
        );
      box-shadow:
        0 0 0 2px #22d3ee,
        0 0 24px #22d3ee55;
    }

    .patch-position-modal.readonly
    .patch-position-dialog-subtitle {
      color: #86efac;
    }

    .patch-position-modal.readonly
    .patch-position-field input {
      cursor: default;
      border-color: #26384e;
      background: #0b1522;
      color: #edf4fb;
      opacity: 1;
    }

    .patch-position-modal.readonly
    .patch-position-field input:focus {
      border-color: #26384e;
      box-shadow: none;
    }

    .patch-position-modal.readonly
    .patch-position-physical {
      min-height: 480px;
      padding-top: 42px;
      padding-bottom: 42px;
      box-sizing: border-box;
    }

    .patch-readonly-badge {
      display: inline-flex;
      align-items: center;
      margin-top: 7px;
      padding: 5px 8px;
      border: 1px solid #22c55e66;
      border-radius: 8px;
      background: #0b251b;
      color: #86efac;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: .04em;
    }
  `;

  document.head.appendChild(
    style
  );
}


async function loadPatchReadonlyPositions(
  equipmentId
) {
  const response = await fetch(
    "/api/equipamentos/"
    + equipmentId
    + "/patch",
    {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Accept":
          "application/json"
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      "Não foi possível carregar "
      + "as posições do patch."
    );
  }

  const result =
    await response.json();

  const positions =
    Array.isArray(
      result?.posicoes
    )
      ? result.posicoes
      : [];

  if (positions.length !== 32) {
    throw new Error(
      "A API não retornou "
      + "as 32 posições."
    );
  }

  patchReadonlyPositions =
    positions;

  return positions;
}


function configureReadonlyMapPositions() {
  const map =
    document.getElementById(
      "patchReadonlyMap"
    );

  if (!map) {
    return;
  }

  map.querySelectorAll(
    ".patch-map-position"
  ).forEach(
    button => {
      button.disabled = false;

      button.setAttribute(
        "aria-label",
        "Consultar posição "
        + button.dataset.patchNumber
      );

      button.title =
        "Consultar posição "
        + button.dataset.patchNumber;
    }
  );

  const help =
    map.querySelector(
      ".patch-map-help"
    );

  if (help) {
    help.textContent =
      "Arraste horizontalmente para navegar. "
      + "Clique em uma posição para consultar.";
  }
}


async function openPatchReadonlyPosition(
  positionNumber
) {
  const equipmentId =
    Number(
      patchReadonlyEquipment
        ?.databaseId
    );

  if (
    !Number.isInteger(equipmentId)
    || equipmentId < 1
  ) {
    window.alert(
      "O patch não possui "
      + "databaseId válido."
    );

    return;
  }

  let position =
    patchReadonlyPositions.find(
      item =>
        Number(
          item.numero_posicao
        )
        === positionNumber
    );

  if (!position) {
    try {
      await loadPatchReadonlyPositions(
        equipmentId
      );

      position =
        patchReadonlyPositions.find(
          item =>
            Number(
              item.numero_posicao
            )
            === positionNumber
        );

    } catch (error) {
      console.error(
        "Falha ao carregar posição.",
        error
      );

      window.alert(
        error.message
        || (
          "Não foi possível "
          + "consultar a posição."
        )
      );

      return;
    }
  }

  if (!position) {
    return;
  }

  if (
    typeof createPatchPositionModal
    !== "function"
  ) {
    window.alert(
      "A interface singular "
      + "do patch não foi carregada."
    );

    return;
  }

  resetPatchReadonlyPositionModal();

  const modal =
    createPatchPositionModal();

  modal.classList.add(
    "readonly"
  );

  const title =
    document.getElementById(
      "patchPositionTitle"
    );

  const subtitle =
    modal.querySelector(
      ".patch-position-dialog-subtitle"
    );

  const input =
    document.getElementById(
      "patchPositionInput"
    );

  const output =
    document.getElementById(
      "patchPositionOutput"
    );

  const saveButton =
    document.getElementById(
      "patchPositionSave"
    );

  const cancelButton =
    document.getElementById(
      "patchPositionCancel"
    );

  const errorBox =
    document.getElementById(
      "patchPositionError"
    );

  if (title) {
    title.textContent =
      "Posição "
      + String(
          positionNumber
        ).padStart(
          2,
          "0"
        );
  }

  if (subtitle) {
    subtitle.innerHTML = `
      Visualização da posição física

      <span class="patch-readonly-badge">
        SOMENTE LEITURA
      </span>
    `;
  }

  if (input) {
    input.value =
      position.nome_entrada
      || "";

    input.readOnly = true;
  }

  if (output) {
    output.value =
      position.nome_saida
      || "";

    output.readOnly = true;
  }

  if (saveButton) {
    saveButton.style.display =
      "none";
  }

  if (cancelButton) {
    cancelButton.textContent =
      "Fechar";
  }

  if (errorBox) {
    errorBox.textContent = "";

    errorBox.classList.remove(
      "show"
    );
  }

  if (
    typeof patchMapUpdateVisualPreview
    === "function"
  ) {
    patchMapUpdateVisualPreview();
  }

  modal.classList.add(
    "open"
  );

  const previousContext =
    window.patchMapContext;

  window.patchMapContext = {
    databaseId:
      equipmentId,
    item:
      patchReadonlyEquipment,
    positions:
      patchReadonlyPositions,
    readonly:
      true
  };

  if (
    typeof ensurePatchConnectionIndicators
    === "function"
  ) {
    ensurePatchConnectionIndicators();
  }

  if (
    typeof loadPatchPositionConnections
    === "function"
  ) {
    await loadPatchPositionConnections(
      position
    );
  }

  modal.dataset
    .readonlyPreviousContext =
      previousContext
        ? "preserve"
        : "empty";
}


const showPatchReadonlyBeforePosition =
  showPatchReadonly;


showPatchReadonly =
  async function(
    rack,
    equipment
  ) {
    patchReadonlyEquipment =
      equipment;

    patchReadonlyPositions = [];

    const result =
      await showPatchReadonlyBeforePosition(
        rack,
        equipment
      );

    const equipmentId =
      Number(
        equipment?.databaseId
      );

    if (
      Number.isInteger(equipmentId)
      && equipmentId > 0
    ) {
      try {
        await loadPatchReadonlyPositions(
          equipmentId
        );

      } catch (error) {
        console.error(
          "Falha ao preparar consulta "
          + "das posições.",
          error
        );
      }
    }

    configureReadonlyMapPositions();

    return result;
  };


let patchReadonlyPointerState = null;


document.addEventListener(
  "pointerdown",
  event => {
    const target =
      event.target instanceof Element
        ? event.target
        : null;

    const positionButton =
      target?.closest(
        "#patchReadonlyMap "
        + ".patch-map-position"
      );

    if (!positionButton) {
      patchReadonlyPointerState =
        null;

      return;
    }

    patchReadonlyPointerState = {
      pointerId:
        event.pointerId,
      positionNumber:
        Number(
          positionButton.dataset
            .patchNumber
        ),
      startX:
        event.clientX,
      startY:
        event.clientY
    };
  },
  true
);


document.addEventListener(
  "pointerup",
  event => {
    const state =
      patchReadonlyPointerState;

    patchReadonlyPointerState =
      null;

    if (
      !state
      || event.pointerId
      !== state.pointerId
    ) {
      return;
    }

    const movementX =
      Math.abs(
        event.clientX
        - state.startX
      );

    const movementY =
      Math.abs(
        event.clientY
        - state.startY
      );

    if (
      movementX > 7
      || movementY > 7
    ) {
      return;
    }

    if (
      !Number.isInteger(
        state.positionNumber
      )
      || state.positionNumber < 1
      || state.positionNumber > 32
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    openPatchReadonlyPosition(
      state.positionNumber
    );
  },
  true
);


document.addEventListener(
  "click",
  event => {
    const target =
      event.target instanceof Element
        ? event.target
        : null;

    const map =
      target?.closest(
        "#patchReadonlyMap"
      );

    if (!map) {
      return;
    }

    const positionButton =
      target.closest(
        ".patch-map-position"
      );

    if (!positionButton) {
      return;
    }

    const positionNumber =
      Number(
        positionButton.dataset
          .patchNumber
      );

    if (
      !Number.isInteger(
        positionNumber
      )
      || positionNumber < 1
      || positionNumber > 32
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    openPatchReadonlyPosition(
      positionNumber
    );
  },
  true
);


document.getElementById(
  "patchPositionClose"
)?.addEventListener(
  "click",
  resetPatchReadonlyPositionModal
);


document.getElementById(
  "patchPositionCancel"
)?.addEventListener(
  "click",
  resetPatchReadonlyPositionModal
);


installPatchReadonlyPositionStyles();