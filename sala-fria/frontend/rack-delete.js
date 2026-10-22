const rackDeleteApiApplied = true;

const showRackFormBeforeDeleteButton =
  showRackForm;


function showRackDeleteError(message) {
  const errorBox =
    document.getElementById(
      "formError"
    );

  if (!errorBox) {
    window.alert(message);
    return;
  }

  errorBox.textContent = message;

  errorBox.classList.add(
    "show"
  );
}


function clearRackDeleteError() {
  const errorBox =
    document.getElementById(
      "formError"
    );

  if (!errorBox) {
    return;
  }

  errorBox.textContent = "";

  errorBox.classList.remove(
    "show"
  );
}


function rackDisplayNameForDelete(rack) {
  return String(
    rack?.displayName
    || rack?.rackKey
    || rack?.id
    || "Fileira sem identificacao"
  );
}


function validateRackForDelete(rack) {
  if (!rack) {
    throw new Error(
      "A fileira selecionada nao foi encontrada."
    );
  }

  if (
    !Number.isInteger(
      rack.databaseId
    )
    || rack.databaseId < 1
  ) {
    throw new Error(
      "A fileira nao possui databaseId valido."
    );
  }

  if (
    !Number.isInteger(
      rack.version
    )
    || rack.version < 1
  ) {
    throw new Error(
      "A fileira nao possui versao valida."
    );
  }
}


async function deleteRackThroughApi(rack) {
  if (!isAdministrator()) {
    throw new Error(
      "Entre como administrador para excluir fileiras."
    );
  }

  validateRackForDelete(rack);

  const response = await fetch(
    "/api/racks/"
    + rack.databaseId,
    {
      method: "DELETE",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        versao_dados: rack.version
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
      + "para excluir fileiras."
    );
  }

  if (response.status === 404) {
    throw new Error(
      await readApiError(response)
      || "A fileira nao foi encontrada no banco."
    );
  }

  if (response.status === 409) {
    const detail =
      await readApiError(response);

    const conflictError =
      new Error(
        detail
        || "Nao foi possivel excluir a fileira."
      );

    conflictError.isConflict = true;

    throw conflictError;
  }

  if (response.status === 422) {
    throw new Error(
      await readApiError(response)
      || "Os dados enviados para exclusao "
      + "nao foram aceitos."
    );
  }

  if (!response.ok) {
    throw new Error(
      await readApiError(response)
      || (
        "O servidor respondeu com HTTP "
        + response.status
        + "."
      )
    );
  }

  return await response.json();
}


function removeDeletedRackFromFrontend(
  rack
) {
  const rackIndex =
    racks.indexOf(rack);

  if (rackIndex < 0) {
    throw new Error(
      "A fileira excluida nao foi encontrada "
      + "na lista atual do frontend."
    );
  }

  racks.splice(
    rackIndex,
    1
  );

  selectedRackId = null;
  editingItemId = null;

  if (
    typeof syncState === "object"
    && syncState
  ) {
    syncState.editing = null;
  }

  updateCounts();
  render();

  overlay.classList.remove(
    "open"
  );
}


async function confirmAndDeleteRack(
  rack,
  deleteButton
) {
  clearRackDeleteError();

  const rackName =
    rackDisplayNameForDelete(rack);

  const confirmed = window.confirm(
    "Excluir a fileira "
    + rackName
    + "?\n\n"
    + "A exclusao sera bloqueada se existirem "
    + "equipamentos visiveis vinculados à fileira."
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
    await deleteRackThroughApi(
      rack
    );

    removeDeletedRackFromFrontend(
      rack
    );

    showStatus(
      "FILEIRA "
      + rackName
      + " EXCLUIDA"
    );
  } catch (error) {
    console.error(
      "Falha ao excluir fileira pela API.",
      error
    );

    showRackDeleteError(
      error.message
      || "Nao foi possivel excluir a fileira."
    );

    if (error.isConflict) {
      showStatus(
        "EXCLUSAO DE FILEIRA BLOQUEADA"
      );
    }
  } finally {
    const currentDeleteButton =
      document.getElementById(
        "deleteRackButton"
      );

    if (currentDeleteButton) {
      currentDeleteButton.disabled =
        false;

      currentDeleteButton.textContent =
        originalText;
    }
  }
}


function addDeleteButtonToRackForm(
  rack
) {
  if (!isAdministrator()) {
    return;
  }

  if (
    document.getElementById(
      "deleteRackButton"
    )
  ) {
    return;
  }

  const formActions =
    document.querySelector(
      ".item-form .form-actions"
    );

  if (!formActions) {
    console.error(
      "O conteiner de acoes do formulario "
      + "de fileira nao foi encontrado."
    );

    return;
  }

  const deleteButton =
    document.createElement(
      "button"
    );

  deleteButton.type = "button";

  deleteButton.id =
    "deleteRackButton";

  deleteButton.className =
    "mini-btn danger";

  deleteButton.textContent =
    "Excluir fileira";

  deleteButton.onclick = async event => {
    event.preventDefault();
    event.stopPropagation();

    await confirmAndDeleteRack(
      rack,
      deleteButton
    );
  };

  formActions.insertBefore(
    deleteButton,
    formActions.firstChild
  );
}


showRackForm = function showRackFormWithDelete(
  rack
) {
  const result =
    showRackFormBeforeDeleteButton(
      rack
    );

  addDeleteButtonToRackForm(
    rack
  );

  return result;
};