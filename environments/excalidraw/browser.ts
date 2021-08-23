import ExcalidrawComponent, { exportToCanvas } from "@excalidraw/excalidraw";
import { Excalidraw } from ".";

export const createExcalidraw = (): Excalidraw => ({
  getComponent() {
    return ExcalidrawComponent;
  },
  exportToCanvas(elements, appState) {
    return exportToCanvas({ elements, appState });
  },
});
