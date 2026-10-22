const equipmentUpdateDedupApplied = true;


const updateEquipmentThroughApiOriginal =
  updateEquipmentThroughApi;


let equipmentUpdatePromise = null;


updateEquipmentThroughApi =
  async function() {
    if (equipmentUpdatePromise) {
      console.info(
        "Salvamento duplicado ignorado."
      );

      return equipmentUpdatePromise;
    }

    equipmentUpdatePromise =
      updateEquipmentThroughApiOriginal();

    try {
      return await equipmentUpdatePromise;

    } finally {
      equipmentUpdatePromise = null;
    }
  };