const homeSearchEnhancedApplied = true;


function normalizeHomeSearchValue(
  value
) {
  return String(
    value ?? ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}


function rackMatchesEnhancedSearch(
  rack,
  query
) {
  const values = [
    rack.id,
    rack.rackKey,
    rack.displayName,
    rack.owner
  ];

  for (
    const equipment
    of rack.items || []
  ) {
    values.push(
      equipment.name,
      equipment.manufacturer,
      equipment.model,
      equipment.serial,
      equipment.asset,
      equipment.function,
      equipment.notes
    );

    if (
      Array.isArray(
        equipment.docs
      )
    ) {
      values.push(
        ...equipment.docs
      );
    }

    if (
      Array.isArray(
        equipment.searchTerms
      )
    ) {
      values.push(
        ...equipment.searchTerms
      );
    }
  }

  const searchableText =
    normalizeHomeSearchValue(
      values.join(" ")
    );

  return searchableText.includes(
    query
  );
}


function centerHomeRackElement(
  rackElement
) {
  if (
    !rackElement
    || !roomWrap
  ) {
    return;
  }

  /*
   * Posicao medida pela tela, e nao por offsetLeft/offsetTop:
   * desde a ampliacao da Sala Fria a sala (#room) fica deslocada
   * dentro de #roomStage, e offsetTop so conta a partir de #room.
   */
  const wrapRect =
    roomWrap.getBoundingClientRect();

  const rackRect =
    rackElement.getBoundingClientRect();

  const rackCenterX =
    roomWrap.scrollLeft
    + rackRect.left
    - wrapRect.left
    + (
        rackRect.width
        / 2
      );

  const rackCenterY =
    roomWrap.scrollTop
    + rackRect.top
    - wrapRect.top
    + (
        rackRect.height
        / 2
      );

  const targetLeft =
    rackCenterX
    - (
        roomWrap.clientWidth
        / 2
      );

  const targetTop =
    rackCenterY
    - (
        roomWrap.clientHeight
        / 2
      );

  const maximumLeft =
    Math.max(
      0,
      roomWrap.scrollWidth
      - roomWrap.clientWidth
    );

  const maximumTop =
    Math.max(
      0,
      roomWrap.scrollHeight
      - roomWrap.clientHeight
    );

  roomWrap.scrollTo({
    left: Math.max(
      0,
      Math.min(
        targetLeft,
        maximumLeft
      )
    ),
    top: Math.max(
      0,
      Math.min(
        targetTop,
        maximumTop
      )
    ),
    behavior: "smooth"
  });
}


function applyEnhancedHomeSearch() {
  if (!search) {
    return;
  }

  const query =
    normalizeHomeSearchValue(
      search.value
    );

  const rackElements =
    Array.from(
      room.querySelectorAll(
        ".rack"
      )
    );

  if (
    !query
    || editMode
  ) {
    room.classList.remove(
      "searching"
    );

    rackElements.forEach(
      element => {
        element.classList.remove(
          "match"
        );
      }
    );

    return;
  }

  room.classList.add(
    "searching"
  );

  const matchedElements = [];

  for (
    const rackElement
    of rackElements
  ) {
    const rackId =
      rackElement.dataset.rackId;

    const rack =
      racks.find(
        currentRack =>
          String(
            currentRack.id
          )
          === String(
            rackId
          )
          ||
          String(
            currentRack.rackKey
          )
          === String(
            rackId
          )
      );

    const matches =
      rack
      && rackMatchesEnhancedSearch(
        rack,
        query
      );

    rackElement.classList.toggle(
      "match",
      Boolean(matches)
    );

    if (matches) {
      matchedElements.push(
        rackElement
      );
    }
  }

  if (
    matchedElements.length === 1
  ) {
    window.requestAnimationFrame(
      () => {
        centerHomeRackElement(
          matchedElements[0]
        );
      }
    );
  }
}


let homeSearchTimer = null;


search.addEventListener(
  "input",
  () => {
    window.clearTimeout(
      homeSearchTimer
    );

    homeSearchTimer =
      window.setTimeout(
        applyEnhancedHomeSearch,
        80
      );
  }
);


window.addEventListener(
  "resize",
  () => {
    if (
      normalizeHomeSearchValue(
        search.value
      )
    ) {
      window.requestAnimationFrame(
        applyEnhancedHomeSearch
      );
    }
  }
);