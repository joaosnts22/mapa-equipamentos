const patchManualLinkSuggestionApplied = true;


const patchManualSuggestionState = {
  entrada: {
    timer: null,
    query: "",
    results: []
  },

  saida: {
    timer: null,
    query: "",
    results: []
  }
};


function normalizePatchEndpointSearchText(
  value
) {
  return String(
    value ?? ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase();
}


function installPatchEndpointSuggestionStyles() {
  if (
    document.getElementById(
      "patchEndpointSuggestionStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "patchEndpointSuggestionStyles";

  style.textContent = `
    .patch-endpoint-suggestions {
      display: none;
      margin-top: 7px;
      padding: 8px;
      border: 1px solid #22d3ee66;
      border-radius: 9px;
      background: #0b2433;
    }

    .patch-endpoint-suggestions.show {
      display: block;
    }

    .patch-endpoint-searching {
      color: #8da2ba;
      font-size: 9px;
    }

    .patch-endpoint-suggestion-title {
      display: block;
      margin-bottom: 7px;
      color: #b8efff;
      font-size: 9px;
      font-weight: 900;
      line-height: 1.4;
    }

    .patch-endpoint-suggestion-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 200px;
      overflow-y: auto;
    }

    .patch-endpoint-suggestion {
      width: 100%;
      border: 1px solid #35516d;
      border-radius: 8px;
      background: #10263a;
      color: #edf4fb;
      padding: 9px;
      text-align: left;
      cursor: pointer;
    }

    .patch-endpoint-suggestion:hover,
    .patch-endpoint-suggestion:focus-visible {
      border-color: #22d3ee;
      background: #16415a;
      box-shadow:
        0 0 0 2px #22d3ee22;
    }

    .patch-endpoint-suggestion-name {
      display: block;
      color: #ffffff;
      font-size: 11px;
      font-weight: 900;
    }

    .patch-endpoint-suggestion-detail {
      display: block;
      margin-top: 3px;
      color: #9fb5ca;
      font-size: 9px;
      line-height: 1.35;
    }

    .patch-endpoint-suggestion-direction {
      display: inline-flex;
      margin-top: 5px;
      padding: 3px 6px;
      border: 1px solid #22c55e55;
      border-radius: 6px;
      background: #0b251b;
      color: #86efac;
      font-size: 8px;
      font-weight: 900;
    }

    .patch-endpoint-no-results {
      color: #71869b;
      font-size: 9px;
      line-height: 1.4;
    }

    .patch-position-modal.readonly
    .patch-endpoint-suggestions {
      display: none !important;
    }
  `;

  document.head.appendChild(
    style
  );
}


function getPatchEndpointSuggestionElements(
  connector
) {
  const inputConnector =
    connector === "entrada";

  return {
    wrapper:
      document.getElementById(
        inputConnector
          ? "patchManualInputWrapper"
          : "patchManualOutputWrapper"
      ),

    field:
      document.getElementById(
        inputConnector
          ? "patchManualInputDestination"
          : "patchManualOutputDestination"
      ),

    suggestion:
      document.getElementById(
        inputConnector
          ? "patchInputEndpointSuggestions"
          : "patchOutputEndpointSuggestions"
      )
  };
}


function ensurePatchEndpointSuggestionBoxes() {
  const connectors = [
    "entrada",
    "saida"
  ];

  for (
    const connector
    of connectors
  ) {
    const {
      wrapper
    } = getPatchEndpointSuggestionElements(
      connector
    );

    if (!wrapper) {
      continue;
    }

    const suggestionId =
      connector === "entrada"
        ? "patchInputEndpointSuggestions"
        : "patchOutputEndpointSuggestions";

    let suggestion =
      document.getElementById(
        suggestionId
      );

    if (!suggestion) {
      suggestion =
        document.createElement(
          "div"
        );

      suggestion.id =
        suggestionId;

      suggestion.className =
        "patch-endpoint-suggestions";

      wrapper.appendChild(
        suggestion
      );
    }
  }
}


function hidePatchEndpointSuggestions(
  connector
) {
  const state =
    patchManualSuggestionState[
      connector
    ];

  state.query = "";
  state.results = [];

  const {
    suggestion
  } = getPatchEndpointSuggestionElements(
    connector
  );

  if (!suggestion) {
    return;
  }

  suggestion.classList.remove(
    "show"
  );

  suggestion.innerHTML = "";
}


function showPatchEndpointSearching(
  connector
) {
  const {
    suggestion
  } = getPatchEndpointSuggestionElements(
    connector
  );

  if (!suggestion) {
    return;
  }

  suggestion.className =
    "patch-endpoint-suggestions show";

  suggestion.innerHTML = `
    <span class="patch-endpoint-searching">
      Procurando ${
        connector === "entrada"
          ? "saídas"
          : "entradas"
      } com esse nome...
    </span>
  `;
}


function patchEndpointConnectorLabel(
  connector
) {
  return connector === "entrada"
    ? "Entrada"
    : "Saída";
}


function renderPatchEndpointSuggestions(
  connector,
  results
) {
  const {
    suggestion
  } = getPatchEndpointSuggestionElements(
    connector
  );

  if (!suggestion) {
    return;
  }

  if (!results.length) {
    suggestion.className =
      "patch-endpoint-suggestions show";

    suggestion.innerHTML = `
      <span class="patch-endpoint-no-results">
        Nenhuma ${
          connector === "entrada"
            ? "saída"
            : "entrada"
        } cadastrada possui exatamente esse nome.

        O texto continuará como destino manual.
      </span>
    `;

    return;
  }

  suggestion.className =
    "patch-endpoint-suggestions show";

  suggestion.innerHTML = `
    <span class="patch-endpoint-suggestion-title">
      ${
        results.length === 1
          ? "Foi encontrada uma ponta correspondente:"
          : (
              "Foram encontradas "
              + results.length
              + " pontas correspondentes:"
            )
      }
    </span>

    <div class="patch-endpoint-suggestion-list">
      ${
        results.map(
          (
            result,
            index
          ) => {
            const position =
              String(
                result.numero_posicao
              ).padStart(
                2,
                "0"
              );

            return `
              <button
                type="button"
                class="patch-endpoint-suggestion"
                data-result-index="${index}"
              >
                <span class="patch-endpoint-suggestion-name">
                  ${patchConnectionEscape(
                    result.nome_conector
                  )}
                </span>

                <span class="patch-endpoint-suggestion-detail">
                  ${patchConnectionEscape(
                    result.equipamento_nome
                  )}
                  · Posição ${position}
                  · ${patchEndpointConnectorLabel(
                    result.conector
                  )}
                  · Fileira ${patchConnectionEscape(
                    result.rack_nome
                    || result.rack_key
                    || ""
                  )}
                </span>

                <span class="patch-endpoint-suggestion-direction">
                  Conectar nesta
                  ${patchEndpointConnectorLabel(
                    result.conector
                  ).toLowerCase()}
                </span>
              </button>
            `;
          }
        ).join("")
      }
    </div>
  `;

  suggestion.querySelectorAll(
    ".patch-endpoint-suggestion"
  ).forEach(
    button => {
      button.onclick = () => {
        const resultIndex =
          Number(
            button.dataset
              .resultIndex
          );

        const selectedResult =
          results[
            resultIndex
          ];

        if (!selectedResult) {
          return;
        }

        connectPatchEndpointResult(
          connector,
          selectedResult
        );
      };
    }
  );
}


async function searchPatchEndpointNames(
  connector
) {
  const {
    field
  } = getPatchEndpointSuggestionElements(
    connector
  );

  if (
    !field
    || field.disabled
    || field.readOnly
  ) {
    hidePatchEndpointSuggestions(
      connector
    );

    return;
  }

  const typedValue =
    String(
      field.value
      || ""
    ).trim();

  const normalizedValue =
    normalizePatchEndpointSearchText(
      typedValue
    );

  if (!normalizedValue) {
    hidePatchEndpointSuggestions(
      connector
    );

    return;
  }

  const equipmentId =
    Number(
      window.patchMapContext
        ?.databaseId
    );

  const positionNumber =
    Number(
      patchConnectionCurrentPosition
        ?.numero_posicao
      ??
      patchManualCurrentPosition
        ?.numero_posicao
    );

  if (
    !Number.isInteger(equipmentId)
    || equipmentId < 1
    || !Number.isInteger(
      positionNumber
    )
  ) {
    hidePatchEndpointSuggestions(
      connector
    );

    return;
  }

  const state =
    patchManualSuggestionState[
      connector
    ];

  state.query =
    normalizedValue;

  showPatchEndpointSearching(
    connector
  );

  try {
    const parameters =
      new URLSearchParams({
        query:
          typedValue,
        current_connector:
          connector,
        current_equipment_id:
          String(equipmentId),
        current_position_number:
          String(positionNumber),
        limit:
          "100"
      });

    const response = await fetch(
      "/api/patch-connections/search-endpoints?"
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
        + "as pontas dos patches."
      );
    }

    const data =
      await response.json();

    if (
      state.query
      !== normalizePatchEndpointSearchText(
        field.value
      )
    ) {
      return;
    }

    const returnedResults =
      Array.isArray(
        data?.resultados
      )
        ? data.resultados
        : [];

    const exactResults =
      returnedResults.filter(
        result =>
          normalizePatchEndpointSearchText(
            result.nome_conector
          )
          === normalizedValue
      );

    state.results =
      exactResults;

    renderPatchEndpointSuggestions(
      connector,
      exactResults
    );

  } catch (error) {
    console.error(
      "Falha ao pesquisar nomes "
      + "singulares do patch.",
      error
    );

    const {
      suggestion
    } = getPatchEndpointSuggestionElements(
      connector
    );

    if (suggestion) {
      suggestion.className =
        "patch-endpoint-suggestions show";

      suggestion.innerHTML = `
        <span class="patch-endpoint-no-results">
          ${patchConnectionEscape(
            error.message
            || "Falha na pesquisa."
          )}
        </span>
      `;
    }
  }
}


function schedulePatchEndpointSearch(
  connector
) {
  const state =
    patchManualSuggestionState[
      connector
    ];

  window.clearTimeout(
    state.timer
  );

  state.timer =
    window.setTimeout(
      () => {
        searchPatchEndpointNames(
          connector
        );
      },
      300
    );
}


async function refreshCurrentPatchPositionAfterLink() {
  const equipmentId =
    Number(
      window.patchMapContext
        ?.databaseId
    );

  const positionNumber =
    Number(
      patchConnectionCurrentPosition
        ?.numero_posicao
      ??
      patchManualCurrentPosition
        ?.numero_posicao
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
    return;
  }

  const data =
    await response.json();

  const positions =
    Array.isArray(
      data?.posicoes
    )
      ? data.posicoes
      : [];

  const refreshedPosition =
    positions.find(
      position =>
        Number(
          position.numero_posicao
        )
        === positionNumber
    );

  if (!refreshedPosition) {
    return;
  }

  patchConnectionCurrentPosition =
    refreshedPosition;

  patchManualCurrentPosition =
    refreshedPosition;

  if (
    window.patchMapContext
    && Array.isArray(
      window.patchMapContext
        .positions
    )
  ) {
    const index =
      window.patchMapContext
        .positions
        .findIndex(
          position =>
            Number(
              position.numero_posicao
            )
            === positionNumber
        );

    if (index >= 0) {
      window.patchMapContext
        .positions[
          index
        ] =
          refreshedPosition;
    }
  }

  loadPatchManualDestinationValues(
    refreshedPosition
  );

  await loadPatchPositionConnections(
    refreshedPosition
  );
}


async function connectPatchEndpointResult(
  connector,
  result
) {
  const currentEquipmentId =
    Number(
      window.patchMapContext
        ?.databaseId
    );

  const currentPositionNumber =
    Number(
      patchConnectionCurrentPosition
        ?.numero_posicao
      ??
      patchManualCurrentPosition
        ?.numero_posicao
    );

  if (
    !Number.isInteger(
      currentEquipmentId
    )
    || currentEquipmentId < 1
    || !Number.isInteger(
      currentPositionNumber
    )
  ) {
    window.alert(
      "Não foi possível identificar "
      + "a ponta atual."
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
        connector
    },

    ponta_destino: {
      equipamento_id:
        Number(
          result.equipamento_id
        ),
      numero_posicao:
        Number(
          result.numero_posicao
        ),
      conector:
        result.conector
    },

    substituir_existentes:
      false
  };

  const destinationDescription =
    result.equipamento_nome
    + " · Posição "
    + String(
        result.numero_posicao
      ).padStart(
        2,
        "0"
      )
    + " · "
    + patchEndpointConnectorLabel(
        result.conector
      )
    + " "
    + result.nome_conector;

  const confirmed =
    window.confirm(
      "Criar esta conexão?\n\n"
      + (
          connector === "entrada"
            ? "Entrada atual"
            : "Saída atual"
        )
      + "\n\nconectada a\n\n"
      + destinationDescription
    );

  if (!confirmed) {
    return;
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

      const conflictMessage =
        typeof conflictData?.detail
        === "string"
          ? conflictData.detail
          : (
              "Uma das pontas "
              + "já está conectada."
            );

      const replaceConfirmed =
        window.confirm(
          conflictMessage
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
        + "permissão para conectar patches."
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

    hidePatchEndpointSuggestions(
      connector
    );

    await refreshCurrentPatchPositionAfterLink();

    showStatus(
      "CONEXAO BIDIRECIONAL SALVA"
    );

  } catch (error) {
    console.error(
      "Falha ao conectar as pontas.",
      error
    );

    window.alert(
      error.message
      || "Falha ao criar conexão."
    );
  }
}


function installPatchEndpointSuggestionListeners() {
  ensurePatchEndpointSuggestionBoxes();

  const inputField =
    document.getElementById(
      "patchManualInputDestination"
    );

  const outputField =
    document.getElementById(
      "patchManualOutputDestination"
    );

  if (
    inputField
    && inputField.dataset
      .endpointSearchInstalled
      !== "true"
  ) {
    inputField.dataset
      .endpointSearchInstalled =
        "true";

    inputField.addEventListener(
      "input",
      () => {
        schedulePatchEndpointSearch(
          "entrada"
        );
      }
    );
  }

  if (
    outputField
    && outputField.dataset
      .endpointSearchInstalled
      !== "true"
  ) {
    outputField.dataset
      .endpointSearchInstalled =
        "true";

    outputField.addEventListener(
      "input",
      () => {
        schedulePatchEndpointSearch(
          "saida"
        );
      }
    );
  }
}


const loadPatchManualDestinationValuesBeforeEndpointSearch =
  loadPatchManualDestinationValues;


loadPatchManualDestinationValues =
  function(
    position
  ) {
    const result =
      loadPatchManualDestinationValuesBeforeEndpointSearch(
        position
      );

    installPatchEndpointSuggestionListeners();

    schedulePatchEndpointSearch(
      "entrada"
    );

    schedulePatchEndpointSearch(
      "saida"
    );

    return result;
  };


installPatchEndpointSuggestionStyles();