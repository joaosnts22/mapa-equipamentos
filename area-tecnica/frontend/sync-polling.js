const syncPollingApplied = true;

const SYNC_VERSION_URL =
  "/api/sync/version";

const SYNC_DATA_URL =
  "/api/dados/frontend";

const SYNC_POLLING_INTERVAL_MS =
  5000;


function isElementOpen(
  elementId,
  openClass = "open"
) {
  const element =
    document.getElementById(
      elementId
    );

  return Boolean(
    element
    && element.classList.contains(
      openClass
    )
  );
}


function hasPendingCrudRequest() {
  const disabledAction =
    document.querySelector(
      [
        "#saveItemButton:disabled",
        "#saveRackButton:disabled",
        "#createRackButton:disabled",
        "#deleteRackButton:disabled",
        "#modalRemoveItem:disabled"
      ].join(",")
    );

  return Boolean(
    disabledAction
  );
}


function isSyncInterfaceBusy() {
  if (
    document.visibilityState
    !== "visible"
  ) {
    return true;
  }

  if (editMode) {
    return true;
  }

  if (syncState.editing) {
    return true;
  }

  if (drag || rackPan || mapPan) {
    return true;
  }

  if (
    document.querySelector(
      ".item-form"
    )
  ) {
    return true;
  }

  if (
    isElementOpen(
      "equipmentModal"
    )
  ) {
    return true;
  }

  if (
    hasPendingCrudRequest()
  ) {
    return true;
  }

  return false;
}


async function readRemoteSyncVersion() {
  const response = await fetch(
    SYNC_VERSION_URL,
    {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json"
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      "A verificacao de sincronizacao "
      + "respondeu com HTTP "
      + response.status
      + "."
    );
  }

  const data =
    await response.json();

  const remoteVersion =
    String(
      data?.versao || ""
    ).trim();

  if (!remoteVersion) {
    throw new Error(
      "A API de sincronizacao nao "
      + "retornou uma versao valida."
    );
  }

  return remoteVersion;
}


async function readRemoteFrontendData() {
  const response = await fetch(
    SYNC_DATA_URL,
    {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "Accept": "application/json"
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(
      "A atualizacao dos dados respondeu "
      + "com HTTP "
      + response.status
      + "."
    );
  }

  const data =
    await response.json();

  if (!Array.isArray(data?.racks)) {
    throw new Error(
      "A API nao retornou uma lista "
      + "valida de fileiras."
    );
  }

  const dataVersion =
    String(
      data?.sync?.version || ""
    ).trim();

  if (!dataVersion) {
    throw new Error(
      "Os dados atualizados nao possuem "
      + "uma versao de sincronizacao valida."
    );
  }

  return {
    racks: data.racks,
    version: dataVersion
  };
}


function findSelectedRackAfterSync() {
  if (!selectedRackId) {
    return null;
  }

  return racks.find(
    rack =>
      rack.id === selectedRackId
      || rack.rackKey === selectedRackId
  ) || null;
}


function applyRemoteFrontendData(
  remoteData
) {
  const drawerWasOpen =
    isElementOpen(
      "overlay"
    );

  const previousSelectedRackId =
    selectedRackId;

  racks = remoteData.racks;

  apiSyncVersion =
    remoteData.version;

  normalizeData();
  updateCounts();
  render();

  document.documentElement.dataset.dataSource =
    "api";

  selectedRackId =
    previousSelectedRackId;

  const selectedRack =
    findSelectedRackAfterSync();

  if (
    drawerWasOpen
    && selectedRack
  ) {
    document.getElementById(
      "drawerTitle"
    ).textContent =
      selectedRack.displayName
      || selectedRack.rackKey
      || selectedRack.id
      || "Fileira sem identificacao";

    renderRackWorkspace(
      selectedRack
    );

    overlay.classList.add(
      "open"
    );
  } else if (
    drawerWasOpen
    && !selectedRack
  ) {
    selectedRackId = null;

    overlay.classList.remove(
      "open"
    );
  }

  syncState.marker =
    apiSyncVersion;

  syncState.pendingData =
    null;

  console.info(
    "Mapa da Sala Fria: "
    + "dados sincronizados automaticamente.",
    {
      versao: apiSyncVersion,
      racks: racks.length,
      equipamentos: racks.reduce(
        (total, rack) =>
          total
          + (
            Array.isArray(rack.items)
              ? rack.items.length
              : 0
          ),
        0
      )
    }
  );

  showStatus(
    "MAPA ATUALIZADO"
  );
}


async function synchronizeMapIfNeeded() {
  if (
    syncState.running
    || isSyncInterfaceBusy()
  ) {
    return;
  }

  syncState.running = true;

  try {
    const remoteVersion =
      await readRemoteSyncVersion();

    if (!apiSyncVersion) {
      apiSyncVersion =
        remoteVersion;

      syncState.marker =
        remoteVersion;

      return;
    }

    if (
      remoteVersion
      === apiSyncVersion
    ) {
      syncState.marker =
        remoteVersion;

      syncState.pendingData =
        null;

      return;
    }

    syncState.pendingData =
      remoteVersion;

    if (isSyncInterfaceBusy()) {
      return;
    }

    const remoteData =
      await readRemoteFrontendData();

    if (isSyncInterfaceBusy()) {
      syncState.pendingData =
        remoteData.version;

      return;
    }

    applyRemoteFrontendData(
      remoteData
    );
  } catch (error) {
    console.warn(
      "Mapa da Sala Fria: "
      + "nao foi possivel verificar "
      + "a sincronizacao automatica.",
      error
    );
  } finally {
    syncState.running = false;
  }
}


function startSyncPolling() {
  if (syncState.timer) {
    window.clearInterval(
      syncState.timer
    );
  }

  syncState.marker =
    apiSyncVersion;

  syncState.timer =
    window.setInterval(
      synchronizeMapIfNeeded,
      SYNC_POLLING_INTERVAL_MS
    );

  console.info(
    "Mapa da Sala Fria: "
    + "sincronizacao automatica ativada.",
    {
      intervaloMs:
        SYNC_POLLING_INTERVAL_MS,
      versaoInicial:
        apiSyncVersion
    }
  );
}


document.addEventListener(
  "visibilitychange",
  () => {
    if (
      document.visibilityState
      === "visible"
    ) {
      synchronizeMapIfNeeded();
    }
  }
);


window.addEventListener(
  "load",
  () => {
    startSyncPolling();
  },
  {
    once: true
  }
);
