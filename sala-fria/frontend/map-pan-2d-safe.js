const mapPan2dSafeApplied = true;


let mapPan2dSafeState = null;


function mapPan2dSafeCanStart(
  event
) {
  if (event.button !== 0) {
    return false;
  }

  const target =
    event.target instanceof Element
      ? event.target
      : null;

  if (!target) {
    return false;
  }

  if (
    target.closest(".rack")
    || target.closest("button")
    || target.closest("input")
    || target.closest("select")
    || target.closest("textarea")
  ) {
    return false;
  }

  return true;
}


function mapPan2dSafeStart(
  event
) {
  if (
    !mapPan2dSafeCanStart(
      event
    )
  ) {
    return;
  }

  event.preventDefault();

  pointerMoved = false;

  mapPan2dSafeState = {
    pointerId:
      event.pointerId,
    startX:
      event.clientX,
    startY:
      event.clientY,
    initialScrollLeft:
      roomWrap.scrollLeft,
    initialScrollTop:
      roomWrap.scrollTop
  };

  roomWrap.classList.add(
    "panning"
  );

  roomWrap.setPointerCapture(
    event.pointerId
  );
}


function mapPan2dSafeMove(
  event
) {
  const state =
    mapPan2dSafeState;

  if (
    !state
    || event.pointerId
    !== state.pointerId
  ) {
    return;
  }

  const movementX =
    event.clientX
    - state.startX;

  const movementY =
    event.clientY
    - state.startY;

  if (
    Math.abs(movementX) > 3
    || Math.abs(movementY) > 3
  ) {
    pointerMoved = true;
  }

  roomWrap.scrollLeft =
    state.initialScrollLeft
    - movementX;

  roomWrap.scrollTop =
    state.initialScrollTop
    - movementY;
}


function mapPan2dSafeFinish(
  event
) {
  const state =
    mapPan2dSafeState;

  if (
    !state
    || event.pointerId
    !== state.pointerId
  ) {
    return;
  }

  try {
    roomWrap.releasePointerCapture(
      event.pointerId
    );
  } catch {
  }

  mapPan2dSafeState = null;

  roomWrap.classList.remove(
    "panning"
  );
}


function mapPan2dSafeWheel(
  event
) {
  if (
    !event.target.closest(
      "#roomWrap"
    )
  ) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (
    event.shiftKey
    || Math.abs(event.deltaX)
    > Math.abs(event.deltaY)
  ) {
    roomWrap.scrollLeft +=
      event.deltaX
      || event.deltaY;

    return;
  }

  roomWrap.scrollTop +=
    event.deltaY;
}


function installMapPan2dSafe() {
  if (
    roomWrap.dataset
      .mapPan2dSafeInstalled
    === "true"
  ) {
    return;
  }

  roomWrap.dataset
    .mapPan2dSafeInstalled =
      "true";

  roomWrap.style.overflow =
    "auto";

  roomWrap.style.overflowX =
    "auto";

  roomWrap.style.overflowY =
    "auto";

  if (
    typeof startMapPan
    === "function"
  ) {
    roomWrap.removeEventListener(
      "pointerdown",
      startMapPan
    );
  }

  if (
    typeof moveMapPan
    === "function"
  ) {
    roomWrap.removeEventListener(
      "pointermove",
      moveMapPan
    );
  }

  if (
    typeof endMapPan
    === "function"
  ) {
    roomWrap.removeEventListener(
      "pointerup",
      endMapPan
    );

    roomWrap.removeEventListener(
      "pointercancel",
      endMapPan
    );
  }

  roomWrap.addEventListener(
    "pointerdown",
    mapPan2dSafeStart
  );

  roomWrap.addEventListener(
    "pointermove",
    mapPan2dSafeMove
  );

  roomWrap.addEventListener(
    "pointerup",
    mapPan2dSafeFinish
  );

  roomWrap.addEventListener(
    "pointercancel",
    mapPan2dSafeFinish
  );

  roomWrap.addEventListener(
    "wheel",
    mapPan2dSafeWheel,
    {
      passive: false,
      capture: true
    }
  );
}


installMapPan2dSafe();