const patchManualDestinationApplied = true;


let patchManualCurrentPosition = null;


function installPatchManualDestinationStyles() {
  if (
    document.getElementById(
      "patchManualDestinationStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "patchManualDestinationStyles";

  style.textContent = `
    .patch-manual-destination {
      margin-top: 9px;
    }

    .patch-manual-destination label {
      display: block;
      margin-bottom: 6px;
      color: #8da2ba;
      font-size: 10px;
      font-weight: 900;
    }

    .patch-manual-destination input {
      width: 100%;
      border: 1px solid #26384e;
      border-radius: 9px;
      background: #07111f;
      color: #edf4fb;
      padding: 10px;
      outline: none;
    }

    .patch-manual-destination input:focus {
      border-color: #22d3ee;
      box-shadow:
        0 0 0 2px #22d3ee22;
    }

    .patch-manual-destination input:disabled {
      cursor: not-allowed;
      color: #71869b;
      background: #0b1522;
      opacity: 1;
    }

    .patch-manual-destination-note {
      display: none;
      margin: 5px 0 0;
      color: #86efac;
      font-size: 9px;
      line-height: 1.35;
    }

    .patch-manual-destination.automatic
    .patch-manual-destination-note {
      display: block;
    }

    /*
     * No modo consulta, o destino é exibido
     * somente pelo cartão de conexão.
     *
     * A caixa de texto não é necessária.
     */
    .patch-position-modal.readonly
    .patch-manual-destination {
      display: none !important;
    }

    .patch-connection-indicator.manual {
      color: #b8efff;
      border-color: #22d3ee66;
      background: #0b2433;
    }

    .patch-position-module
    .patch-connection-mini.manual {
      color: #b8efff;
    }
  `;

  document.head.appendChild(
    style
  );
}


function ensurePatchManualDestinationFields() {
  const inputField =
    document.getElementById(
      "patchPositionInput"
    )?.closest(
      ".patch-position-field"
    );

  const outputField =
    document.getElementById(
      "patchPositionOutput"
    )?.closest(
      ".patch-position-field"
    );

  if (
    !inputField
    || !outputField
  ) {
    return false;
  }

  let inputWrapper =
    document.getElementById(
      "patchManualInputWrapper"
    );

  if (!inputWrapper) {
    inputWrapper =
      document.createElement(
        "div"
      );

    inputWrapper.id =
      "patchManualInputWrapper";

    inputWrapper.className =
      "patch-manual-destination";

    inputWrapper.innerHTML = `
      <label for="patchManualInputDestination">
        ONDE A ENTRADA ESTÁ CONECTADA?
      </label>

      <input
        id="patchManualInputDestination"
        maxlength="500"
        placeholder=""
      >

      <p class="patch-manual-destination-note">
        Esta ponta possui uma conexão automática
        com outro patch.
      </p>
    `;

    inputField.appendChild(
      inputWrapper
    );
  }

  let outputWrapper =
    document.getElementById(
      "patchManualOutputWrapper"
    );

  if (!outputWrapper) {
    outputWrapper =
      document.createElement(
        "div"
      );

    outputWrapper.id =
      "patchManualOutputWrapper";

    outputWrapper.className =
      "patch-manual-destination";

    outputWrapper.innerHTML = `
      <label for="patchManualOutputDestination">
        ONDE A SAÍDA ESTÁ CONECTADA?
      </label>

      <input
        id="patchManualOutputDestination"
        maxlength="500"
        placeholder=""
      >

      <p class="patch-manual-destination-note">
        Esta ponta possui uma conexão automática
        com outro patch.
      </p>
    `;

    outputField.appendChild(
      outputWrapper
    );
  }

  const inputDestination =
    document.getElementById(
      "patchManualInputDestination"
    );

  const outputDestination =
    document.getElementById(
      "patchManualOutputDestination"
    );

  if (inputDestination) {
    inputDestination.oninput =
      updatePatchManualVisualPreview;
  }

  if (outputDestination) {
    outputDestination.oninput =
      updatePatchManualVisualPreview;
  }

  return true;
}


function setPatchManualFieldState(
  connector,
  automaticConnection
) {
  const isInput =
    connector === "entrada";

  const wrapper =
    document.getElementById(
      isInput
        ? "patchManualInputWrapper"
        : "patchManualOutputWrapper"
    );

  const field =
    document.getElementById(
      isInput
        ? "patchManualInputDestination"
        : "patchManualOutputDestination"
    );

  const modal =
    document.getElementById(
      "patchPositionModal"
    );

  const readonly =
    modal?.classList.contains(
      "readonly"
    ) === true;

  if (!field) {
    return;
  }

  wrapper?.classList.toggle(
    "automatic",
    Boolean(
      automaticConnection
    )
  );

  field.disabled =
    Boolean(
      automaticConnection
    );

  field.readOnly =
    Boolean(
      readonly
      && !automaticConnection
    );
}


function getPatchManualValue(
  connector
) {
  const field =
    document.getElementById(
      connector === "entrada"
        ? "patchManualInputDestination"
        : "patchManualOutputDestination"
    );

  return String(
    field?.value
    || ""
  ).trim();
}


function updatePatchManualVisualPreview() {
  const connectors = [
    "entrada",
    "saida"
  ];

  for (
    const connector
    of connectors
  ) {
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

    const mini =
      document.getElementById(
        "patch"
        + prefix
        + "ConnectionMini"
      );

    if (
      indicator?.classList.contains(
        "connected"
      )
    ) {
      continue;
    }

    const manualValue =
      getPatchManualValue(
        connector
      );

    if (manualValue) {
      if (indicator) {
        indicator.className =
          "patch-connection-indicator manual";

        indicator.innerHTML = `
          <span class="patch-connection-label">
            CONECTADO A
          </span>

          <span class="patch-connection-remote-name">
            ${patchConnectionEscape(
              manualValue
            )}
          </span>

          <span class="patch-connection-remote-detail">
            Destino informado manualmente
          </span>
        `;
      }

      if (mini) {
        mini.className =
          "patch-connection-mini "
          + connector
          + " manual";

        mini.textContent =
          manualValue;
      }

      continue;
    }

    if (indicator) {
      indicator.className =
        "patch-connection-indicator";

      indicator.innerHTML = `
        <span class="patch-connection-label">
          CONEXÃO DA ${connector.toUpperCase()}
        </span>

        Não conectado
      `;
    }

    if (mini) {
      mini.className =
        "patch-connection-mini "
        + connector;

      mini.textContent =
        "Não conectado";
    }
  }
}


function loadPatchManualDestinationValues(
  position
) {
  ensurePatchManualDestinationFields();

  patchManualCurrentPosition =
    position;

  const inputDestination =
    document.getElementById(
      "patchManualInputDestination"
    );

  const outputDestination =
    document.getElementById(
      "patchManualOutputDestination"
    );

  if (inputDestination) {
    inputDestination.value =
      position
        ?.descricao_conexao_entrada
      || "";
  }

  if (outputDestination) {
    outputDestination.value =
      position
        ?.descricao_conexao_saida
      || "";
  }

  setPatchManualFieldState(
    "entrada",
    false
  );

  setPatchManualFieldState(
    "saida",
    false
  );

  updatePatchManualVisualPreview();
}


const showPatchConnectedBeforeManual =
  showPatchConnected;


showPatchConnected = function(
  connector,
  connection
) {
  const result =
    showPatchConnectedBeforeManual(
      connector,
      connection
    );

  setPatchManualFieldState(
    connector,
    true
  );

  return result;
};


const showPatchDisconnectedBeforeManual =
  showPatchDisconnected;


showPatchDisconnected = function(
  connector
) {
  const result =
    showPatchDisconnectedBeforeManual(
      connector
    );

  setPatchManualFieldState(
    connector,
    false
  );

  updatePatchManualVisualPreview();

  return result;
};


const openPatchPositionEditorBeforeManual =
  openPatchPositionEditor;


openPatchPositionEditor = function(
  position
) {
  const result =
    openPatchPositionEditorBeforeManual(
      position
    );

  window.setTimeout(
    () => {
      loadPatchManualDestinationValues(
        position
      );
    },
    0
  );

  return result;
};


if (
  typeof openPatchReadonlyPosition
  === "function"
) {
  const openPatchReadonlyPositionBeforeManual =
    openPatchReadonlyPosition;

  openPatchReadonlyPosition =
    async function(
      positionNumber
    ) {
      const result =
        await openPatchReadonlyPositionBeforeManual(
          positionNumber
        );

      const position =
        patchReadonlyPositions.find(
          item =>
            Number(
              item.numero_posicao
            )
            === Number(
              positionNumber
            )
        );

      if (position) {
        loadPatchManualDestinationValues(
          position
        );

        setPatchManualFieldState(
          "entrada",
          document
            .getElementById(
              "patchInputConnectionIndicator"
            )
            ?.classList.contains(
              "connected"
            )
          === true
        );

        setPatchManualFieldState(
          "saida",
          document
            .getElementById(
              "patchOutputConnectionIndicator"
            )
            ?.classList.contains(
              "connected"
            )
          === true
        );
      }

      return result;
    };
}


const fetchBeforePatchManualDestination =
  window.fetch.bind(
    window
  );


window.fetch =
  async function(
    input,
    options = {}
  ) {
    const requestUrl =
      typeof input === "string"
        ? input
        : input?.url || "";

    const requestMethod =
      String(
        options?.method
        || "GET"
      ).toUpperCase();

    const isPatchPositionUpdate =
      requestMethod === "PUT"
      &&
      /^\/api\/equipamentos\/\d+\/patch\/\d+$/
        .test(
          requestUrl
        );

    if (
      isPatchPositionUpdate
      &&
      typeof options?.body
      === "string"
      &&
      !document
        .getElementById(
          "patchPositionModal"
        )
        ?.classList.contains(
          "readonly"
        )
    ) {
      try {
        const requestData =
          JSON.parse(
            options.body
          );

        const inputField =
          document.getElementById(
            "patchManualInputDestination"
          );

        const outputField =
          document.getElementById(
            "patchManualOutputDestination"
          );

        requestData
          .descricao_conexao_entrada =
            inputField?.disabled
              ? null
              : (
                  String(
                    inputField?.value
                    || ""
                  ).trim()
                  || null
                );

        requestData
          .descricao_conexao_saida =
            outputField?.disabled
              ? null
              : (
                  String(
                    outputField?.value
                    || ""
                  ).trim()
                  || null
                );

        options = {
          ...options,
          body: JSON.stringify(
            requestData
          )
        };

      } catch (error) {
        console.error(
          "Falha ao incluir destinos "
          + "manuais no salvamento.",
          error
        );
      }
    }

    return fetchBeforePatchManualDestination(
      input,
      options
    );
  };


installPatchManualDestinationStyles();