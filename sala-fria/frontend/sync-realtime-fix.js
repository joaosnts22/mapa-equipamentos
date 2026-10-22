const syncRealtimeFixApplied = true;


/*
 * FIX 1
 *
 * Um rack criado durante o modo de edicao
 * nao existe no snapshot original.
 *
 * Antes, esse rack era considerado
 * "nao alterado" e sua nova posicao
 * nao era enviada ao servidor.
 */
const rackPositionChangedBeforeRealtimeFix =
  rackPositionChanged;


rackPositionChanged =
  function rackPositionChangedWithNewRack(
    currentRack,
    originalRack
  ) {
    if (!currentRack) {
      return false;
    }

    if (!originalRack) {
      return Boolean(
        Number.isInteger(
          currentRack.databaseId
        )
        && currentRack.databaseId > 0
        && Number.isInteger(
          currentRack.version
        )
        && currentRack.version > 0
      );
    }

    return rackPositionChangedBeforeRealtimeFix(
      currentRack,
      originalRack
    );
  };


/*
 * Verifica se existem posicoes locais
 * ainda nao salvas.
 *
 * O polling pode funcionar com o modo
 * de edicao ativo, desde que nenhum rack
 * tenha sido movimentado localmente.
 */
function hasUnsavedLocalRackPositions() {
  if (!editMode) {
    return false;
  }

  if (
    typeof getChangedRackPositions
    !== "function"
  ) {
    return false;
  }

  try {
    return (
      getChangedRackPositions()
        .length > 0
    );
  } catch (error) {
    console.warn(
      "Nao foi possivel verificar "
      + "posicoes locais pendentes.",
      error
    );

    return true;
  }
}


/*
 * O estado ocupado deixa de considerar
 * somente editMode como bloqueio.
 *
 * Agora a sincronizacao e bloqueada apenas
 * quando existe uma operacao que realmente
 * nao pode ser interrompida.
 */
isSyncInterfaceBusy =
  function isSyncInterfaceReallyBusy() {
    if (
      document.visibilityState
      !== "visible"
    ) {
      return true;
    }

    if (
      typeof syncState !== "undefined"
      && syncState.editing
    ) {
      return true;
    }

    if (
      typeof drag !== "undefined"
      && drag
    ) {
      return true;
    }

    if (
      typeof rackPan !== "undefined"
      && rackPan
    ) {
      return true;
    }

    if (
      typeof mapPan !== "undefined"
      && mapPan
    ) {
      return true;
    }

    if (
      hasUnsavedLocalRackPositions()
    ) {
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
      typeof isElementOpen
      === "function"
      && isElementOpen(
        "equipmentModal"
      )
    ) {
      return true;
    }

    if (
      typeof hasPendingCrudRequest
      === "function"
      && hasPendingCrudRequest()
    ) {
      return true;
    }

    return false;
  };


/*
 * FIX 2
 *
 * A versao remota deve ser consultada
 * mesmo quando a interface esta ocupada.
 *
 * Se houver mudanca, ela fica registrada
 * em pendingData e sera aplicada assim
 * que a interface ficar livre.
 */
synchronizeMapIfNeeded =
  async function synchronizeMapRealtime() {
    if (
      syncState.running
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

        if (
          !syncState.pendingData
          || syncState.pendingData
          === remoteVersion
        ) {
          syncState.pendingData =
            null;
        }

        return;
      }

      syncState.pendingData =
        remoteVersion;

      if (
        isSyncInterfaceBusy()
      ) {
        return;
      }

      const remoteData =
        await readRemoteFrontendData();

      if (
        isSyncInterfaceBusy()
      ) {
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
      syncState.running =
        false;
    }
  };


/*
 * Assim que a interface fica livre,
 * tenta aplicar imediatamente qualquer
 * sincronizacao que tenha ficado pendente.
 */
function requestPendingRealtimeSync() {
  window.setTimeout(
    () => {
      if (
        !isSyncInterfaceBusy()
      ) {
        synchronizeMapIfNeeded();
      }
    },
    100
  );
}


document.addEventListener(
  "pointerup",
  requestPendingRealtimeSync,
  true
);


document.addEventListener(
  "pointercancel",
  requestPendingRealtimeSync,
  true
);
