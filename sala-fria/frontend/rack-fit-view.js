const rackFitViewApplied = true;


let rackFitBaseScale = 1;
let rackFitUserZoom = 1;
let rackFitResizeTimer = null;


function getRackFitElements() {
  return {
    viewport:
      document.getElementById(
        "rackViewport"
      ),

    stage:
      document.getElementById(
        "rackStage"
      ),

    zoomValue:
      document.getElementById(
        "rackZoomValue"
      ),

    zoomOut:
      document.getElementById(
        "rackZoomOut"
      ),

    zoomReset:
      document.getElementById(
        "rackZoomReset"
      ),

    zoomIn:
      document.getElementById(
        "rackZoomIn"
      )
  };
}


function calculateRackFitScale() {
  const {
    viewport,
    stage
  } = getRackFitElements();

  if (
    !viewport
    || !stage
  ) {
    return 1;
  }

  stage.style.zoom = "1";
  stage.style.transform = "none";

  const stageWidth =
    1200;

  const stageHeight =
    720;

  const horizontalMargin =
    28;

  const verticalMargin =
    28;

  const availableWidth =
    Math.max(
      1,
      viewport.clientWidth
      - horizontalMargin
    );

  const availableHeight =
    Math.max(
      1,
      viewport.clientHeight
      - verticalMargin
    );

  const widthScale =
    availableWidth
    / stageWidth;

  const heightScale =
    availableHeight
    / stageHeight;

  return Math.min(
    1,
    widthScale,
    heightScale
  );
}


function updateRackFitControls() {
  const {
    zoomValue,
    zoomOut,
    zoomReset,
    zoomIn
  } = getRackFitElements();

  const displayedZoom =
    Math.round(
      rackFitUserZoom
      * 100
    );

  if (zoomValue) {
    zoomValue.textContent =
      displayedZoom + "%";
  }

  if (zoomReset) {
    zoomReset.textContent =
      "100%";
  }

  if (zoomOut) {
    const atMinimum =
      rackFitUserZoom
      <= 1.001;

    zoomOut.disabled =
      atMinimum;

    zoomOut.setAttribute(
      "aria-disabled",
      atMinimum
        ? "true"
        : "false"
    );

    zoomOut.title =
      atMinimum
        ? "A fileira inteira ja esta visivel"
        : "Diminuir zoom";
  }

  if (zoomIn) {
    const atMaximum =
      rackFitUserZoom
      >= 2;

    zoomIn.disabled =
      atMaximum;

    zoomIn.setAttribute(
      "aria-disabled",
      atMaximum
        ? "true"
        : "false"
    );
  }
}


function applyRackFitView() {
  const {
    viewport,
    stage
  } = getRackFitElements();

  if (
    !viewport
    || !stage
  ) {
    return;
  }

  rackFitBaseScale =
    calculateRackFitScale();

  const actualScale =
    rackFitBaseScale
    * rackFitUserZoom;

  stage.style.transform =
    "none";

  stage.style.transformOrigin =
    "top center";

  stage.style.zoom =
    String(
      actualScale
    );

  stage.dataset.fitScale =
    rackFitBaseScale.toFixed(4);

  stage.dataset.userZoom =
    rackFitUserZoom.toFixed(2);

  stage.dataset.actualScale =
    actualScale.toFixed(4);

  viewport.style.justifyContent =
    "center";

  viewport.style.alignItems =
    "flex-start";

  updateRackFitControls();

  if (
    rackFitUserZoom
    <= 1.001
  ) {
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }
}


function setRackFitUserZoom(
  newZoom
) {
  rackFitUserZoom =
    Math.min(
      2,
      Math.max(
        1,
        Number(newZoom)
        || 1
      )
    );

  applyRackFitView();
}


function installRackFitControls() {
  const {
    zoomOut,
    zoomReset,
    zoomIn
  } = getRackFitElements();

  if (zoomOut) {
    zoomOut.onclick = () => {
      setRackFitUserZoom(
        rackFitUserZoom
        - 0.1
      );
    };
  }

  if (zoomReset) {
    zoomReset.onclick = () => {
      setRackFitUserZoom(1);
    };
  }

  if (zoomIn) {
    zoomIn.onclick = () => {
      setRackFitUserZoom(
        rackFitUserZoom
        + 0.1
      );
    };
  }

  updateRackFitControls();
}


const renderRackBeforeFitView =
  renderRackWorkspace;


renderRackWorkspace =
  function renderRackWorkspaceWithFit(
    rack
  ) {
    rackFitUserZoom = 1;

    const result =
      renderRackBeforeFitView(
        rack
      );

    window.requestAnimationFrame(
      () => {
        installRackFitControls();

        window.requestAnimationFrame(
          () => {
            applyRackFitView();
          }
        );
      }
    );

    return result;
  };


window.addEventListener(
  "resize",
  () => {
    window.clearTimeout(
      rackFitResizeTimer
    );

    rackFitResizeTimer =
      window.setTimeout(
        () => {
          if (
            document.getElementById(
              "rackFaceGrid"
            )
          ) {
            applyRackFitView();
          }
        },
        120
      );
  }
);


const rackFitObserver =
  new ResizeObserver(
    entries => {
      const rackIsOpen =
        document.getElementById(
          "rackFaceGrid"
        );

      if (
        entries.length
        && rackIsOpen
      ) {
        window.clearTimeout(
          rackFitResizeTimer
        );

        rackFitResizeTimer =
          window.setTimeout(
            applyRackFitView,
            80
          );
      }
    }
  );


window.addEventListener(
  "DOMContentLoaded",
  () => {
    const drawer =
      document.querySelector(
        ".drawer"
      );

    if (drawer) {
      rackFitObserver.observe(
        drawer
      );
    }
  }
);