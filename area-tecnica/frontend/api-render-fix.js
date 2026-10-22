const bhApiRenderFixApplied = true;


async function reloadBhMapFromApi() {
  try {
    const response = await fetch(
      "/api/dados/frontend",
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        "API respondeu com status "
        + response.status
      );
    }

    const data = await response.json();

    if (!Array.isArray(data?.racks)) {
      throw new Error(
        "Lista de fileiras invalida."
      );
    }

    racks = data.racks;

    apiSyncVersion =
      data?.sync?.version
      || apiSyncVersion
      || null;

    render();
    updateCounts();

    console.info(
      "Mapa area tecnica redesenhado com dados atuais da API.",
      {
        racks: racks.length,
        versao: apiSyncVersion
      }
    );

  } catch (error) {
    console.error(
      "Falha ao redesenhar o mapa area tecnica.",
      error
    );
  }
}


window.addEventListener(
  "load",
  () => {
    window.setTimeout(
      reloadBhMapFromApi,
      300
    );
  }
);