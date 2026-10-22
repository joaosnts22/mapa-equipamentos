const equipmentCreationApiApplied = true;


async function readEquipmentApiError(response) {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data?.detail)) {
      return data.detail
        .map(
          item =>
            item?.msg
            || JSON.stringify(item)
        )
        .join(" ");
    }

    return JSON.stringify(
      data?.detail || data
    );
  } catch {
    return (
      "O servidor respondeu com HTTP "
      + response.status
      + "."
    );
  }
}


function equipmentTextValue(elementId) {
  return String(
    document.getElementById(
      elementId
    )?.value || ""
  ).trim();
}


function optionalEquipmentText(elementId) {
  const value = equipmentTextValue(
    elementId
  );

  return value || null;
}


async function createEquipmentThroughApi() {
  if (!isAdministrator()) {
    throw new Error(
      "Entre como administrador para criar equipamentos."
    );
  }

  const errorBox =
    document.getElementById("formError");

  const showFormError = message => {
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.classList.add("show");
    }
  };

  const name =
    equipmentTextValue("fName");

  const rackKey =
    equipmentTextValue("fRackKey");

  const moduleNumber = Number(
    document.getElementById(
      "fModule"
    )?.value
  );

  const start = Number(
    document.getElementById(
      "fStart"
    )?.value
  );

  const units = Number(
    document.getElementById(
      "fUnits"
    )?.value
  );

  if (!name) {
    const message =
      "Informe o nome do equipamento.";

    showFormError(message);
    throw new Error(message);
  }

  const destinationRack = racks.find(
    rack => rack.rackKey === rackKey
  );

  if (!destinationRack) {
    const message =
      "A fileira selecionada nao foi encontrada.";

    showFormError(message);
    throw new Error(message);
  }

  const moduleLimit = Number(
    destinationRack.quantidadeModulos || 8
  );

  const ruLimit = Number(
    destinationRack.quantidadeRU || 44
  );

  if (
    !Number.isInteger(moduleNumber)
    || moduleNumber < 1
    || moduleNumber > moduleLimit
  ) {
    const message =
      "O rack fisico deve estar entre 1 e "
      + moduleLimit
      + ".";

    showFormError(message);
    throw new Error(message);
  }

  if (
    !Number.isInteger(start)
    || start < 1
    || start > ruLimit
  ) {
    const message =
      "A RU inicial deve estar entre 1 e "
      + ruLimit
      + ".";

    showFormError(message);
    throw new Error(message);
  }

  if (
    !Number.isInteger(units)
    || units < 1
  ) {
    const message =
      "A altura deve ser igual ou maior que 1U.";

    showFormError(message);
    throw new Error(message);
  }

  if (start + units - 1 > ruLimit) {
    const message =
      "O equipamento ultrapassa o limite de "
      + ruLimit
      + "U.";

    showFormError(message);
    throw new Error(message);
  }

  const equipmentKey =
    "EQ-"
    + Date.now().toString()
    + "-"
    + Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();

  const payload = {
    equipamento_key: equipmentKey,
    rack_key: rackKey,
    modulo_rack: moduleNumber,
    ru_inicial: start,
    altura_ru: units,
    nome: name,
    fabricante: optionalEquipmentText(
      "fManufacturer"
    ),
    modelo: optionalEquipmentText(
      "fModel"
    ),
    numero_serie: optionalEquipmentText(
      "fSerial"
    ),
    patrimonio: optionalEquipmentText(
      "fAsset"
    ),
    funcao: optionalEquipmentText(
      "fFunction"
    ),
    observacoes: optionalEquipmentText(
      "fNotes"
    ),
    is_patch:
      document.getElementById(
        "fIsPatch"
      )?.checked === true,
    visivel: true
  };

  const response = await fetch(
    "/api/equipamentos",
    {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  if (response.status === 401) {
    authenticatedUser = null;
    applyAuthenticationState();

    throw new Error(
      "A sessao administrativa expirou. "
      + "Entre novamente antes de salvar."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "O usuario atual nao possui permissao "
      + "para criar equipamentos."
    );
  }

  if (
    response.status === 409
    || response.status === 422
  ) {
    const message =
      await readEquipmentApiError(
        response
      );

    showFormError(message);

    const validationError =
      new Error(message);

    validationError.isValidation = true;

    throw validationError;
  }

  if (!response.ok) {
    throw new Error(
      await readEquipmentApiError(
        response
      )
    );
  }

  const createdEquipment =
    await response.json();

  const frontendEquipment = {
    databaseId: createdEquipment.id,
    id: createdEquipment.equipamento_key,
    equipmentKey:
      createdEquipment.equipamento_key,
    rackKey: createdEquipment.rack_key,
    moduloRack:
      createdEquipment.modulo_rack,
    start: createdEquipment.ru_inicial,
    units: createdEquipment.altura_ru,
    name: createdEquipment.nome,
    manufacturer:
      createdEquipment.fabricante || "",
    model:
      createdEquipment.modelo || "",
    serial:
      createdEquipment.numero_serie || "",
    asset:
      createdEquipment.patrimonio || "",
    function:
      createdEquipment.funcao || "",
    notes:
      createdEquipment.observacoes || "",
    docs: [],
    isPatch:
      Boolean(
        createdEquipment.is_patch
      ),
    version:
      createdEquipment.versao_dados
  };

  if (!Array.isArray(destinationRack.items)) {
    destinationRack.items = [];
  }

  destinationRack.items.push(
    frontendEquipment
  );

  destinationRack.items.sort(
    (firstItem, secondItem) => {
      if (
        firstItem.moduloRack
        !== secondItem.moduloRack
      ) {
        return (
          firstItem.moduloRack
          - secondItem.moduloRack
        );
      }

      return (
        secondItem.start
        - firstItem.start
      );
    }
  );

  syncState.editing = null;
  editingItemId = null;
  selectedRackId = destinationRack.id;

  updateCounts();
  render();

  document.getElementById(
    "drawerTitle"
  ).textContent =
    destinationRack.displayName
    || destinationRack.rackKey;

  renderRackWorkspace(
    destinationRack
  );

  showStatus(
    "EQUIPAMENTO CRIADO"
  );

  return frontendEquipment;
}


document.addEventListener(
  "click",
  async event => {
    const clickedElement =
      event.target instanceof Element
        ? event.target
        : null;

    const saveEquipmentButton =
      clickedElement?.closest(
        "#saveItemButton"
      );

    if (!saveEquipmentButton) {
      return;
    }

    if (syncState?.editing?.key) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    saveEquipmentButton.disabled = true;

    const originalText =
      saveEquipmentButton.textContent;

    saveEquipmentButton.textContent =
      "Criando...";

    try {
      await createEquipmentThroughApi();
    } catch (error) {
      console.error(
        "Falha ao criar equipamento.",
        error
      );

      if (!error.isValidation) {
        const errorBox =
          document.getElementById(
            "formError"
          );

        if (errorBox) {
          errorBox.textContent =
            error.message
            || "Nao foi possivel criar o equipamento.";

          errorBox.classList.add(
            "show"
          );
        }
      }
    } finally {
      const currentButton =
        document.getElementById(
          "saveItemButton"
        );

      if (currentButton) {
        currentButton.disabled = false;
        currentButton.textContent =
          originalText;
      }
    }
  },
  true
);