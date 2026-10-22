const equipmentRelativeZoomApplied = true;

const RACK_ZOOM_BASE_SCALE = 1.4;
const RACK_ZOOM_STEP_SCALE = 0.14;
const RACK_ZOOM_MIN_SCALE = 0.56;
const RACK_ZOOM_MAX_SCALE = 2.8;

const renderRackWorkspaceBeforeRelativeZoom =
  window.renderRackWorkspace;


function relativeRackZoomPercentage(
  physicalScale
) {
  return Math.round(
    (
      physicalScale
      / RACK_ZOOM_BASE_SCALE
    )
    * 100
  );
}


window.setRackZoom = function setRelativeRackZoom(
  value
) {
  const numericValue =
    Number(value);

  if (!Number.isFinite(numericValue)) {
    return;
  }

  const normalizedValue =
    Math.round(
      numericValue * 100
    )
    / 100;

  rackZoom = Math.max(
    RACK_ZOOM_MIN_SCALE,
    Math.min(
      RACK_ZOOM_MAX_SCALE,
      normalizedValue
    )
  );

  const rackStage =
    document.getElementById(
      "rackStage"
    );

  if (rackStage) {
    rackStage.style.transform =
      "scale("
      + rackZoom
      + ")";
  }

  const zoomValue =
    document.getElementById(
      "rackZoomValue"
    );

  if (zoomValue) {
    zoomValue.textContent =
      relativeRackZoomPercentage(
        rackZoom
      )
      + "%";
  }
};


function installRelativeRackZoomControls() {
  const zoomOutButton =
    document.getElementById(
      "rackZoomOut"
    );

  const zoomResetButton =
    document.getElementById(
      "rackZoomReset"
    );

  const zoomInButton =
    document.getElementById(
      "rackZoomIn"
    );

  if (zoomOutButton) {
    zoomOutButton.onclick = () => {
      window.setRackZoom(
        rackZoom
        - RACK_ZOOM_STEP_SCALE
      );
    };
  }

  if (zoomResetButton) {
    zoomResetButton.onclick = () => {
      window.setRackZoom(
        RACK_ZOOM_BASE_SCALE
      );
    };
  }

  if (zoomInButton) {
    zoomInButton.onclick = () => {
      window.setRackZoom(
        rackZoom
        + RACK_ZOOM_STEP_SCALE
      );
    };
  }
}


window.renderRackWorkspace =
  function renderRackWorkspaceWithRelativeZoom(
    rack
  ) {
    renderRackWorkspaceBeforeRelativeZoom(
      rack
    );

    installRelativeRackZoomControls();

    window.setRackZoom(
      rackZoom
    );
  };


rackZoom = RACK_ZOOM_BASE_SCALE;