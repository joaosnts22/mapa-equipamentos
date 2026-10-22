const patchMapUiApplied = true;


function patchMapEscape(value) {
  return String(
    value ?? ""
  ).replace(
    /[&<>'"]/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      "\"": "&quot;"
    })[character]
  );
}


function patchMapEmptyPositions() {
  return Array.from(
    {
      length: 32
    },
    (_, index) => ({
      id: null,
      equipamento_key: "",
      numero_posicao: index + 1,
      nome_entrada: null,
      nome_saida: null,
      versao_dados: 1
    })
  );
}


function patchMapReadError(
  data,
  fallback
) {
  if (
    typeof data?.detail === "string"
  ) {
    return data.detail;
  }

  if (
    typeof data?.detail?.mensagem
    === "string"
  ) {
    return data.detail.mensagem;
  }

  if (
    typeof data?.mensagem === "string"
  ) {
    return data.mensagem;
  }

  return fallback;
}


function ensurePatchMapStyles() {
  if (
    document.getElementById(
      "patchMapStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id = "patchMapStyles";

  style.textContent = `
    .drawer-body.patch-map-active {
      overflow: hidden !important;
      padding: 12px !important;
    }

    .item-form.patch-map-form {
      height: calc(100vh - 115px);
      min-height: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .item-form.patch-map-form > h3,
    .item-form.patch-map-form > .edit-hint {
      display: none;
    }

    .patch-map-toggle {
      flex: 0 0 auto;
      margin-bottom: 10px;
    }

    .patch-map-toggle .form-field {
      display: block !important;
    }

    .patch-map-context {
      flex: 0 0 auto;
      display: grid;
      grid-template-columns:
        minmax(220px, 2fr)
        minmax(180px, 1fr)
        minmax(140px, .8fr)
        minmax(105px, .5fr)
        minmax(105px, .5fr);
      gap: 9px;
      margin-bottom: 10px;
      padding: 10px;
      border: 1px solid #26384e;
      border-radius: 11px;
      background: #091728;
    }

    .patch-map-context-title {
      grid-column: 1 / -1;
      margin: 0;
      color: #55dcff;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .06em;
    }

    .patch-map-context .form-field {
      display: block !important;
      grid-column: auto !important;
      min-width: 0;
    }

    .patch-map-context .form-field label {
      color: #8da2ba;
    }

    .patch-map-area {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 14px;
      border: 1px solid #22d3ee55;
      border-radius: 13px;
      background:
        radial-gradient(
          circle at 50% 0,
          #123252 0,
          transparent 42%
        ),
        #061321;
      overflow: hidden;
    }

    .patch-map-head {
      flex: 0 0 auto;
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 8px;
    }

    .patch-map-title {
      margin: 0;
      color: #edf4fb;
      font-size: 19px;
      font-weight: 900;
    }

    .patch-map-help {
      margin: 4px 0 0;
      color: #8da2ba;
      font-size: 11px;
    }

    .patch-map-status {
      padding: 6px 10px;
      border: 1px solid #26384e;
      border-radius: 8px;
      background: #0c1828;
      color: #8da2ba;
      font-size: 10px;
      font-weight: 900;
      white-space: nowrap;
    }

    .patch-map-status.ready {
      color: #86efac;
      border-color: #22c55e66;
    }

    .patch-map-status.loading {
      color: #55dcff;
      border-color: #22d3ee66;
    }

    .patch-map-status.error {
      color: #fecaca;
      border-color: #ef444488;
      background: #4a1d24;
    }

    .patch-map-viewport {
      flex: 1 1 auto;
      min-height: 270px;
      overflow-x: auto;
      overflow-y: hidden;
      cursor: grab;
      user-select: none;
      border: 1px solid #26384e;
      border-radius: 12px;
      background:
        linear-gradient(
          180deg,
          #07111f,
          #050b13
        );
      scrollbar-color: #35516d #07111f;
      scrollbar-width: thin;
    }

    .patch-map-viewport.dragging {
      cursor: grabbing;
    }

    .patch-map-track {
      min-width: max-content;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 0;
      padding: 44px 32px;
    }

    .patch-map-position {
      position: relative;
      flex: 0 0 118px;
      height: 210px;
      border: 0;
      border-left: 2px solid #68829c;
      border-top: 3px solid #68829c;
      border-bottom: 3px solid #68829c;
      background:
        linear-gradient(
          180deg,
          #14273a 0,
          #0a1624 48%,
          #07111f 49%,
          #132438 100%
        );
      color: #edf4fb;
      cursor: pointer;
      outline: none;
      transition:
        background .15s,
        transform .15s,
        box-shadow .15s;
    }

    .patch-map-position:last-child {
      border-right: 2px solid #68829c;
    }

    .patch-map-position::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 2px;
      background: #68829c;
      transform: translateY(-1px);
    }

    .patch-map-position:hover,
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

    .patch-map-position.filled {
      background:
        linear-gradient(
          180deg,
          #173d55 0,
          #0a2233 48%,
          #071927 49%,
          #173248 100%
        );
    }

    .patch-map-position-number {
      position: absolute;
      z-index: 2;
      left: 50%;
      top: 50%;
      transform: translate(
        -50%,
        -50%
      );
      min-width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      border: 1px solid #55dcff88;
      border-radius: 50%;
      background: #061321;
      color: #55dcff;
      font-size: 13px;
      font-weight: 950;
    }

    .patch-map-input-name,
    .patch-map-output-name {
      position: absolute;
      z-index: 3;
      left: 5px;
      right: 5px;
      min-height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      overflow: hidden;
      color: #edf4fb;
      font-size: 10px;
      font-weight: 800;
      line-height: 1.15;
      text-align: center;
      overflow-wrap: anywhere;
    }

    .patch-map-input-name {
      top: calc(100% + 7px);
      color: #86efac;
    }

    .patch-map-output-name {
      bottom: calc(100% + 7px);
      color: #f9a8d4;
    }

    .patch-map-empty-name {
      color: #5f7892;
      font-weight: 700;
    }

    .patch-map-connector {
      position: absolute;
      z-index: 2;
      left: 50%;
      width: 38px;
      height: 38px;
      border: 3px solid #90a8bf;
      border-radius: 50%;
      background:
        radial-gradient(
          circle,
          #020509 0 27%,
          #172536 30% 55%,
          #020509 58%
        );
      transform: translateX(-50%);
    }

    .patch-map-connector.input {
      bottom: 26px;
    }

    .patch-map-connector.output {
      top: 26px;
    }

    .patch-map-position.filled
    .patch-map-connector {
      border-color: #55dcff;
      box-shadow: 0 0 13px #22d3ee55;
    }

    .patch-map-disabled-note {
      flex: 0 0 auto;
      margin: 9px 0 0;
      color: #ffd58a;
      font-size: 11px;
    }

    .patch-map-form .form-actions {
      flex: 0 0 auto;
      margin-top: 10px;
    }

    .patch-position-modal {
      position: fixed;
      inset: 0;
      z-index: 120;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #000c;
      backdrop-filter: blur(6px);
    }

    .patch-position-modal.open {
      display: flex;
    }

    .patch-position-dialog {
      width: min(670px, 100%);
      max-height: 92vh;
      overflow: auto;
      padding: 20px;
      border: 1px solid #35516d;
      border-radius: 17px;
      background: #081424;
      box-shadow: 0 30px 80px #000a;
    }

    .patch-position-dialog-head {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 15px;
    }

    .patch-position-dialog-title {
      margin: 0;
      color: #edf4fb;
      font-size: 24px;
    }

    .patch-position-dialog-subtitle {
      margin: 4px 0 0;
      color: #8da2ba;
      font-size: 11px;
    }

    .patch-position-close {
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 10px;
      background: #17283c;
      color: #fff;
      font-size: 22px;
      cursor: pointer;
    }

    .patch-position-editor-layout {
      display: grid;
      grid-template-columns:
        minmax(220px, .85fr)
        minmax(260px, 1.15fr);
      gap: 22px;
      align-items: center;
    }

    .patch-position-physical {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 420px;
      padding: 18px;
      border: 1px solid #26384e;
      border-radius: 13px;
      background: #050b13;
    }

    .patch-position-module {
      position: relative;
      width: 190px;
      height: 380px;
      border: 5px solid #90a8bf;
      background:
        linear-gradient(
          180deg,
          #132438 0,
          #08131f 49.6%,
          #132438 50.4%,
          #08131f 100%
        );
    }

    .patch-position-module::after {
      content: "";
      position: absolute;
      left: 0;
      right: 0;
      top: 50%;
      height: 5px;
      background: #90a8bf;
      transform: translateY(-2.5px);
    }

    .patch-position-big-connector {
      position: absolute;
      left: 50%;
      width: 82px;
      height: 82px;
      border: 5px solid #edf4fb;
      border-radius: 50%;
      background:
        radial-gradient(
          circle,
          #020509 0 27%,
          #26384e 30% 55%,
          #020509 58%
        );
      transform: translateX(-50%);
    }

    .patch-position-big-connector.input {
      bottom: 53px;
    }

    .patch-position-big-connector.output {
      top: 53px;
    }

    .patch-position-visual-input,
    .patch-position-visual-output {
      position: absolute;
      left: 50%;
      width: 240px;
      color: #edf4fb;
      font-size: 13px;
      font-weight: 850;
      text-align: center;
      overflow-wrap: anywhere;
      transform: translateX(-50%);
    }

    .patch-position-visual-input {
      top: calc(100% + 12px);
      color: #86efac;
    }

    .patch-position-visual-output {
      bottom: calc(100% + 12px);
      color: #f9a8d4;
    }

    .patch-position-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .patch-position-field label {
      display: block;
      margin-bottom: 6px;
      color: #8da2ba;
      font-size: 10px;
      font-weight: 900;
    }

    .patch-position-field input {
      width: 100%;
      border: 1px solid #26384e;
      border-radius: 9px;
      background: #07111f;
      color: #edf4fb;
      padding: 11px;
      outline: none;
    }

    .patch-position-field input:focus {
      border-color: #22d3ee;
      box-shadow: 0 0 0 2px #22d3ee22;
    }

    .patch-position-error {
      display: none;
      padding: 10px;
      border: 1px solid #ef4444;
      border-radius: 9px;
      background: #4a1d24;
      color: #fecaca;
      font-size: 11px;
    }

    .patch-position-error.show {
      display: block;
    }

    .patch-position-actions {
      display: flex;
      justify-content: flex-end;
      gap: 9px;
      margin-top: 6px;
    }

    @media (max-width: 850px) {
      .patch-map-context {
        grid-template-columns:
          1fr 1fr;
      }

      .patch-position-editor-layout {
        grid-template-columns: 1fr;
      }

      .patch-position-physical {
        min-height: 390px;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


function patchMapGetDatabaseId(
  item
) {
  const databaseId = Number(
    item?.databaseId
  );

  return (
    Number.isInteger(databaseId)
    && databaseId > 0
  )
    ? databaseId
    : null;
}


function patchMapField(
  fieldId
) {
  return document
    .getElementById(fieldId)
    ?.closest(".form-field")
    || null;
}


function patchMapCreatePlaceholder(
  field
) {
  if (field.__patchMapPlaceholder) {
    return;
  }

  const placeholder =
    document.createComment(
      "patch-map-field"
    );

  field.parentNode.insertBefore(
    placeholder,
    field
  );

  field.__patchMapPlaceholder =
    placeholder;
}


function patchMapRestoreField(
  field
) {
  const placeholder =
    field.__patchMapPlaceholder;

  if (
    placeholder
    && placeholder.parentNode
  ) {
    placeholder.parentNode.replaceChild(
      field,
      placeholder
    );
  }

  delete field.__patchMapPlaceholder;
}


function createPatchPositionModal() {
  let modal =
    document.getElementById(
      "patchPositionModal"
    );

  if (modal) {
    return modal;
  }

  modal =
    document.createElement(
      "div"
    );

  modal.id =
    "patchPositionModal";

  modal.className =
    "patch-position-modal";

  modal.innerHTML = `
    <section class="patch-position-dialog">
      <div class="patch-position-dialog-head">
        <div>
          <h3
            class="patch-position-dialog-title"
            id="patchPositionTitle"
          >
            Posição
          </h3>

          <p class="patch-position-dialog-subtitle">
            Edite somente a entrada e a saída
            desta posição física.
          </p>
        </div>

        <button
          type="button"
          class="patch-position-close"
          id="patchPositionClose"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <div class="patch-position-editor-layout">
        <div class="patch-position-physical">
          <div class="patch-position-module">
            <div
              class="patch-position-visual-input"
              id="patchVisualInput"
            >
              Entrada não informada
            </div>

            <div
              class="
                patch-position-big-connector
                input
              "
            ></div>

            <div
              class="
                patch-position-big-connector
                output
              "
            ></div>

            <div
              class="patch-position-visual-output"
              id="patchVisualOutput"
            >
              Saída não informada
            </div>
          </div>
        </div>

        <div class="patch-position-form">
          <div class="patch-position-field">
            <label for="patchPositionOutput">
              NOME DA SAÍDA
            </label>

            <input
              id="patchPositionOutput"
              maxlength="200"
              placeholder="Ex.: Matriz 01"
            >
          </div>

          <div class="patch-position-field">
            <label for="patchPositionInput">
              NOME DA ENTRADA
            </label>

            <input
              id="patchPositionInput"
              maxlength="200"
              placeholder="Ex.: Câmera 01"
            >
          </div>

          <div
            class="patch-position-error"
            id="patchPositionError"
          ></div>

          <div class="patch-position-actions">
            <button
              type="button"
              class="mini-btn"
              id="patchPositionCancel"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="mini-btn primary"
              id="patchPositionSave"
            >
              Salvar posição
            </button>
          </div>
        </div>
      </div>
    </section>
  `;

  document.body.appendChild(
    modal
  );

  const closeModal = () => {
    modal.classList.remove(
      "open"
    );
  };

  document.getElementById(
    "patchPositionClose"
  ).onclick = closeModal;

  document.getElementById(
    "patchPositionCancel"
  ).onclick = closeModal;

  modal.addEventListener(
    "click",
    event => {
      if (event.target === modal) {
        closeModal();
      }
    }
  );

  return modal;
}


function patchMapRenderTrack(
  container,
  positions,
  editable
) {
  const positionMarkup =
    positions.map(
      position => {
        const number = Number(
          position.numero_posicao
        );

        const inputName =
          String(
            position.nome_entrada
            || ""
          ).trim();

        const outputName =
          String(
            position.nome_saida
            || ""
          ).trim();

        const filled =
          Boolean(
            inputName
            || outputName
          );

        return `
          <button
            type="button"
            class="
              patch-map-position
              ${filled ? "filled" : ""}
            "
            data-patch-number="${number}"
            ${editable ? "" : "disabled"}
            title="Posição ${number}"
          >
            <span
              class="
                patch-map-input-name
                ${inputName
                  ? ""
                  : "patch-map-empty-name"}
              "
            >
              ${patchMapEscape(
                inputName
                || "Entrada vazia"
              )}
            </span>

            <span
              class="
                patch-map-connector
                input
              "
            ></span>

            <span
              class="patch-map-position-number"
            >
              ${number}
            </span>

            <span
              class="
                patch-map-connector
                output
              "
            ></span>

            <span
              class="
                patch-map-output-name
                ${outputName
                  ? ""
                  : "patch-map-empty-name"}
              "
            >
              ${patchMapEscape(
                outputName
                || "Saída vazia"
              )}
            </span>
          </button>
        `;
      }
    ).join("");

  container.innerHTML = `
    <div class="patch-map-head">
      <div>
        <h4 class="patch-map-title">
          Patch 32 × 32
        </h4>

        <p class="patch-map-help">
          Arraste horizontalmente para navegar.
          Clique em uma posição para editar.
        </p>
      </div>

      <span
        class="
          patch-map-status
          ${editable ? "ready" : ""}
        "
        id="patchMapStatus"
      >
        ${editable
          ? "32 POSIÇÕES"
          : "CRIE O PATCH PRIMEIRO"}
      </span>
    </div>

    <div
      class="patch-map-viewport"
      id="patchMapViewport"
    >
      <div class="patch-map-track">
        ${positionMarkup}
      </div>
    </div>

    <p class="patch-map-disabled-note">
      ${editable
        ? (
            "Os nomes acima representam entradas. "
            + "Os nomes abaixo representam saídas."
          )
        : (
            "Informe o nome e a posição física, "
            + "depois clique em Criar equipamento. "
            + "Reabra o patch para editar posições."
          )}
    </p>
  `;

  installPatchMapNavigation(
    container,
    positions,
    editable
  );
}


function installPatchMapNavigation(
  container,
  positions,
  editable
) {
  const viewport =
    container.querySelector(
      "#patchMapViewport"
    );

  if (!viewport) {
    return;
  }

  let dragState = null;
  let moved = false;

  viewport.addEventListener(
    "pointerdown",
    event => {
      if (event.button !== 0) {
        return;
      }

      moved = false;

      dragState = {
        pointerId:
          event.pointerId,
        clientX:
          event.clientX,
        scrollLeft:
          viewport.scrollLeft
      };

      viewport.classList.add(
        "dragging"
      );

      viewport.setPointerCapture(
        event.pointerId
      );
    }
  );

  viewport.addEventListener(
    "pointermove",
    event => {
      if (
        !dragState
        || event.pointerId
        !== dragState.pointerId
      ) {
        return;
      }

      const difference =
        event.clientX
        - dragState.clientX;

      if (
        Math.abs(difference) > 4
      ) {
        moved = true;
      }

      viewport.scrollLeft =
        dragState.scrollLeft
        - difference;
    }
  );

  const finishDrag = event => {
    if (!dragState) {
      return;
    }

    try {
      viewport.releasePointerCapture(
        event.pointerId
      );
    } catch {
      // O ponteiro já pode ter sido liberado.
    }

    dragState = null;

    viewport.classList.remove(
      "dragging"
    );
  };

  viewport.addEventListener(
    "pointerup",
    finishDrag
  );

  viewport.addEventListener(
    "pointercancel",
    finishDrag
  );

  viewport.addEventListener(
    "wheel",
    event => {
      if (
        Math.abs(event.deltaY)
        > Math.abs(event.deltaX)
      ) {
        event.preventDefault();

        viewport.scrollLeft +=
          event.deltaY;
      }
    },
    {
      passive: false
    }
  );

  viewport.addEventListener(
    "click",
    event => {
      const button =
        event.target.closest(
          "[data-patch-number]"
        );

      if (
        !button
        || moved
        || !editable
      ) {
        moved = false;
        return;
      }

      const positionNumber =
        Number(
          button.dataset
            .patchNumber
        );

      const position =
        positions.find(
          item =>
            Number(
              item.numero_posicao
            )
            === positionNumber
        );

      if (position) {
        openPatchPositionEditor(
          position
        );
      }
    }
  );
}


function patchMapUpdateVisualPreview() {
  const input =
    document.getElementById(
      "patchPositionInput"
    );

  const output =
    document.getElementById(
      "patchPositionOutput"
    );

  const visualInput =
    document.getElementById(
      "patchVisualInput"
    );

  const visualOutput =
    document.getElementById(
      "patchVisualOutput"
    );

  if (visualInput) {
    visualInput.textContent =
      input?.value.trim()
      || "Entrada não informada";
  }

  if (visualOutput) {
    visualOutput.textContent =
      output?.value.trim()
      || "Saída não informada";
  }
}


function openPatchPositionEditor(
  position
) {
  const modal =
    createPatchPositionModal();

  const context =
    window.patchMapContext;

  if (
    !context?.databaseId
  ) {
    window.alert(
      "Crie o equipamento patch "
      + "antes de editar as posições."
    );

    return;
  }

  const positionNumber =
    Number(
      position.numero_posicao
    );

  document.getElementById(
    "patchPositionTitle"
  ).textContent =
    "Posição "
    + String(positionNumber)
      .padStart(2, "0");

  const input =
    document.getElementById(
      "patchPositionInput"
    );

  const output =
    document.getElementById(
      "patchPositionOutput"
    );

  const errorBox =
    document.getElementById(
      "patchPositionError"
    );

  input.value =
    position.nome_entrada
    || "";

  output.value =
    position.nome_saida
    || "";

  errorBox.textContent = "";
  errorBox.classList.remove(
    "show"
  );

  input.oninput =
    patchMapUpdateVisualPreview;

  output.oninput =
    patchMapUpdateVisualPreview;

  patchMapUpdateVisualPreview();

  const saveButton =
    document.getElementById(
      "patchPositionSave"
    );

  saveButton.onclick =
    async () => {
      saveButton.disabled = true;

      const originalText =
        saveButton.textContent;

      saveButton.textContent =
        "Salvando...";

      try {
        await savePatchPosition(
          position,
          input.value,
          output.value
        );

        modal.classList.remove(
          "open"
        );

      } catch (error) {
        console.error(
          "Falha ao salvar posição.",
          error
        );

        errorBox.textContent =
          error.message
          || (
            "Não foi possível salvar "
            + "a posição."
          );

        errorBox.classList.add(
          "show"
        );

      } finally {
        saveButton.disabled = false;
        saveButton.textContent =
          originalText;
      }
    };

  modal.classList.add(
    "open"
  );

  window.setTimeout(
    () => input.focus(),
    0
  );
}


async function savePatchPosition(
  position,
  inputName,
  outputName
) {
  const context =
    window.patchMapContext;

  const databaseId =
    Number(
      context?.databaseId
    );

  const positionNumber =
    Number(
      position.numero_posicao
    );

  if (
    !Number.isInteger(databaseId)
    || databaseId < 1
  ) {
    throw new Error(
      "O patch não possui databaseId válido."
    );
  }

  const trimmedInput =
    String(inputName || "").trim();

  const trimmedOutput =
    String(outputName || "").trim();

  const payload = {
    versao_dados:
      position.id
        ? Number(
            position.versao_dados
            || 1
          )
        : null,
    nome_entrada:
      trimmedInput || null,
    nome_saida:
      trimmedOutput || null
  };

  const response = await fetch(
    "/api/equipamentos/"
    + databaseId
    + "/patch/"
    + positionNumber,
    {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type":
          "application/json",
        "Accept":
          "application/json"
      },
      body: JSON.stringify(
        payload
      )
    }
  );

  if (response.status === 401) {
    authenticatedUser = null;
    applyAuthenticationState();

    throw new Error(
      "A sessão administrativa expirou."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "O usuário atual não possui "
      + "permissão para editar o patch."
    );
  }

  if (!response.ok) {
    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    throw new Error(
      patchMapReadError(
        data,
        "A API respondeu com HTTP "
        + response.status
        + "."
      )
    );
  }

  const savedPosition =
    await response.json();

  const existingIndex =
    context.positions.findIndex(
      item =>
        Number(
          item.numero_posicao
        )
        === positionNumber
    );

  if (existingIndex >= 0) {
    context.positions[
      existingIndex
    ] = savedPosition;
  }

  const container =
    document.getElementById(
      "patchMapArea"
    );

  if (container) {
    patchMapRenderTrack(
      container,
      context.positions,
      true
    );
  }

  showStatus(
    "POSIÇÃO "
    + positionNumber
    + " SALVA"
  );

  return savedPosition;
}


async function loadPatchMapPositions(
  item,
  container
) {
  const databaseId =
    patchMapGetDatabaseId(
      item
    );

  window.patchMapContext = {
    databaseId,
    item,
    positions:
      patchMapEmptyPositions()
  };

  if (!databaseId) {
    patchMapRenderTrack(
      container,
      window.patchMapContext
        .positions,
      false
    );

    return;
  }

  container.innerHTML = `
    <div class="patch-map-head">
      <div>
        <h4 class="patch-map-title">
          Patch 32 × 32
        </h4>

        <p class="patch-map-help">
          Carregando posições...
        </p>
      </div>

      <span
        class="
          patch-map-status
          loading
        "
      >
        CARREGANDO
      </span>
    </div>
  `;

  try {
    const response = await fetch(
      "/api/equipamentos/"
      + databaseId
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
      let data = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      throw new Error(
        patchMapReadError(
          data,
          "Não foi possível carregar "
          + "as posições."
        )
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
        "A API retornou "
        + positions.length
        + " posições. Eram esperadas 32."
      );
    }

    window.patchMapContext
      .positions =
        positions;

    patchMapRenderTrack(
      container,
      positions,
      true
    );

  } catch (error) {
    console.error(
      "Falha ao carregar o mapa "
      + "do patch.",
      error
    );

    container.innerHTML = `
      <div class="patch-map-head">
        <div>
          <h4 class="patch-map-title">
            Patch 32 × 32
          </h4>

          <p class="patch-map-help">
            ${patchMapEscape(
              error.message
              || "Erro ao carregar."
            )}
          </p>
        </div>

        <span
          class="
            patch-map-status
            error
          "
        >
          ERRO
        </span>
      </div>
    `;
  }
}


function deactivatePhysicalPatchMap() {
  const form =
    document.querySelector(
      ".item-form"
    );

  const formGrid =
    form?.querySelector(
      ".form-grid"
    );

  const drawerBody =
    document.querySelector(
      ".drawer-body"
    );

  const area =
    document.getElementById(
      "patchMapArea"
    );

  const context =
    document.getElementById(
      "patchMapContextFields"
    );

  const toggle =
    document.getElementById(
      "patchMapToggle"
    );

  const fields = [
    patchMapField("fName"),
    patchMapField("fRackKey"),
    patchMapField("fModule"),
    patchMapField("fStart"),
    patchMapField("fUnits"),
    document.getElementById(
      "fIsPatch"
    )?.closest(".form-field")
  ].filter(Boolean);

  for (const field of fields) {
    patchMapRestoreField(
      field
    );
  }

  area?.remove();
  context?.remove();
  toggle?.remove();

  formGrid
    ?.querySelectorAll(
      ":scope > .form-field"
    )
    .forEach(
      field => {
        field.style.display = "";
      }
    );

  form?.classList.remove(
    "patch-map-form"
  );

  drawerBody?.classList.remove(
    "patch-map-active"
  );

  window.patchMapContext = null;
}


function activatePhysicalPatchMap(
  item
) {
  ensurePatchMapStyles();

  const checkbox =
    document.getElementById(
      "fIsPatch"
    );

  const form =
    checkbox?.closest(
      ".item-form"
    );

  const formGrid =
    form?.querySelector(
      ".form-grid"
    );

  const drawerBody =
    document.querySelector(
      ".drawer-body"
    );

  if (
    !checkbox
    || !form
    || !formGrid
  ) {
    return;
  }

  form.classList.add(
    "patch-map-form"
  );

  drawerBody?.classList.add(
    "patch-map-active"
  );

  const toggleField =
    checkbox.closest(
      ".form-field"
    );

  const essentialFields = [
    patchMapField("fName"),
    patchMapField("fRackKey"),
    patchMapField("fModule"),
    patchMapField("fStart"),
    patchMapField("fUnits")
  ].filter(Boolean);

  formGrid
    .querySelectorAll(
      ":scope > .form-field"
    )
    .forEach(
      field => {
        field.style.display =
          field === toggleField
          || essentialFields.includes(
            field
          )
            ? ""
            : "none";
      }
    );

  let toggleContainer =
    document.getElementById(
      "patchMapToggle"
    );

  if (!toggleContainer) {
    toggleContainer =
      document.createElement(
        "div"
      );

    toggleContainer.id =
      "patchMapToggle";

    toggleContainer.className =
      "patch-map-toggle";

    formGrid.parentNode.insertBefore(
      toggleContainer,
      formGrid
    );
  }

  patchMapCreatePlaceholder(
    toggleField
  );

  toggleContainer.appendChild(
    toggleField
  );

  let context =
    document.getElementById(
      "patchMapContextFields"
    );

  if (!context) {
    context =
      document.createElement(
        "div"
      );

    context.id =
      "patchMapContextFields";

    context.className =
      "patch-map-context";

    const title =
      document.createElement(
        "p"
      );

    title.className =
      "patch-map-context-title";

    title.textContent =
      "IDENTIFICAÇÃO E POSIÇÃO FÍSICA";

    context.appendChild(
      title
    );

    formGrid.parentNode.insertBefore(
      context,
      formGrid
    );
  }

  for (
    const field
    of essentialFields
  ) {
    patchMapCreatePlaceholder(
      field
    );

    context.appendChild(
      field
    );
  }

  let area =
    document.getElementById(
      "patchMapArea"
    );

  if (!area) {
    area =
      document.createElement(
        "div"
      );

    area.id =
      "patchMapArea";

    area.className =
      "patch-map-area";

    formGrid.parentNode.insertBefore(
      area,
      formGrid
    );
  }

  formGrid.style.display =
    "none";

  loadPatchMapPositions(
    item,
    area
  );
}


function configurePhysicalPatchMap(
  item
) {
  const checkbox =
    document.getElementById(
      "fIsPatch"
    );

  if (!checkbox) {
    return;
  }

  checkbox.addEventListener(
    "change",
    () => {
      if (checkbox.checked) {
        activatePhysicalPatchMap(
          item
        );
      } else {
        deactivatePhysicalPatchMap();
      }
    }
  );

  if (checkbox.checked) {
    activatePhysicalPatchMap(
      item
    );
  }
}


const showItemFormBeforePatchMap =
  showItemForm;


showItemForm = function(
  rack,
  item = null
) {
  const result =
    showItemFormBeforePatchMap(
      rack,
      item
    );

  window.setTimeout(
    () => {
      configurePhysicalPatchMap(
        item
      );
    },
    20
  );

  return result;
};