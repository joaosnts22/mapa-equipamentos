const historyFiltersUiApplied = true;

const loadHistoryDataBeforeFilters =
  window.loadHistoryData;


const historyFilterState = {
  entityType: "",
  action: "",
  user: "",
  entityKey: ""
};


function createHistoryFilterField(
  labelText
) {
  const field =
    document.createElement(
      "div"
    );

  field.className =
    "history-filter-field";

  const label =
    document.createElement(
      "label"
    );

  label.textContent =
    labelText;

  field.appendChild(
    label
  );

  return field;
}


function createHistoryEntityFilter() {
  const select =
    document.createElement(
      "select"
    );

  select.id =
    "historyEntityFilter";

  const options = [
    ["", "Todas as entidades"],
    ["rack", "Fileiras"],
    ["equipamento", "Equipamentos"],
    ["documento", "Documentos"]
  ];

  options.forEach(
    optionData => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        optionData[0];

      option.textContent =
        optionData[1];

      select.appendChild(
        option
      );
    }
  );

  select.value =
    historyFilterState.entityType;

  return select;
}


function createHistoryActionFilter() {
  const select =
    document.createElement(
      "select"
    );

  select.id =
    "historyActionFilter";

  const options = [
    ["", "Todas as acoes"],
    ["criacao", "Criacao"],
    ["atualizacao", "Atualizacao"],
    [
      "alteracao_posicao",
      "Alteracao de posicao"
    ],
    [
      "alteracao_posicao_equipamento",
      "Alteracao de posicao do equipamento"
    ],
    ["remocao_logica", "Remocao"]
  ];

  options.forEach(
    optionData => {
      const option =
        document.createElement(
          "option"
        );

      option.value =
        optionData[0];

      option.textContent =
        optionData[1];

      select.appendChild(
        option
      );
    }
  );

  select.value =
    historyFilterState.action;

  return select;
}


function createHistoryFilters() {
  const container =
    document.createElement(
      "section"
    );

  container.id =
    "historyFilters";

  container.className =
    "history-filters";

  const entityField =
    createHistoryFilterField(
      "ENTIDADE"
    );

  entityField.appendChild(
    createHistoryEntityFilter()
  );

  const actionField =
    createHistoryFilterField(
      "ACAO"
    );

  actionField.appendChild(
    createHistoryActionFilter()
  );

  const userField =
    createHistoryFilterField(
      "USUARIO"
    );

  const userInput =
    document.createElement(
      "input"
    );

  userInput.id =
    "historyUserFilter";

  userInput.maxLength = 150;

  userInput.placeholder =
    "Ex.: cotion";

  userInput.value =
    historyFilterState.user;

  userField.appendChild(
    userInput
  );

  const keyField =
    createHistoryFilterField(
      "CHAVE DA ENTIDADE"
    );

  const keyInput =
    document.createElement(
      "input"
    );

  keyInput.id =
    "historyEntityKeyFilter";

  keyInput.maxLength = 150;

  keyInput.placeholder =
    "Fileira, equipamento ou documento";

  keyInput.value =
    historyFilterState.entityKey;

  keyField.appendChild(
    keyInput
  );

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "history-filter-actions";

  const clearButton =
    document.createElement(
      "button"
    );

  clearButton.type =
    "button";

  clearButton.id =
    "historyClearFilters";

  clearButton.className =
    "mini-btn";

  clearButton.textContent =
    "Limpar";

  const applyButton =
    document.createElement(
      "button"
    );

  applyButton.type =
    "button";

  applyButton.id =
    "historyApplyFilters";

  applyButton.className =
    "mini-btn primary";

  applyButton.textContent =
    "Filtrar";

  actions.appendChild(
    clearButton
  );

  actions.appendChild(
    applyButton
  );

  container.appendChild(
    entityField
  );

  container.appendChild(
    actionField
  );

  container.appendChild(
    userField
  );

  container.appendChild(
    keyField
  );

  container.appendChild(
    actions
  );

  return container;
}


function readHistoryFilters() {
  historyFilterState.entityType =
    String(
      document.getElementById(
        "historyEntityFilter"
      )?.value || ""
    ).trim();

  historyFilterState.action =
    String(
      document.getElementById(
        "historyActionFilter"
      )?.value || ""
    ).trim();

  historyFilterState.user =
    String(
      document.getElementById(
        "historyUserFilter"
      )?.value || ""
    ).trim();

  historyFilterState.entityKey =
    String(
      document.getElementById(
        "historyEntityKeyFilter"
      )?.value || ""
    ).trim();
}


function clearHistoryFilters() {
  historyFilterState.entityType = "";
  historyFilterState.action = "";
  historyFilterState.user = "";
  historyFilterState.entityKey = "";

  const entitySelect =
    document.getElementById(
      "historyEntityFilter"
    );

  const actionSelect =
    document.getElementById(
      "historyActionFilter"
    );

  const userInput =
    document.getElementById(
      "historyUserFilter"
    );

  const keyInput =
    document.getElementById(
      "historyEntityKeyFilter"
    );

  if (entitySelect) {
    entitySelect.value = "";
  }

  if (actionSelect) {
    actionSelect.value = "";
  }

  if (userInput) {
    userInput.value = "";
  }

  if (keyInput) {
    keyInput.value = "";
  }
}


function buildHistoryFilterUrl() {
  const parameters =
    new URLSearchParams();

  parameters.set(
    "limite",
    "50"
  );

  if (historyFilterState.entityType) {
    parameters.set(
      "tipo_entidade",
      historyFilterState.entityType
    );
  }

  if (historyFilterState.action) {
    parameters.set(
      "acao",
      historyFilterState.action
    );
  }

  if (historyFilterState.user) {
    parameters.set(
      "usuario",
      historyFilterState.user
    );
  }

  if (historyFilterState.entityKey) {
    parameters.set(
      "entidade_key",
      historyFilterState.entityKey
    );
  }

  return (
    "/api/historico?"
    + parameters.toString()
  );
}


async function loadFilteredHistoryData() {
  if (!isAdministrator()) {
    showHistoryDataError(
      "Entre como administrador "
      + "para consultar o historico."
    );

    return;
  }

  const content =
    document.getElementById(
      "historyContent"
    );

  if (content) {
    content.innerHTML =
      '<div class="history-placeholder">'
      + "Carregando historico..."
      + "</div>";
  }

  try {
    const response = await fetch(
      buildHistoryFilterUrl(),
      {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Accept": "application/json"
        },
        cache: "no-store"
      }
    );

    if (response.status === 401) {
      authenticatedUser = null;

      applyAuthenticationState();

      throw new Error(
        "A sessao administrativa expirou."
      );
    }

    if (!response.ok) {
      throw new Error(
        "A consulta do historico "
        + "respondeu com HTTP "
        + response.status
        + "."
      );
    }

    const responseData =
      await response.json();

    renderHistoryData(
      responseData
    );

    installHistoryFilters();
  } catch (error) {
    console.error(
      "Falha ao filtrar historico.",
      error
    );

    showHistoryDataError(
      error.message
    );
  }
}


function installHistoryFilters() {
  const content =
    document.getElementById(
      "historyContent"
    );

  if (!content) {
    return;
  }

  document.getElementById(
    "historyFilters"
  )?.remove();

  const filters =
    createHistoryFilters();

  content.prepend(
    filters
  );

  document.getElementById(
    "historyApplyFilters"
  ).onclick = () => {
    readHistoryFilters();

    loadFilteredHistoryData();
  };

  document.getElementById(
    "historyClearFilters"
  ).onclick = () => {
    clearHistoryFilters();

    loadFilteredHistoryData();
  };

  [
    "historyUserFilter",
    "historyEntityKeyFilter"
  ].forEach(
    elementId => {
      document.getElementById(
        elementId
      ).onkeydown = event => {
        if (event.key === "Enter") {
          readHistoryFilters();

          loadFilteredHistoryData();
        }
      };
    }
  );
}


window.loadHistoryData =
  async function loadHistoryDataWithFilters() {
    await loadFilteredHistoryData();
  };


function installHistoryFilterStyles() {
  if (
    document.getElementById(
      "historyFilterStyles"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "historyFilterStyles";

  style.textContent = `
    .history-filters {
      display: grid;
      grid-template-columns:
        repeat(
          4,
          minmax(150px, 1fr)
        );
      gap: 10px;
      margin-bottom: 14px;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #07111f;
    }

    .history-filter-field {
      min-width: 0;
    }

    .history-filter-field label {
      display: block;
      margin-bottom: 5px;
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
    }

    .history-filter-field input,
    .history-filter-field select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #0c1828;
      color: #fff;
      padding: 9px;
      outline: none;
    }

    .history-filter-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    @media(max-width: 900px) {
      .history-filters {
        grid-template-columns:
          1fr 1fr;
      }
    }

    @media(max-width: 600px) {
      .history-filters {
        grid-template-columns:
          1fr;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}


installHistoryFilterStyles();