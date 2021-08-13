import { subscription } from "react-states";
import { Project } from ".";

export const createProject = (): Project => ({
  subscription: subscription(),
  load() {},
  updatePage() {},
  updateExcalidraw() {},
  addPage() {},
  loadSnippet() {},
  save() {},
});
