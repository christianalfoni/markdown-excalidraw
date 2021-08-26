import { subscription } from "react-states";
import { Project } from ".";

export const createProject = (): Project => ({
  subscription: subscription(),
  load() {},
  updateChapter() {},
  updateExcalidraw() {},
  addChapter() {},
  loadSnippet() {},
  save() {},
  checkVersion() {},
  getLatestVersion() {},
  loadSandbox() {},
});
