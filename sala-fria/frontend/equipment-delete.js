const equipmentDeleteApiApplied = true;

const showEquipmentModalBeforeApiDelete =
  window.showEquipmentModal;


function equipmentNameForDelete(equipment) {
  return String(
    equipment?.name
    || equipment?.equipmentKey
    || equipment?.id
    || "Equipamento sem identificacao"
  );
}


function validateEquipmentForDelete(
  equipment
) {
  if (!equipment) {
    throw new Error(
      "O equipamento selecionado nao foi encontrado."
    );
  }

  if (
    !Number.isInteger(
      equipment.databaseId
    )
    || equipment.databaseId < 1
  ) {
    throw new Error(
      "O equipamento nao possui databaseId valido."
    );
  }

  if (
    !Number.isInteger(
      equipment.version
    )
    || equipment.version < 1
  ) {
    throw new Error(
      "O equipamento nao possui versao valida."
    );
  }
}


async function deleteEquipmentThroughApi(
  equipment
) {
  if (!isAdministrator()) {
    throw new Error(
      "Entre como administrador "
      + "para excluir equipamentos."
    );
  }

  validateEquipmentForDelete(
    equipment
  );

  const response = await fetch(
    "/api/equipamentos/"
    + equipment.databaseId,
    {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        versao_dados:
          equipment.version
      })
    }
  );

  if (response.status === 401) {
    authenticatedUser = null;

    applyAuthenticationState();

    throw new Error(
      "A sessao administrativa expirou. "
      + "Entre novamente antes de excluir."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "O usuario atual nao possui permissao "
      + "para excluir equipamentos."
    );
  }

  if (response.status === 404) {
    throw new Error(
      await readEquipmentApiError(
        response
      )
      || "O equipamento nao foi encontrado no banco."
    );
  }

  if (
    response.status === 409
    || response.status === 422
  ) {
    const detail =
      await readEquipmentApiError(
        response
      );

    const conflictError =
      new Error(
        detail
        || "Nao foi possivel excluir o equipamento."
      );

    conflictError.isConflict = true;

    throw conflictError;
  }

  if (!response.ok) {
    throw new Error(
      await readEquipmentApiError(
        response
      )
      || (
        "O servidor respondeu com HTTP "
        + response.status
        + "."
      )
    );
  }

  return await response.json();
}


function removeDeletedEquipmentFromFrontend(
  rack,
  equipment
) {
  if (
    !rack
    || !Array.isArray(rack.items)
  ) {
    throw new Error(
      "A fileira do equipamento nao foi encontrada."
    );
  }

  const equipmentIndex =
    rack.items.indexOf(
      equipment
    );

  if (equipmentIndex < 0) {
    throw new Error(
      "O equipamento excluido nao foi encontrado "
      + "na lista atual da fileira."
    );
  }

  rack.items.splice(
    equipmentIndex,
    1
  );

  editingItemId = null;

  if (
    typeof syncState === "object"
    && syncState
  ) {
    syncState.editing = null;
  }

  selectedRackId = rack.id;

  updateCounts();
  render();

  const equipmentModal =
    document.getElementById(
      "equipmentModal"
    );

  if (equipmentModal) {
    equipmentModal.classList.remove(
      "open"
    );
  }

  renderRackWorkspace(
    rack
  );
}


function showEquipmentDeleteFailure(
  message
) {
  window.alert(
    message
    || "Nao foi possivel excluir o equipamento."
  );
}


async function confirmAndDeleteEquipment(
  rack,
  equipment,
  deleteButton
) {
  const equipmentName =
    equipmentNameForDelete(
      equipment
    );

  const confirmed =
    window.confirm(
      "Excluir o equipamento "
      + equipmentName
      + "?\n\n"
      + "Esta acao removera o equipamento "
      + "do mapa."
    );

  if (!confirmed) {
    return;
  }

  const originalText =
    deleteButton.textContent;

  deleteButton.disabled = true;

  deleteButton.textContent =
    "Excluindo...";

  try {
    await deleteEquipmentThroughApi(
      equipment
    );

    removeDeletedEquipmentFromFrontend(
      rack,
      equipment
    );

    showStatus(
      "EQUIPAMENTO EXCLUIDO"
    );
  } catch (error) {
    console.error(
      "Falha ao excluir equipamento pela API.",
      error
    );

    showEquipmentDeleteFailure(
      error.message
    );

    if (error.isConflict) {
      showStatus(
        "EXCLUSAO DE EQUIPAMENTO BLOQUEADA"
      );
    }
  } finally {
    const currentDeleteButton =
      document.getElementById(
        "modalRemoveItem"
      );

    if (currentDeleteButton) {
      currentDeleteButton.disabled =
        false;

      currentDeleteButton.textContent =
        originalText;
    }
  }
}


function installEquipmentDeleteHandler(
  rack,
  equipment
) {
  if (!editMode) {
    return;
  }

  if (!isAdministrator()) {
    return;
  }

  const deleteButton =
    document.getElementById(
      "modalRemoveItem"
    );

  if (!deleteButton) {
    console.error(
      "O botao de remover equipamento "
      + "nao foi encontrado."
    );

    return;
  }

  deleteButton.textContent =
    "Excluir equipamento";

  deleteButton.onclick =
    async event => {
      event.preventDefault();
      event.stopPropagation();

      await confirmAndDeleteEquipment(
        rack,
        equipment,
        deleteButton
      );
    };
}


window.showEquipmentModal =
  function showEquipmentModalWithApiDelete(
    rack,
    equipment
  ) {
    const result =
      showEquipmentModalBeforeApiDelete(
        rack,
        equipment
      );

    installEquipmentDeleteHandler(
      rack,
      equipment
    );

    return result;
  };