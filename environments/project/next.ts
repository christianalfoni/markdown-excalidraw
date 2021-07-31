import { events } from "react-states";
import { Project } from ".";

export const createProject = (): Project => ({
  events: events(),
  load() {},
  updatePage() {},
  updateExcalidraw() {},
});
