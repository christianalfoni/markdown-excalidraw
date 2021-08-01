import { events } from "react-states";
import { Excalidraw, Page, Project, ProjectEvent } from ".";
import MarkdownContents from "markdown-contents";

import * as path from "path";

const PAGES_DIR = "pages";
const EXCALIDRAWS_DIR = "excalidraws";

export const createProject = (): Project => {
  const projectEvents = events<ProjectEvent>();
  const imports = Promise.all([
    import("isomorphic-git"),
    import("@isomorphic-git/lightning-fs"),
    import("isomorphic-git/http/web"),
  ]).then(([git, LightningFS, http]) => {
    return {
      git,
      fs: new LightningFS.default("fs"),
      http,
    };
  });

  function getProjectPath(repoUrl: string) {
    return repoUrl.replace("https://github.com", "");
  }

  let pages: Page[] = [];
  let excalidraws: {
    [id: string]: Excalidraw;
  } = {};

  return {
    events: projectEvents,
    load(repoUrl) {
      imports.then(({ git, fs, http }) => {
        const projectPath = getProjectPath(repoUrl);

        return fs.promises
          .lstat(projectPath)
          .catch(() =>
            git.clone({
              fs,
              http,
              dir: projectPath,
              url: repoUrl,
              corsProxy: "https://cors.isomorphic-git.org",
            })
          )
          .then(() =>
            Promise.all([
              fs.promises
                .readdir(path.join(projectPath, PAGES_DIR))
                .catch(() =>
                  fs.promises
                    .mkdir(path.join(projectPath, PAGES_DIR))
                    .then(() => [])
                ),
              fs.promises
                .readdir(path.join(projectPath, EXCALIDRAWS_DIR))
                .catch(() =>
                  fs.promises
                    .mkdir(path.join(projectPath, EXCALIDRAWS_DIR))
                    .then(() => [])
                ),
            ])
          )
          .then(([pages, excalidraws]) =>
            Promise.all([
              Promise.all(
                pages.map((name) =>
                  fs.promises
                    .readFile(path.join(projectPath, PAGES_DIR, name))
                    .then((value): Page => {
                      const content = new TextDecoder().decode(value);

                      return {
                        content,
                        toc: MarkdownContents(content).tree(),
                      };
                    })
                )
              ),
              Promise.all(
                excalidraws.map((name) =>
                  fs.promises
                    .readFile(path.join(projectPath, EXCALIDRAWS_DIR, name))
                    .then((value): Excalidraw & { id: string } => ({
                      ...JSON.parse(new TextDecoder().decode(value)),
                      id: path.basename(name, ".json"),
                    }))
                )
              ),
            ])
          )
          .then(([pagesData, excalidrawsData]) => {
            pages = pagesData.length ? pagesData : [{ content: "", toc: [] }];
            excalidraws = excalidrawsData.reduce<{ [id: string]: Excalidraw }>(
              (aggr, data) => {
                aggr[data.id] = {
                  elements: data.elements,
                  appState: data.appState,
                };

                // Weird they do not use a serializable value here
                aggr[data.id].appState.collaborators = new Map();

                return aggr;
              },
              {}
            );
            this.events.emit({
              type: "PROJECT:LOAD_SUCCESS",
              pages,
              excalidraws,
            });
          })
          .catch((error) => {
            this.events.emit({
              type: "PROJECT:LOAD_ERROR",
              error: error.message,
            });
          });
      });
    },
    updatePage(repoUrl, pageIndex, content) {
      // We just mutate without firing an event, to avoid
      // unnecessary reconciliation. It is the same object
      // used in the Project feature
      pages[pageIndex].content = content;
      pages[pageIndex].toc = MarkdownContents(content).tree();

      imports.then(({ fs }) => {
        const projectPath = getProjectPath(repoUrl);
        fs.promises.writeFile(
          path.join(projectPath, PAGES_DIR, `page_${pageIndex}.md`),
          new TextEncoder().encode(content)
        );
      });
    },
    updateExcalidraw(repoUrl, id, excalidraw) {
      // We just mutate without firing an event, to avoid
      // unnecessary reconciliation. It is the same object
      // used in the Project feature
      excalidraws[id] = excalidraw;

      imports.then(({ fs }) => {
        const projectPath = getProjectPath(repoUrl);
        fs.promises.writeFile(
          path.join(projectPath, EXCALIDRAWS_DIR, `${id}.json`),
          new TextEncoder().encode(JSON.stringify(excalidraw))
        );
      });
    },
    addPage(repoUrl, index) {
      pages = [
        ...pages.slice(0, index),
        { content: "", toc: [] },
        ...pages.slice(index + 1),
      ];

      this.events.emit({
        type: "PROJECT:PAGES_UPDATE",
        pages,
      });

      imports.then(({ fs }) => {
        const projectPath = getProjectPath(repoUrl);
        fs.promises.writeFile(
          path.join(projectPath, PAGES_DIR, `page_${index}.md`),
          new TextEncoder().encode("")
        );
      });
    },
  };
};
