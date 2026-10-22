const equipmentUpdateApiApplied = true;


function findEquipmentForUpdate(equipmentKey) {
  for (const rack of racks) {
    if (!Array.isArray(rack.items)) {
      continue;
    }

    const equipment = rack.items.find(
      item =>
        item?.equipmentKey === equipmentKey
        || item?.id === equipmentKey
    );

    if (equipment) {
      return {
        rack,
        equipment
      };
    }
  }

  return null;
}


function showEquipmentUpdateError(message) {
  const errorBox =
    document.getElementById("formError");

  if (!errorBox) {
    return;
  }

  errorBox.textContent = message;
  errorBox.classList.add("show");
}


function equipmentUpdateTextValue(elementId) {
  return String(
    document.getElementById(
      elementId
    )?.value || ""
  ).trim();
}


function optionalEquipmentUpdateText(elementId) {
  const value =
    equipmentUpdateTextValue(elementId);

  return value || null;
}


function validateEquipmentUpdateForm(
  destinationRack,
  name,
  moduleNumber,
  start,
  units
) {
  if (!name) {
    throw new Error(
      "Informe o nome do equipamento."
    );
  }

  if (!destinationRack) {
    throw new Error(
      "A fileira selecionada nao foi encontrada."
    );
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
    throw new Error(
      "O rack fisico deve estar entre 1 e "
      + moduleLimit
      + "."
    );
  }

  if (
    !Number.isInteger(start)
    || start < 1
    || start > ruLimit
  ) {
    throw new Error(
      "A RU inicial deve estar entre 1 e "
      + ruLimit
      + "."
    );
  }

  if (
    !Number.isInteger(units)
    || units < 1
  ) {
    throw new Error(
      "A altura deve ser igual ou maior que 1U."
    );
  }

  if (start + units - 1 > ruLimit) {
    throw new Error(
      "O equipamento ultrapassa o limite de "
      + ruLimit
      + "U."
    );
  }
}


function applyUpdatedEquipment(
  sourceRack,
  destinationRack,
  currentEquipment,
  updatedEquipment
) {
  const frontendEquipment = {
    databaseId: updatedEquipment.id,
    id: updatedEquipment.equipamento_key,
    equipmentKey:
      updatedEquipment.equipamento_key,
    rackKey: updatedEquipment.rack_key,
    moduloRack:
      updatedEquipment.modulo_rack,
    start: updatedEquipment.ru_inicial,
    units: updatedEquipment.altura_ru,
    name: updatedEquipment.nome,
    manufacturer:
      updatedEquipment.fabricante || "",
    model:
      updatedEquipment.modelo || "",
    serial:
      updatedEquipment.numero_serie || "",
    asset:
      updatedEquipment.patrimonio || "",
    function:
      updatedEquipment.funcao || "",
    notes:
      updatedEquipment.observacoes || "",
    docs: Array.isArray(currentEquipment.docs)
      ? currentEquipment.docs
      : [],
    isPatch:
      Boolean(
        updatedEquipment.is_patch
      ),
    version:
      updatedEquipment.versao_dados
  };

  if (sourceRack === destinationRack) {
    const equipmentIndex =
      sourceRack.items.indexOf(
        currentEquipment
      );

    if (equipmentIndex < 0) {
      throw new Error(
        "O equipamento nao foi encontrado na fileira atual."
      );
    }

    sourceRack.items[equipmentIndex] =
      frontendEquipment;
  } else {
    sourceRack.items =
      sourceRack.items.filter(
        item => item !== currentEquipment
      );

    if (!Array.isArray(destinationRack.items)) {
      destinationRack.items = [];
    }

    destinationRack.items.push(
      frontendEquipment
    );
  }

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

  return frontendEquipment;
}


async function updateEquipmentPatchMode(
  databaseId,
  currentEquipment,
  updatedEquipment
) {
  const patchCheckbox =
    document.getElementById(
      "fIsPatch"
    );

  const desiredPatchMode =
    patchCheckbox?.checked === true;

  const currentPatchMode =
    Boolean(
      currentEquipment.isPatch
    );

  if (
    desiredPatchMode
    === currentPatchMode
  ) {
    updatedEquipment.is_patch =
      currentPatchMode;

    return updatedEquipment;
  }

  const sendConversionRequest =
    async confirmCleanup => {
      return fetch(
        "/api/equipamentos/"
        + databaseId
        + "/patch-mode",
        {
          method: "PUT",
          credentials: "same-origin",
          headers: {
            "Content-Type":
              "application/json",
            "Accept":
              "application/json"
          },
          body: JSON.stringify({
            versao_dados:
              updatedEquipment.versao_dados,
            is_patch:
              desiredPatchMode,
            confirmar_limpeza:
              confirmCleanup
          })
        }
      );
    };

  let conversionResponse =
    await sendConversionRequest(
      false
    );

  if (
    conversionResponse.status === 401
  ) {
    authenticatedUser = null;
    applyAuthenticationState();

    throw new Error(
      "A sessao administrativa expirou. "
      + "Entre novamente antes de converter."
    );
  }

  if (
    conversionResponse.status === 403
  ) {
    throw new Error(
      "O usuario atual nao possui permissao "
      + "para converter o equipamento."
    );
  }

  if (
    conversionResponse.status === 409
  ) {
    let conflictData = null;

    try {
      conflictData =
        await conversionResponse.json();
    } catch {
      conflictData = null;
    }

    const detail =
      conflictData?.detail;

    const confirmationRequired =
      detail?.confirmacao_necessaria
      === true;

    if (confirmationRequired) {
      const message =
        detail?.mensagem
        || (
          "Este patch possui posicoes "
          + "preenchidas. Ao continuar, "
          + "todas as entradas e saidas "
          + "serao removidas."
        );

      const confirmed =
        window.confirm(
          message
          + "\n\n"
          + "Deseja realmente converter "
          + "para equipamento normal?"
        );

      if (!confirmed) {
        if (patchCheckbox) {
          patchCheckbox.checked = true;
        }

        const cancellationError =
          new Error(
            "Conversao cancelada. "
            + "O equipamento continua "
            + "classificado como patch."
          );

        cancellationError.isValidation =
          true;

        throw cancellationError;
      }

      conversionResponse =
        await sendConversionRequest(
          true
        );
    } else {
      const conflictMessage =
        typeof detail === "string"
          ? detail
          : (
              detail?.mensagem
              || "O equipamento foi alterado "
              + "por outra sessao."
            );

      const conflictError =
        new Error(
          conflictMessage
        );

      conflictError.isConflict = true;

      throw conflictError;
    }
  }

  if (!conversionResponse.ok) {
    throw new Error(
      await readEquipmentApiError(
        conversionResponse
      )
    );
  }

  const conversion =
    await conversionResponse.json();

  updatedEquipment.is_patch =
    Boolean(
      conversion.is_patch
    );

  updatedEquipment.versao_dados =
    conversion.versao_dados;

  return updatedEquipment;
}


async function updateEquipmentThroughApi() {
  if (!isAdministrator()) {
    throw new Error(
      "Entre como administrador para editar equipamentos."
    );
  }

  const editingState =
    syncState?.editing;

  if (
    editingState?.type !== "equipment"
    || !editingState?.key
  ) {
    throw new Error(
      "Nenhum equipamento foi identificado para edicao."
    );
  }

  const locatedEquipment =
    findEquipmentForUpdate(
      editingState.key
    );

  if (!locatedEquipment) {
    throw new Error(
      "O equipamento em edicao nao foi encontrado no mapa."
    );
  }

  const sourceRack =
    locatedEquipment.rack;

  const currentEquipment =
    locatedEquipment.equipment;

  const databaseId = Number(
    currentEquipment.databaseId
  );

  const currentVersion = Number(
    currentEquipment.version
    || editingState.version
  );

  if (
    !Number.isInteger(databaseId)
    || databaseId < 1
  ) {
    throw new Error(
      "O equipamento nao possui databaseId valido."
    );
  }

  if (
    !Number.isInteger(currentVersion)
    || currentVersion < 1
  ) {
    throw new Error(
      "O equipamento nao possui versao valida."
    );
  }

  const name =
    equipmentUpdateTextValue("fName");

  const rackKey =
    equipmentUpdateTextValue(
      "fRackKey"
    );

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

  const destinationRack = racks.find(
    rack => rack.rackKey === rackKey
  );

  validateEquipmentUpdateForm(
    destinationRack,
    name,
    moduleNumber,
    start,
    units
  );

  const payload = {
    versao_dados: currentVersion,
    rack_key: rackKey,
    modulo_rack: moduleNumber,
    ru_inicial: start,
    altura_ru: units,
    nome: name,
    fabricante:
      optionalEquipmentUpdateText(
        "fManufacturer"
      ),
    modelo:
      optionalEquipmentUpdateText(
        "fModel"
      ),
    numero_serie:
      optionalEquipmentUpdateText(
        "fSerial"
      ),
    patrimonio:
      optionalEquipmentUpdateText(
        "fAsset"
      ),
    funcao:
      optionalEquipmentUpdateText(
        "fFunction"
      ),
    observacoes:
      optionalEquipmentUpdateText(
        "fNotes"
      ),
    visivel: true
  };

  const response = await fetch(
    "/api/equipamentos/"
    + databaseId,
    {
      method: "PUT",
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
      + "para editar equipamentos."
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

  const updatedEquipment =
    await response.json();

  await updateEquipmentPatchMode(
    databaseId,
    currentEquipment,
    updatedEquipment
  );

  const frontendEquipment =
    applyUpdatedEquipment(
      sourceRack,
      destinationRack,
      currentEquipment,
      updatedEquipment
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
    "EQUIPAMENTO ATUALIZADO"
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

    if (
      syncState?.editing?.type
      !== "equipment"
      || !syncState?.editing?.key
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    saveEquipmentButton.disabled = true;

    const originalText =
      saveEquipmentButton.textContent;

    saveEquipmentButton.textContent =
      "Salvando...";

    try {
      await updateEquipmentThroughApi();
    } catch (error) {
      console.error(
        "Falha ao atualizar equipamento.",
        error
      );

      showEquipmentUpdateError(
        error.message
        || "Nao foi possivel atualizar o equipamento."
      );
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