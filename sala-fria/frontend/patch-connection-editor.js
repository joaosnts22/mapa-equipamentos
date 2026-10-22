const patchConnectionEditorApplied = true;


let patchConnectionEditingConnector =
  null;

let patchConnectionSearchResults =
  [];


function installPatchConnectionEditorStyles() {
  if (
    document.getElementById(
      "patchConnectionEditorStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "patchConnectionEditorStyles";

  style.textContent = `
    .patch-connection-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .patch-connection-action {
      border: 1px solid #35516d;
      border-radius: 7px;
      background: #17314a;
      color: #ffffff;
      padding: 6px 8px;
      font-size: 9px;
      font-weight: 850;
      cursor: pointer;
    }

    .patch-connection-action:hover {
      filter: brightness(1.18);
    }

    .patch-connection-action.primary {
      border-color: #22d3ee;
      background: #0e7490;
    }

    .patch-connection-action.danger {
      border-color: #ef4444;
      background: #4a1d24;
      color: #fecaca;
    }

    .patch-connection-editor-modal {
      position: fixed;
      inset: 0;
      z-index: 180;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #000c;
      backdrop-filter: blur(6px);
    }

    .patch-connection-editor-modal.open {
      display: flex;
    }

    .patch-connection-editor-dialog {
      width: min(650px, 100%);
      max-height: 90vh;
      overflow: auto;
      padding: 20px;
      border: 1px solid #35516d;
      border-radius: 16px;
      background: #081424;
      box-shadow: 0 28px 80px #000a;
    }

    .patch-connection-editor-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 16px;
    }

    .patch-connection-editor-title {
      margin: 0;
      color: #edf4fb;
      font-size: 22px;
    }

    .patch-connection-editor-subtitle {
      margin: 4px 0 0;
      color: #8da2ba;
      font-size: 11px;
      line-height: 1.5;
    }

    .patch-connection-editor-close {
      width: 38px;
      height: 38px;
      border: 0;
      border-radius: 9px;
      background: #17283c;
      color: #ffffff;
      font-size: 21px;
      cursor: pointer;
    }

    .patch-connection-editor-form {
      display: flex;
      flex-direction: column;
      gap: 13px;
    }

    .patch-connection-editor-field label {
      display: block;
      margin-bottom: 6px;
      color: #8da2ba;
      font-size: 10px;
      font-weight: 900;
    }

    .patch-connection-editor-field input,
    .patch-connection-editor-field select {
      width: 100%;
      border: 1px solid #26384e;
      border-radius: 9px;
      background: #07111f;
      color: #edf4fb;
      padding: 11px;
      outline: none;
    }

    .patch-connection-editor-field input:focus,
    .patch-connection-editor-field select:focus {
      border-color: #22d3ee;
      box-shadow: 0 0 0 2px #22d3ee22;
    }

    .patch-connection-search-line {
      display: flex;
      gap: 8px;
    }

    .patch-connection-search-line input {
      flex: 1 1 auto;
    }

    .patch-connection-results {
      display: flex;
      flex-direction: column;
      gap: 7px;
      max-height: 230px;
      overflow: auto;
      padding-right: 3px;
    }

    .patch-connection-result {
      width: 100%;
      border: 1px solid #26384e;
      border-radius: 9px;
      background: #0c1828;
      color: #edf4fb;
      padding: 10px;
      text-align: left;
      cursor: pointer;
    }

    .patch-connection-result:hover {
      border-color: #22d3ee;
      background: #112a40;
    }

    .patch-connection-result.selected {
      border-color: #22d3ee;
      background: #0e4257;
      box-shadow: 0 0 0 2px #22d3ee22;
    }

    .patch-connection-result-name {
      display: block;
      font-size: 12px;
      font-weight: 900;
    }

    .patch-connection-result-rack {
      display: block;
      margin-top: 3px;
      color: #8da2ba;
      font-size: 9px;
    }

    .patch-connection-destination {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .patch-connection-editor-error {
      display: none;
      padding: 10px;
      border: 1px solid #ef4444;
      border-radius: 9px;
      background: #4a1d24;
      color: #fecaca;
      font-size: 11px;
    }

    .patch-connection-editor-error.show {
      display: block;
    }

    .patch-connection-editor-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }

    @media (max-width: 620px) {
      .patch-connection-search-line {
        flex-direction: column;
      }

      .patch-connection-destination {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


function createPatchConnectionEditorModal() {
  let modal =
    document.getElementById(
      "patchConnectionEditorModal"
    );

  if (modal) {
    return modal;
  }

  modal =
    document.createElement(
      "div"
    );

  modal.id =
    "patchConnectionEditorModal";

  modal.className =
    "patch-connection-editor-modal";

  modal.innerHTML = `
    <section class="patch-connection-editor-dialog">
      <div class="patch-connection-editor-head">
        <div>
          <h3 class="patch-connection-editor-title">
            Conectar patch
          </h3>

          <p
            class="patch-connection-editor-subtitle"
            id="patchConnectionEditorSubtitle"
          ></p>
        </div>

        <button
          type="button"
          class="patch-connection-editor-close"
          id="patchConnectionEditorClose"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>

      <div class="patch-connection-editor-form">
        <div class="patch-connection-editor-field">
          <label for="patchConnectionSearch">
            NOME DO PATCH DESTINO
          </label>

          <div class="patch-connection-search-line">
            <input
              id="patchConnectionSearch"
              maxlength="200"
              placeholder="Digite parte do nome do patch"
            >

            <button
              type="button"
              class="mini-btn"
              id="patchConnectionSearchButton"
            >
              Pesquisar
            </button>
          </div>
        </div>

        <div
          class="patch-connection-results"
          id="patchConnectionResults"
        ></div>

        <div class="patch-connection-destination">
          <div class="patch-connection-editor-field">
            <label for="patchConnectionPosition">
              POSIÇÃO DESTINO
            </label>

            <select id="patchConnectionPosition">
              ${Array.from(
                {
                  length: 32
                },
                (_, index) => {
                  const number =
                    index + 1;

                  return `
                    <option value="${number}">
                      Posição ${
                        String(number)
                          .padStart(2, "0")
                      }
                    </option>
                  `;
                }
              ).join("")}
            </select>
          </div>

          <div class="patch-connection-editor-field">
            <label for="patchConnectionConnector">
              CONECTOR DESTINO
            </label>

            <select id="patchConnectionConnector">
              <option value="entrada">
                Entrada
              </option>

              <option value="saida">
                Saída
              </option>
            </select>
          </div>
        </div>

        <div
          class="patch-connection-editor-error"
          id="patchConnectionEditorError"
        ></div>

        <div class="patch-connection-editor-actions">
          <button
            type="button"
            class="mini-btn"
            id="patchConnectionEditorCancel"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="mini-btn primary"
            id="patchConnectionEditorSave"
          >
            Conectar
          </button>
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
    "patchConnectionEditorClose"
  ).onclick =
    closeModal;

  document.getElementById(
    "patchConnectionEditorCancel"
  ).onclick =
    closeModal;

  modal.addEventListener(
    "click",
    event => {
      if (event.target === modal) {
        closeModal();
      }
    }
  );

  document.getElementById(
    "patchConnectionSearchButton"
  ).onclick = () => {
    searchPatchConnectionTargets();
  };

  document.getElementById(
    "patchConnectionSearch"
  ).addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        event.preventDefault();

        searchPatchConnectionTargets();
      }
    }
  );

  document.getElementById(
    "patchConnectionEditorSave"
  ).onclick = () => {
    savePatchConnection();
  };

  return modal;
}


function showPatchConnectionEditorError(
  message
) {
  const errorBox =
    document.getElementById(
      "patchConnectionEditorError"
    );

  if (!errorBox) {
    return;
  }

  errorBox.textContent =
    message;

  errorBox.classList.add(
    "show"
  );
}


function clearPatchConnectionEditorError() {
  const errorBox =
    document.getElementById(
      "patchConnectionEditorError"
    );

  if (!errorBox) {
    return;
  }

  errorBox.textContent = "";

  errorBox.classList.remove(
    "show"
  );
}


function renderPatchConnectionResults(
  results
) {
  const container =
    document.getElementById(
      "patchConnectionResults"
    );

  if (!container) {
    return;
  }

  if (!results.length) {
    container.innerHTML = `
      <div class="patch-connection-indicator">
        Nenhum patch encontrado.
      </div>
    `;

    return;
  }

  container.innerHTML =
    results.map(
      result => `
        <button
          type="button"
          class="patch-connection-result"
          data-equipment-id="${
            Number(
              result.equipamento_id
            )
          }"
        >
          <span class="patch-connection-result-name">
            ${patchConnectionEscape(
              result.equipamento_nome
            )}
          </span>

          <span class="patch-connection-result-rack">
            Fileira ${patchConnectionEscape(
              result.rack_nome
              || result.rack_key
              || ""
            )}
          </span>
        </button>
      `
    ).join("");

  container.querySelectorAll(
    ".patch-connection-result"
  ).forEach(
    button => {
      button.onclick = () => {
        container.querySelectorAll(
          ".patch-connection-result"
        ).forEach(
          currentButton => {
            currentButton.classList.remove(
              "selected"
            );
          }
        );

        button.classList.add(
          "selected"
        );
      };
    }
  );
}


async function searchPatchConnectionTargets() {
  const searchInput =
    document.getElementById(
      "patchConnectionSearch"
    );

  const query =
    String(
      searchInput?.value
      || ""
    ).trim();

  const container =
    document.getElementById(
      "patchConnectionResults"
    );

  clearPatchConnectionEditorError();

  if (container) {
    container.innerHTML = `
      <div class="patch-connection-indicator loading">
        Pesquisando patches...
      </div>
    `;
  }

  try {
    const parameters =
      new URLSearchParams({
        query:
          query,
        limit:
          "50"
      });

    const response = await fetch(
      "/api/patch-connections/search?"
      + parameters.toString(),
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
        "Não foi possível pesquisar "
        + "os patches."
      );
    }

    const data =
      await response.json();

    patchConnectionSearchResults =
      Array.isArray(
        data?.resultados
      )
        ? data.resultados
        : [];

    renderPatchConnectionResults(
      patchConnectionSearchResults
    );

  } catch (error) {
    console.error(
      "Falha na pesquisa de patches.",
      error
    );

    showPatchConnectionEditorError(
      error.message
      || "Falha na pesquisa."
    );

    if (container) {
      container.innerHTML = "";
    }
  }
}


function openPatchConnectionEditor(
  connector
) {
  const context =
    window.patchMapContext;

  const equipmentId =
    Number(
      context?.databaseId
    );

  const positionNumber =
    Number(
      patchConnectionCurrentPosition
        ?.numero_posicao
    );

  if (
    context?.readonly === true
  ) {
    return;
  }

  if (
    !Number.isInteger(equipmentId)
    || equipmentId < 1
    || !Number.isInteger(
      positionNumber
    )
  ) {
    window.alert(
      "Não foi possível identificar "
      + "a posição atual."
    );

    return;
  }

  patchConnectionEditingConnector =
    connector;

  patchConnectionSearchResults = [];

  const modal =
    createPatchConnectionEditorModal();

  const subtitle =
    document.getElementById(
      "patchConnectionEditorSubtitle"
    );

  const searchInput =
    document.getElementById(
      "patchConnectionSearch"
    );

  const results =
    document.getElementById(
      "patchConnectionResults"
    );

  const destinationConnector =
    document.getElementById(
      "patchConnectionConnector"
    );

  if (subtitle) {
    subtitle.textContent =
      "Posição "
      + String(positionNumber)
        .padStart(2, "0")
      + " · "
      + (
          connector === "entrada"
            ? "Entrada"
            : "Saída"
        );
  }

  if (searchInput) {
    searchInput.value = "";
  }

  if (results) {
    results.innerHTML = "";
  }

  if (destinationConnector) {
    destinationConnector.value =
      connector === "entrada"
        ? "saida"
        : "entrada";
  }

  clearPatchConnectionEditorError();

  modal.classList.add(
    "open"
  );

  window.setTimeout(
    () => {
      searchInput?.focus();

      searchPatchConnectionTargets();
    },
    0
  );
}


async function savePatchConnection() {
  const context =
    window.patchMapContext;

  const currentEquipmentId =
    Number(
      context?.databaseId
    );

  const currentPositionNumber =
    Number(
      patchConnectionCurrentPosition
        ?.numero_posicao
    );

  const resultsContainer =
    document.getElementById(
      "patchConnectionResults"
    );

  const selectedResult =
    resultsContainer?.querySelector(
      ".patch-connection-result.selected"
    );

  const destinationEquipmentId =
    Number(
      selectedResult?.dataset
        .equipmentId
    );

  const destinationPosition =
    Number(
      document.getElementById(
        "patchConnectionPosition"
      )?.value
    );

  const destinationConnector =
    document.getElementById(
      "patchConnectionConnector"
    )?.value;

  const saveButton =
    document.getElementById(
      "patchConnectionEditorSave"
    );

  clearPatchConnectionEditorError();

  if (
    !Number.isInteger(
      destinationEquipmentId
    )
    || destinationEquipmentId < 1
  ) {
    showPatchConnectionEditorError(
      "Selecione o patch destino."
    );

    return;
  }

  if (
    !Number.isInteger(
      destinationPosition
    )
    || destinationPosition < 1
    || destinationPosition > 32
  ) {
    showPatchConnectionEditorError(
      "Selecione uma posição válida."
    );

    return;
  }

  const payload = {
    ponta_atual: {
      equipamento_id:
        currentEquipmentId,
      numero_posicao:
        currentPositionNumber,
      conector:
        patchConnectionEditingConnector
    },

    ponta_destino: {
      equipamento_id:
        destinationEquipmentId,
      numero_posicao:
        destinationPosition,
      conector:
        destinationConnector
    },

    substituir_existentes:
      false
  };

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent =
      "Conectando...";
  }

  try {
    let response = await fetch(
      "/api/patch-connections",
      {
        method: "POST",
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

    if (
      response.status === 409
    ) {
      const conflictData =
        await response.json();

      const message =
        typeof conflictData?.detail
        === "string"
          ? conflictData.detail
          : (
              "Uma das pontas "
              + "já está conectada."
            );

      const replaceConfirmed =
        window.confirm(
          message
          + "\n\nDeseja substituir "
          + "a conexão existente?"
        );

      if (!replaceConfirmed) {
        return;
      }

      payload.substituir_existentes =
        true;

      response = await fetch(
        "/api/patch-connections",
        {
          method: "POST",
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
    }

    if (response.status === 401) {
      throw new Error(
        "A sessão administrativa expirou."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "O usuário atual não possui "
        + "permissão para criar conexões."
      );
    }

    if (!response.ok) {
      let message =
        "Não foi possível criar "
        + "a conexão.";

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

    await response.json();

    document.getElementById(
      "patchConnectionEditorModal"
    )?.classList.remove(
      "open"
    );

    await loadPatchPositionConnections(
      patchConnectionCurrentPosition
    );

    showStatus(
      "CONEXAO DE PATCH SALVA"
    );

  } catch (error) {
    console.error(
      "Falha ao conectar patches.",
      error
    );

    showPatchConnectionEditorError(
      error.message
      || "Falha ao conectar."
    );

  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent =
        "Conectar";
    }
  }
}


async function disconnectPatchConnection(
  connector,
  connection
) {
  const connectionId =
    Number(
      connection?.id
    );

  const version =
    Number(
      connection?.versao_dados
    );

  if (
    !Number.isInteger(connectionId)
    || connectionId < 1
    || !Number.isInteger(version)
  ) {
    window.alert(
      "A conexão não possui "
      + "identificação válida."
    );

    return;
  }

  const confirmed =
    window.confirm(
      "Desconectar esta ponta?\n\n"
      + "A conexão será removida "
      + "automaticamente das duas pontas."
    );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      "/api/patch-connections/"
      + connectionId,
      {
        method: "DELETE",
        credentials: "same-origin",
        headers: {
          "Content-Type":
            "application/json",
          "Accept":
            "application/json"
        },
        body: JSON.stringify({
          versao_dados:
            version
        })
      }
    );

    if (!response.ok) {
      let message =
        "Não foi possível remover "
        + "a conexão.";

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

    await response.json();

    await loadPatchPositionConnections(
      patchConnectionCurrentPosition
    );

    showStatus(
      "CONEXAO REMOVIDA"
    );

  } catch (error) {
    console.error(
      "Falha ao desconectar patches.",
      error
    );

    window.alert(
      error.message
      || "Falha ao desconectar."
    );
  }
}


function addPatchConnectionActions(
  connector,
  result
) {
  const context =
    window.patchMapContext;

  if (
    context?.readonly === true
  ) {
    return;
  }

  const prefix =
    connector === "entrada"
      ? "Input"
      : "Output";

  const indicator =
    document.getElementById(
      "patch"
      + prefix
      + "ConnectionIndicator"
    );

  if (!indicator) {
    return;
  }

  indicator.querySelector(
    ".patch-connection-actions"
  )?.remove();

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "patch-connection-actions";

  if (
    result?.conectado
    && result?.conexao
  ) {
    const changeButton =
      document.createElement(
        "button"
      );

    changeButton.type =
      "button";

    changeButton.className =
      "patch-connection-action";

    changeButton.textContent =
      "Alterar conexão";

    changeButton.onclick = () => {
      openPatchConnectionEditor(
        connector
      );
    };

    const disconnectButton =
      document.createElement(
        "button"
      );

    disconnectButton.type =
      "button";

    disconnectButton.className =
      "patch-connection-action danger";

    disconnectButton.textContent =
      "Desconectar";

    disconnectButton.onclick = () => {
      disconnectPatchConnection(
        connector,
        result.conexao
      );
    };

    actions.appendChild(
      changeButton
    );

    actions.appendChild(
      disconnectButton
    );

  } else {
    const connectButton =
      document.createElement(
        "button"
      );

    connectButton.type =
      "button";

    connectButton.className =
      "patch-connection-action primary";

    connectButton.textContent =
      "Conectar";

    connectButton.onclick = () => {
      openPatchConnectionEditor(
        connector
      );
    };

    actions.appendChild(
      connectButton
    );
  }

  indicator.appendChild(
    actions
  );
}


const loadPatchEndpointConnectionBeforeEditor =
  loadPatchEndpointConnection;


loadPatchEndpointConnection =
  async function(
    equipmentId,
    positionNumber,
    connector
  ) {
    const result =
      await loadPatchEndpointConnectionBeforeEditor(
        equipmentId,
        positionNumber,
        connector
      );

    addPatchConnectionActions(
      connector,
      result
    );

    return result;
  };


installPatchConnectionEditorStyles();