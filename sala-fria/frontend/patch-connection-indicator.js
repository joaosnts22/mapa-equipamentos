const patchConnectionIndicatorApplied = true;


let patchConnectionCurrentPosition =
  null;


function patchConnectionEscape(
  value
) {
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


function installPatchConnectionIndicatorStyles() {
  if (
    document.getElementById(
      "patchConnectionIndicatorStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "patchConnectionIndicatorStyles";

  style.textContent = `
    .patch-connection-indicator {
      margin-top: 7px;
      padding: 8px 9px;
      border: 1px solid #26384e;
      border-radius: 8px;
      background: #07111f;
      color: #8da2ba;
      font-size: 10px;
      line-height: 1.45;
    }

    .patch-connection-indicator.loading {
      color: #55dcff;
      border-color: #22d3ee55;
    }

    .patch-connection-indicator.connected {
      color: #c9f7da;
      border-color: #22c55e66;
      background: #0b251b;
    }

    .patch-connection-indicator.error {
      color: #fecaca;
      border-color: #ef444477;
      background: #35151b;
    }

    .patch-connection-label {
      display: block;
      margin-bottom: 3px;
      color: #8da2ba;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: .04em;
      text-transform: uppercase;
    }

    .patch-connection-remote-name {
      display: block;
      color: #ffffff;
      font-size: 11px;
      font-weight: 850;
    }

    .patch-connection-remote-detail {
      display: block;
      margin-top: 2px;
      color: #9fb5ca;
      font-size: 9px;
    }

    .patch-position-module
    .patch-connection-mini {
      position: absolute;
      z-index: 5;
      left: 50%;
      width: 170px;
      color: #8da2ba;
      font-size: 8px;
      font-weight: 750;
      line-height: 1.2;
      text-align: center;
      overflow-wrap: anywhere;
      transform: translateX(-50%);
    }

    .patch-position-module
    .patch-connection-mini.connected {
      color: #86efac;
    }

    .patch-position-module
    .patch-connection-mini.input {
      top: 145px;
    }

    .patch-position-module
    .patch-connection-mini.output {
      bottom: 13px;
    }
  `;

  document.head.appendChild(
    style
  );
}


function ensurePatchConnectionIndicators() {
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

  let inputIndicator =
    document.getElementById(
      "patchInputConnectionIndicator"
    );

  if (!inputIndicator) {
    inputIndicator =
      document.createElement(
        "div"
      );

    inputIndicator.id =
      "patchInputConnectionIndicator";

    inputIndicator.className =
      "patch-connection-indicator";

    inputField.appendChild(
      inputIndicator
    );
  }

  let outputIndicator =
    document.getElementById(
      "patchOutputConnectionIndicator"
    );

  if (!outputIndicator) {
    outputIndicator =
      document.createElement(
        "div"
      );

    outputIndicator.id =
      "patchOutputConnectionIndicator";

    outputIndicator.className =
      "patch-connection-indicator";

    outputField.appendChild(
      outputIndicator
    );
  }

  return true;
}


function showPatchConnectionLoading(
  connector
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

  if (indicator) {
    indicator.className =
      "patch-connection-indicator loading";

    indicator.innerHTML = `
      <span class="patch-connection-label">
        CONEXÃO DA ${connector.toUpperCase()}
      </span>

      Consultando...
    `;
  }

  if (mini) {
    mini.className =
      "patch-connection-mini "
      + connector;

    mini.textContent =
      "Consultando conexão...";
  }
}


function showPatchDisconnected(
  connector
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


function showPatchConnected(
  connector,
  connection
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

  const remote =
    connection?.ponta_remota;

  if (!remote) {
    showPatchDisconnected(
      connector
    );

    return;
  }

  const remoteEquipment =
    remote.equipamento_nome
    || "Patch sem nome";

  const remoteConnector =
    remote.conector === "entrada"
      ? "Entrada"
      : "Saída";

  const remotePosition =
    String(
      remote.numero_posicao
    ).padStart(
      2,
      "0"
    );

  const remoteConnectorName =
    String(
      remote.nome_conector
      || ""
    ).trim();

  if (indicator) {
    indicator.className =
      "patch-connection-indicator connected";

    indicator.innerHTML = `
      <span class="patch-connection-label">
        CONECTADO A
      </span>

      <span class="patch-connection-remote-name">
        ${patchConnectionEscape(
          remoteEquipment
        )}
      </span>

      <span class="patch-connection-remote-detail">
        Posição ${remotePosition}
        · ${remoteConnector}
        · Fileira ${patchConnectionEscape(
          remote.rack_nome
          || remote.rack_key
          || ""
        )}
      </span>

      ${
        remoteConnectorName
          ? `
            <span class="patch-connection-remote-detail">
              ${patchConnectionEscape(
                remoteConnectorName
              )}
            </span>
          `
          : ""
      }
    `;
  }

  const readonly =
    document
      .getElementById(
        "patchPositionModal"
      )
      ?.classList.contains(
        "readonly"
      )
    === true;

  if (
    indicator
    && !readonly
  ) {
    const disconnectButton =
      document.createElement(
        "button"
      );

    disconnectButton.type =
      "button";

    disconnectButton.className =
      "patch-connection-disconnect-button";

    disconnectButton.textContent =
      "Desfazer conexão";

    disconnectButton.onclick =
      event => {
        event.preventDefault();
        event.stopPropagation();

        disconnectPatchConnectionDirectly(
          connector,
          connection,
          disconnectButton
        );
      };

    indicator.appendChild(
      disconnectButton
    );
  }
}


function showPatchConnectionError(
  connector,
  message
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

  if (indicator) {
    indicator.className =
      "patch-connection-indicator error";

    indicator.innerHTML = `
      <span class="patch-connection-label">
        CONEXÃO DA ${connector.toUpperCase()}
      </span>

      ${patchConnectionEscape(
        message
      )}
    `;
  }

  if (mini) {
    mini.className =
      "patch-connection-mini "
      + connector;

    mini.textContent =
      "Erro ao consultar conexão";
  }
}


async function disconnectPatchConnectionDirectly(
  connector,
  connection,
  button
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
    !Number.isInteger(
      connectionId
    )
    || connectionId < 1
    || !Number.isInteger(
      version
    )
    || version < 1
  ) {
    window.alert(
      "A conexão não possui "
      + "identificação válida."
    );

    return;
  }

  const remote =
    connection?.ponta_remota;

  const remoteName =
    String(
      remote?.nome_conector
      || remote?.equipamento_nome
      || "Ponta remota"
    );

  const remotePosition =
    String(
      remote?.numero_posicao
      || ""
    ).padStart(
      2,
      "0"
    );

  const remoteConnector =
    remote?.conector === "entrada"
      ? "Entrada"
      : "Saída";

  const confirmed =
    window.confirm(
      "Tem certeza que deseja "
      + "desfazer esta conexão?\n\n"
      + remoteName
      + "\n"
      + (
          remote?.equipamento_nome
          || ""
        )
      + " · Posição "
      + remotePosition
      + " · "
      + remoteConnector
      + "\n\nA conexão será removida "
      + "automaticamente das duas pontas."
    );

  if (!confirmed) {
    return;
  }

  const originalText =
    button?.textContent
    || "Desfazer conexão";

  if (button) {
    button.disabled = true;
    button.textContent =
      "Desfazendo...";
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

    if (response.status === 401) {
      throw new Error(
        "A sessão administrativa expirou."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "O usuário atual não possui "
        + "permissão para desfazer "
        + "conexões."
      );
    }

    if (!response.ok) {
      let message =
        "Não foi possível desfazer "
        + "a conexão.";

      try {
        const errorData =
          await response.json();

        if (
          typeof errorData?.detail
          === "string"
        ) {
          message =
            errorData.detail;
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

    const currentPosition =
      patchConnectionCurrentPosition;

    if (currentPosition) {
      await loadPatchPositionConnections(
        currentPosition
      );
    }

    if (
      typeof refreshPatchManualEditState
      === "function"
    ) {
      refreshPatchManualEditState();
    }

    if (
      typeof showStatus
      === "function"
    ) {
      showStatus(
        "CONEXAO DESFEITA"
      );
    }

  } catch (error) {
    console.error(
      "Falha ao desfazer conexão.",
      error
    );

    window.alert(
      error.message
      || "Falha ao desfazer conexão."
    );

    if (button) {
      button.disabled = false;
      button.textContent =
        originalText;
    }
  }
}


async function loadPatchEndpointConnection(
  equipmentId,
  positionNumber,
  connector
) {
  showPatchConnectionLoading(
    connector
  );

  const query =
    new URLSearchParams({
      equipment_id:
        String(equipmentId),
      position_number:
        String(positionNumber),
      connector:
        connector
    });

  try {
    const response = await fetch(
      "/api/patch-connections/endpoint?"
      + query.toString(),
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
        "Não foi possível consultar.";

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

    if (
      result?.conectado
      && result?.conexao
    ) {
      showPatchConnected(
        connector,
        result.conexao
      );

      return result;
    }

    showPatchDisconnected(
      connector
    );

    return result;

  } catch (error) {
    console.error(
      "Falha ao consultar conexão "
      + connector
      + ".",
      error
    );

    showPatchConnectionError(
      connector,
      error.message
      || "Erro ao consultar."
    );

    return null;
  }
}


async function loadPatchPositionConnections(
  position
) {
  const context =
    window.patchMapContext;

  const equipmentId =
    Number(
      context?.databaseId
    );

  const positionNumber =
    Number(
      position?.numero_posicao
    );

  if (
    !Number.isInteger(equipmentId)
    || equipmentId < 1
    || !Number.isInteger(
      positionNumber
    )
  ) {
    return;
  }

  ensurePatchConnectionIndicators();

  await Promise.all([
    loadPatchEndpointConnection(
      equipmentId,
      positionNumber,
      "entrada"
    ),

    loadPatchEndpointConnection(
      equipmentId,
      positionNumber,
      "saida"
    )
  ]);
}


const openPatchPositionEditorBeforeConnections =
  openPatchPositionEditor;


openPatchPositionEditor = function(
  position
) {
  patchConnectionCurrentPosition =
    position;

  const result =
    openPatchPositionEditorBeforeConnections(
      position
    );

  window.setTimeout(
    () => {
      ensurePatchConnectionIndicators();

      loadPatchPositionConnections(
        position
      );
    },
    0
  );

  return result;
};


installPatchConnectionIndicatorStyles();