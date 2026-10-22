const equipmentUpdateNoopApplied = true;


const updateEquipmentBeforeNoop =
  updateEquipmentThroughApi;


function equipmentNoopText(
  elementId
) {
  return String(
    document.getElementById(
      elementId
    )?.value
    || ""
  ).trim();
}


function equipmentNoopNullable(
  value
) {
  return String(
    value
    || ""
  ).trim();
}


function findEquipmentForNoop() {
  const editingKey =
    syncState?.editing?.key;

  if (!editingKey) {
    return null;
  }

  for (const rack of racks) {
    const equipment =
      rack.items?.find(
        item =>
          item.equipmentKey
          === editingKey
          || item.id
          === editingKey
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


function equipmentFormHasChanges(
  equipment
) {
  const formName =
    equipmentNoopText(
      "fName"
    );

  const formRackKey =
    equipmentNoopText(
      "fRackKey"
    );

  const formModule =
    Number(
      document.getElementById(
        "fModule"
      )?.value
    );

  const formStart =
    Number(
      document.getElementById(
        "fStart"
      )?.value
    );

  const formUnits =
    Number(
      document.getElementById(
        "fUnits"
      )?.value
    );

  const formManufacturer =
    equipmentNoopText(
      "fManufacturer"
    );

  const formModel =
    equipmentNoopText(
      "fModel"
    );

  const formSerial =
    equipmentNoopText(
      "fSerial"
    );

  const formAsset =
    equipmentNoopText(
      "fAsset"
    );

  const formFunction =
    equipmentNoopText(
      "fFunction"
    );

  const formNotes =
    equipmentNoopText(
      "fNotes"
    );

  const formIsPatch =
    document.getElementById(
      "fIsPatch"
    )?.checked === true;

  return (
    formName
    !== equipmentNoopNullable(
      equipment.name
    )
    ||
    formRackKey
    !== equipmentNoopNullable(
      equipment.rackKey
    )
    ||
    formModule
    !== Number(
      equipment.moduloRack
    )
    ||
    formStart
    !== Number(
      equipment.start
    )
    ||
    formUnits
    !== Number(
      equipment.units
    )
    ||
    formManufacturer
    !== equipmentNoopNullable(
      equipment.manufacturer
    )
    ||
    formModel
    !== equipmentNoopNullable(
      equipment.model
    )
    ||
    formSerial
    !== equipmentNoopNullable(
      equipment.serial
    )
    ||
    formAsset
    !== equipmentNoopNullable(
      equipment.asset
    )
    ||
    formFunction
    !== equipmentNoopNullable(
      equipment.function
    )
    ||
    formNotes
    !== equipmentNoopNullable(
      equipment.notes
    )
    ||
    formIsPatch
    !== Boolean(
      equipment.isPatch
    )
  );
}


function finishEquipmentNoop(
  rack,
  equipment
) {
  syncState.editing = null;
  editingItemId = null;

  selectedRackId =
    rack.id;

  document.getElementById(
    "formError"
  )?.classList.remove(
    "show"
  );

  renderRackWorkspace(
    rack
  );

  showStatus(
    "NENHUMA ALTERACAO NECESSARIA"
  );

  console.info(
    "Salvamento do equipamento "
    + "ignorado porque nenhum campo mudou.",
    {
      databaseId:
        equipment.databaseId,
      version:
        equipment.version
    }
  );

  return equipment;
}


updateEquipmentThroughApi =
  async function() {
    const located =
      findEquipmentForNoop();

    if (!located) {
      return updateEquipmentBeforeNoop();
    }

    const hasChanges =
      equipmentFormHasChanges(
        located.equipment
      );

    if (!hasChanges) {
      return finishEquipmentNoop(
        located.rack,
        located.equipment
      );
    }

    return updateEquipmentBeforeNoop();
  };
