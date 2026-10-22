const rackPanBoundsFixApplied = true;


let rackPanPreviousZoom = 1;


function getRackPanElements() {
  return {
    viewport:
      document.getElementById(
        "rackViewport"
      ),

    stage:
      document.getElementById(
        "rackStage"
      ),

    canvas:
      document.getElementById(
        "rackPanCanvas"
      )
  };
}


function ensureRackPanCanvas() {
  const viewport =
    document.getElementById(
      "rackViewport"
    );

  const stage =
    document.getElementById(
      "rackStage"
    );

  if (
    !viewport
    || !stage
  ) {
    return null;
  }

  let canvas =
    document.getElementById(
      "rackPanCanvas"
    );

  if (!canvas) {
    canvas =
      document.createElement(
        "div"
      );

    canvas.id =
      "rackPanCanvas";

    canvas.style.position =
      "relative";

    canvas.style.flex =
      "0 0 auto";

    canvas.style.boxSizing =
      "border-box";

    canvas.style.minWidth =
      "100%";

    canvas.style.minHeight =
      "100%";

    stage.parentNode.insertBefore(
      canvas,
      stage
    );

    canvas.appendChild(
      stage
    );
  }

  return canvas;
}


function configureRackPanBounds() {
  const canvas =
    ensureRackPanCanvas();

  const {
    viewport,
    stage
  } = getRackPanElements();

  if (
    !viewport
    || !stage
    || !canvas
  ) {
    return;
  }

  const baseScale =
    Number(
      stage.dataset.fitScale
      || 1
    );

  const userZoom =
    Number(
      stage.dataset.userZoom
      || 1
    );

  const actualScale =
    Number(
      stage.dataset.actualScale
      || (
        baseScale
        * userZoom
      )
    );

  const baseWidth = 1200;
  const baseHeight = 720;
  const safetyMargin = 32;

  const scaledWidth =
    Math.ceil(
      baseWidth
      * actualScale
    );

  const scaledHeight =
    Math.ceil(
      baseHeight
      * actualScale
    );

  const zoomChanged =
    Math.abs(
      userZoom
      - rackPanPreviousZoom
    ) > 0.001;

  viewport.style.display =
    "block";

  viewport.style.overflow =
    "auto";

  viewport.style.padding =
    "0";

  stage.style.position =
    "absolute";

  stage.style.margin =
    "0";

  stage.style.left =
    safetyMargin + "px";

  stage.style.top =
    safetyMargin + "px";

  stage.style.transformOrigin =
    "top left";

  if (userZoom > 1.001) {
    canvas.style.width =
      (
        scaledWidth
        + safetyMargin * 2
      )
      + "px";

    canvas.style.height =
      (
        scaledHeight
        + safetyMargin * 2
      )
      + "px";

    canvas.style.minWidth =
      (
        scaledWidth
        + safetyMargin * 2
      )
      + "px";

    canvas.style.minHeight =
      (
        scaledHeight
        + safetyMargin * 2
      )
      + "px";

    if (zoomChanged) {
      window.requestAnimationFrame(
        () => {
          const maximumLeft =
            Math.max(
              0,
              viewport.scrollWidth
              - viewport.clientWidth
            );

          const maximumTop =
            Math.max(
              0,
              viewport.scrollHeight
              - viewport.clientHeight
            );

          viewport.scrollLeft =
            maximumLeft / 2;

          viewport.scrollTop =
            maximumTop / 2;
        }
      );
    }
  } else {
    const availableWidth =
      viewport.clientWidth;

    const availableHeight =
      viewport.clientHeight;

    canvas.style.width =
      Math.max(
        availableWidth,
        scaledWidth
        + safetyMargin * 2
      )
      + "px";

    canvas.style.height =
      Math.max(
        availableHeight,
        scaledHeight
        + safetyMargin * 2
      )
      + "px";

    canvas.style.minWidth =
      "100%";

    canvas.style.minHeight =
      "100%";

    stage.style.left =
      Math.max(
        safetyMargin,
        (
          availableWidth
          - scaledWidth
        ) / 2
      )
      + "px";

    stage.style.top =
      safetyMargin + "px";

    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }

  window.requestAnimationFrame(
    () => {
      stage.dataset.panMinimumLeft =
        "0";

      stage.dataset.panMaximumLeft =
        String(
          Math.max(
            0,
            viewport.scrollWidth
            - viewport.clientWidth
          )
        );

      stage.dataset.panMinimumTop =
        "0";

      stage.dataset.panMaximumTop =
        String(
          Math.max(
            0,
            viewport.scrollHeight
            - viewport.clientHeight
          )
        );
    }
  );

  rackPanPreviousZoom =
    userZoom;
}


const applyRackFitViewBeforePanFix =
  applyRackFitView;


applyRackFitView =
  function applyRackFitViewWithPanBounds() {
    const result =
      applyRackFitViewBeforePanFix();

    window.requestAnimationFrame(
      () => {
        configureRackPanBounds();
      }
    );

    return result;
  };


window.addEventListener(
  "resize",
  () => {
    window.requestAnimationFrame(
      configureRackPanBounds
    );
  }
);