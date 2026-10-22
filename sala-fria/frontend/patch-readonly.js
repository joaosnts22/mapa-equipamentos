const patchReadonlyApplied = true;


const showEquipmentModalBeforeReadonly =
  showEquipmentModal;


function resetPatchReadonlyModal() {
  const dialog =
    document.querySelector(
      "#equipmentModal .equipment-dialog"
    );

  const body =
    document.getElementById(
      "equipmentModalBody"
    );

  if (dialog) {
    dialog.style.width = "";
    dialog.style.maxWidth = "";
    dialog.style.height = "";
    dialog.style.maxHeight = "";
    dialog.style.display = "";
    dialog.style.flexDirection = "";
    dialog.style.overflow = "";
  }

  if (body) {
    body.style.flex = "";
    body.style.minHeight = "";
    body.style.display = "";
    body.style.flexDirection = "";
    body.style.overflow = "";
    body.innerHTML = "";
  }
}


function configurePatchReadonlyMap(
  mapContainer
) {
  const help =
    mapContainer.querySelector(
      ".patch-map-help"
    );

  if (help) {
    help.textContent =
      "Arraste horizontalmente para navegar. "
      + "Os nomes acima representam entradas. "
      + "Os nomes abaixo representam saidas.";
  }

  const status =
    mapContainer.querySelector(
      ".patch-map-status"
    );

  if (status) {
    status.textContent =
      "SOMENTE LEITURA";

    status.classList.add(
      "ready"
    );
  }

  const note =
    mapContainer.querySelector(
      ".patch-map-disabled-note"
    );

  if (note) {
    note.textContent =
      "Visualizacao somente para consulta.";
  }

  const positions =
    mapContainer.querySelectorAll(
      ".patch-map-position"
    );

  positions.forEach(
    position => {
      position.disabled = true;
      position.removeAttribute(
        "title"
      );

      position.style.cursor =
        "default";
    }
  );

  const viewport =
    mapContainer.querySelector(
      ".patch-map-viewport"
    );

  if (viewport) {
    viewport.style.cursor =
      "grab";
  }
}


async function showPatchReadonly(
  rack,
  equipment
) {
  if (
    typeof ensurePatchMapStyles
    === "function"
  ) {
    ensurePatchMapStyles();
  }

  const modal =
    document.getElementById(
      "equipmentModal"
    );

  const dialog =
    modal?.querySelector(
      ".equipment-dialog"
    );

  const title =
    document.getElementById(
      "equipmentModalTitle"
    );

  const body =
    document.getElementById(
      "equipmentModalBody"
    );

  const databaseId =
    Number(
      equipment?.databaseId
    );

  if (
    !modal
    || !dialog
    || !title
    || !body
  ) {
    return;
  }

  dialog.style.width =
    "min(1500px, calc(100vw - 24px))";

  dialog.style.maxWidth =
    "none";

  dialog.style.height =
    "min(820px, calc(100dvh - 24px))";

  dialog.style.maxHeight =
    "none";

  dialog.style.display =
    "flex";

  dialog.style.flexDirection =
    "column";

  dialog.style.overflow =
    "hidden";

  body.style.flex =
    "1 1 auto";

  body.style.minHeight =
    "0";

  body.style.display =
    "flex";

  body.style.flexDirection =
    "column";

  body.style.overflow =
    "hidden";

  title.textContent =
    equipment?.name
    || "Patch 32 x 32";

  body.innerHTML = `
    <div
      id="patchReadonlyMap"
      class="patch-map-area"
      style="
        flex:1 1 auto;
        min-height:0;
        width:100%;
        margin:0;
      "
    >
      <div class="patch-map-head">
        <div>
          <h4 class="patch-map-title">
            Patch 32 x 32
          </h4>

          <p class="patch-map-help">
            Carregando as posicoes...
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
    </div>
  `;

  modal.classList.add(
    "open"
  );

  if (
    !Number.isInteger(databaseId)
    || databaseId < 1
  ) {
    const mapContainer =
      document.getElementById(
        "patchReadonlyMap"
      );

    mapContainer.innerHTML = `
      <div class="form-error show">
        O patch nao possui databaseId valido.
      </div>
    `;

    return;
  }

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
      let message =
        "Nao foi possivel carregar o patch.";

      try {
        const data =
          await response.json();

        if (
          typeof data?.detail
          === "string"
        ) {
          message =
            data.detail;
        }
      } catch {
        message +=
          " HTTP "
          + response.status
          + ".";
      }

      throw new Error(
        message
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
        + " posicoes. "
        + "Eram esperadas 32."
      );
    }

    const mapContainer =
      document.getElementById(
        "patchReadonlyMap"
      );

    if (
      typeof patchMapRenderTrack
      !== "function"
    ) {
      throw new Error(
        "O componente visual do patch "
        + "nao esta disponivel."
      );
    }

    patchMapRenderTrack(
      mapContainer,
      positions,
      true
    );

    configurePatchReadonlyMap(
      mapContainer
    );

  } catch (error) {
    console.error(
      "Falha ao consultar patch.",
      error
    );

    const mapContainer =
      document.getElementById(
        "patchReadonlyMap"
      );

    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="form-error show">
          ${String(
            error.message
            || (
              "Nao foi possivel "
              + "consultar o patch."
            )
          )}
        </div>
      `;
    }
  }
}


showEquipmentModal = function(
  rack,
  equipment
) {
  resetPatchReadonlyModal();

  if (
    equipment?.isPatch === true
    && !editMode
  ) {
    showPatchReadonly(
      rack,
      equipment
    );

    return;
  }

  return showEquipmentModalBeforeReadonly(
    rack,
    equipment
  );
};


document.getElementById(
  "equipmentModalClose"
)?.addEventListener(
  "click",
  resetPatchReadonlyModal
);


document.getElementById(
  "equipmentModal"
)?.addEventListener(
  "click",
  event => {
    if (
      event.target?.id
      === "equipmentModal"
    ) {
      resetPatchReadonlyModal();
    }
  }
);