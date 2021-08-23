import type ExcalidrawComponent from "@excalidraw/excalidraw";
import { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { AppState } from "@excalidraw/excalidraw/types/types";

export interface Excalidraw {
  getComponent(): typeof ExcalidrawComponent;
  exportToCanvas(
    elements: readonly ExcalidrawElement[],
    appState: AppState
  ): HTMLCanvasElement;
}
