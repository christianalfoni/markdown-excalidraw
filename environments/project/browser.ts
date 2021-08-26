import { subscription } from "react-states";
import {
  Excalidraw,
  GitStatus,
  Chapter,
  Project,
  ProjectSubscription,
} from ".";
import MarkdownContents from "markdown-contents";
import debounce from "lodash.debounce";

import * as path from "path";

const CHAPTERS_DIR = "chapters";
const EXCALIDRAWS_DIR = "excalidraws";
const statusToString: {
  [key: string]: GitStatus;
} = {
  "020": "ADD_UNSTAGED",
  "022": "ADD_STAGED",
  "023": "ADD_PARTIALLY_STAGED",
  "111": "UNMODIFIED",
  "121": "MODIFIED_UNSTAGED",
  "122": "MODIFIED_STAGED",
  "123": "MODIFIED_PARTIALLY_STAGED",
  "101": "DELETED_UNSTAGED",
  "100": "DELETED_STAGED",
};

export const createProject = (): Project => {
  const projectSubscription = subscription<ProjectSubscription>();
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

  function getChanges(repoUrl: string) {
    const projectPath = getProjectPath(repoUrl);

    return imports.then(({ git, fs }) =>
      git
        .statusMatrix({
          fs,
          dir: projectPath,
          filter: (f) => f.endsWith(".json") || f.endsWith(".md"),
        })
        .then((status) =>
          status
            .map(([path, head, workdir, stage]) => ({
              path,
              status: statusToString[`${head}${workdir}${stage}`],
            }))
            .filter((change) => change.status !== "UNMODIFIED")
        )
    );
  }

  function getFilesRecursively(
    dir: string,
    nestedDir?: string
  ): Promise<{
    [path: string]: string;
  }> {
    return imports.then(({ fs }) =>
      fs.promises
        .readdir(dir)
        .then((contents) =>
          Promise.all(
            contents.map((fileOrDir) => {
              const fullPath = path.join(dir, fileOrDir);

              return fs.promises.lstat(fullPath).then((lstat) => {
                if (lstat.isDirectory()) {
                  return getFilesRecursively(fullPath, fileOrDir);
                }

                return fs.promises.readFile(fullPath).then((value) => ({
                  [`/${path.join(nestedDir || "", fileOrDir)}`]:
                    new TextDecoder().decode(value),
                }));
              });
            })
          )
        )
        .then((files) =>
          files.reduce<{ [path: string]: string }>(
            (aggr, file) => ({
              ...aggr,
              ...file,
            }),
            {}
          )
        )
    );
  }

  const emitChangesDebounced = debounce((repoUrl: string) => {
    getChanges(repoUrl).then((changes) => {
      projectSubscription.emit({
        type: "PROJECT:GIT_UPDATE",
        changes,
      });
    });
  }, 500);

  let chapters: Chapter[] = [];
  let excalidraws: {
    [id: string]: Excalidraw;
  } = {};
  let snippets: {
    [path: string]: string;
  } = {};
  let sandboxes: {
    [path: string]: {
      [filePath: string]: string;
    };
  } = {};

  function loadProject(repoUrl: string, branch: string) {
    return imports.then(({ git, fs }) => {
      const projectPath = getProjectPath(repoUrl);

      function readDirectories() {
        return Promise.all([
          fs.promises
            .readdir(path.join(projectPath, CHAPTERS_DIR))
            .catch(() =>
              fs.promises
                .mkdir(path.join(projectPath, CHAPTERS_DIR))
                .then(() => [])
            ),
          fs.promises
            .readdir(path.join(projectPath, EXCALIDRAWS_DIR))
            .catch(() =>
              fs.promises
                .mkdir(path.join(projectPath, EXCALIDRAWS_DIR))
                .then(() => [])
            ),
        ]);
      }

      function getCommitSha() {
        return git.resolveRef({ fs, dir: projectPath, ref: branch });
      }

      function getChapters(chapters: string[]) {
        return Promise.all(
          chapters.map((name) =>
            fs.promises
              .readFile(path.join(projectPath, CHAPTERS_DIR, name))
              .then((value): Chapter => {
                const content = new TextDecoder().decode(value);

                return {
                  content,
                  toc: MarkdownContents(content).tree(),
                };
              })
          )
        ).then((chaptersData) =>
          chaptersData.length ? chaptersData : [{ content: "", toc: [] }]
        );
      }

      function getExcalidraws(excalidraws: string[]) {
        return Promise.all(
          excalidraws.map((name) =>
            fs.promises
              .readFile(path.join(projectPath, EXCALIDRAWS_DIR, name))
              .then((value): Excalidraw & { id: string } => ({
                ...JSON.parse(new TextDecoder().decode(value)),
                id: path.basename(name, ".json"),
              }))
          )
        ).then((excalidrawsData) =>
          excalidrawsData.reduce<{ [id: string]: Excalidraw }>((aggr, data) => {
            aggr[data.id] = {
              elements: data.elements,
              appState: data.appState,
            };

            // Weird they do not use a serializable value here
            aggr[data.id].appState.collaborators = new Map();

            return aggr;
          }, {})
        );
      }

      function getProjectData(chapters: string[], excalidraws: string[]) {
        return Promise.all([
          getChapters(chapters),
          getExcalidraws(excalidraws),
          getCommitSha(),
          getChanges(repoUrl),
        ]);
      }

      return readDirectories()
        .then(([chapters, excalidraws]) =>
          getProjectData(chapters, excalidraws)
        )
        .then(([chaptersData, excalidrawsData, commitSha, changes]) => {
          chapters = chaptersData;
          excalidraws = excalidrawsData;

          projectSubscription.emit({
            type: "PROJECT:LOAD_SUCCESS",
            chapters,
            excalidraws,
            commitSha,
            changes,
          });
        })
        .catch((error) => {
          projectSubscription.emit({
            type: "PROJECT:LOAD_ERROR",
            error: error.message,
          });
        });
    });
  }

  return {
    subscription: projectSubscription,
    load(repoUrl, branch) {
      imports
        .then(({ git, fs, http }) => {
          const projectPath = getProjectPath(repoUrl);

          fs.promises.lstat(projectPath).catch(() =>
            git.clone({
              fs,
              http,
              dir: projectPath,
              url: repoUrl,
              corsProxy: "https://cors.isomorphic-git.org",
              ref: branch,
              singleBranch: true,
            })
          );
        })
        .then(() => loadProject(repoUrl, branch));
    },
    updateChapter(repoUrl, chapterIndex, content) {
      // We just mutate without firing an event, to avoid
      // unnecessary reconciliation. It is the same object
      // used in the Project feature
      chapters[chapterIndex].content = content;
      chapters[chapterIndex].toc = MarkdownContents(content).tree();

      imports
        .then(({ fs }) => {
          const projectPath = getProjectPath(repoUrl);

          return fs.promises.writeFile(
            path.join(projectPath, CHAPTERS_DIR, `chapter_${chapterIndex}.md`),
            new TextEncoder().encode(content)
          );
        })
        .then(() => emitChangesDebounced(repoUrl));
    },
    updateExcalidraw(repoUrl, id, excalidraw) {
      // We just mutate without firing an event, to avoid
      // unnecessary reconciliation. It is the same object
      // used in the Project feature
      excalidraws[id] = excalidraw;

      imports
        .then(({ fs }) => {
          const projectPath = getProjectPath(repoUrl);
          return fs.promises.writeFile(
            path.join(projectPath, EXCALIDRAWS_DIR, `${id}.json`),
            new TextEncoder().encode(JSON.stringify(excalidraw))
          );
        })
        .then(() => emitChangesDebounced(repoUrl));
    },
    addChapter(repoUrl, index) {
      chapters = [
        ...chapters.slice(0, index),
        { content: "", toc: [] },
        ...chapters.slice(index + 1),
      ];

      this.subscription.emit({
        type: "PROJECT:CHAPTERS_UPDATE",
        chapters,
      });

      imports.then(({ fs }) => {
        const projectPath = getProjectPath(repoUrl);
        fs.promises.writeFile(
          path.join(projectPath, CHAPTERS_DIR, `chapter_${index}.md`),
          new TextEncoder().encode("")
        );
      });
    },
    loadSnippet(repoUrl, snippetPath) {
      if (snippets[snippetPath]) {
        this.subscription.emit({
          type: "PROJECT:LOAD_SNIPPET_SUCCESS",
          path: snippetPath,
          code: snippets[snippetPath],
        });
      } else {
        imports
          .then(({ fs }) => {
            const projectPath = getProjectPath(repoUrl);
            return fs.promises.readFile(path.join(projectPath, snippetPath));
          })
          .then((content) => {
            snippets[snippetPath] = new TextDecoder().decode(content);
            this.subscription.emit({
              type: "PROJECT:LOAD_SNIPPET_SUCCESS",
              path: snippetPath,
              code: snippets[snippetPath],
            });
          });
      }
    },
    loadSandbox(repoUrl, sandboxPath) {
      if (sandboxes[sandboxPath]) {
        this.subscription.emit({
          type: "PROJECT:LOAD_SANDBOX_SUCCESS",
          path: sandboxPath,
          sandbox: sandboxes[sandboxPath],
        });
      } else {
        const projectPath = getProjectPath(repoUrl);
        getFilesRecursively(path.join(projectPath, sandboxPath))
          .then((sandbox) => {
            sandboxes[sandboxPath] = sandbox;
            this.subscription.emit({
              type: "PROJECT:LOAD_SANDBOX_SUCCESS",
              path: sandboxPath,
              sandbox,
            });
          })
          .catch((error) => {
            console.log(error);
            this.subscription.emit({
              type: "PROJECT:LOAD_SANDBOX_ERROR",
              path: sandboxPath,
              error: error.message,
            });
          });
      }
    },
    save(repoUrl, accessToken) {
      const projectPath = getProjectPath(repoUrl);

      imports.then(({ git, fs, http }) =>
        getChanges(repoUrl)
          .then((changes) =>
            changes.reduce<{
              added: string[];
              modified: string[];
              deleted: string[];
            }>(
              (aggr, change) => {
                if (
                  change.status === "ADD_PARTIALLY_STAGED" ||
                  change.status === "ADD_UNSTAGED"
                ) {
                  aggr.added.push(change.path);
                } else if (
                  change.status === "MODIFIED_PARTIALLY_STAGED" ||
                  change.status === "MODIFIED_UNSTAGED"
                ) {
                  aggr.modified.push(change.path);
                } else if (change.status === "DELETED_UNSTAGED") {
                  aggr.deleted.push(change.path);
                }

                return aggr;
              },
              {
                added: [],
                modified: [],
                deleted: [],
              }
            )
          )
          .then((filesToStage) =>
            Promise.all([
              filesToStage.added.map((path) =>
                git.add({
                  fs,
                  dir: projectPath,
                  filepath: path,
                })
              ),
              filesToStage.modified.map((path) =>
                git.add({
                  fs,
                  dir: projectPath,
                  filepath: path,
                })
              ),
              filesToStage.deleted.map((path) =>
                git.remove({
                  fs,
                  dir: projectPath,
                  filepath: path,
                })
              ),
            ])
          )
          .then(() =>
            git.commit({
              fs,
              dir: projectPath,
              author: {
                name: "Christian Alfoni",
                email: "christianalfoni@gmail.com",
              },
              message: "Save",
            })
          )
          .then((commitSha) =>
            git
              .push({
                fs,
                dir: projectPath,
                http,
                onAuth: () => ({
                  username: accessToken,
                }),
              })
              .then(() => commitSha)
          )
          .then((commitSha) =>
            getChanges(repoUrl).then((changes) => {
              projectSubscription.emit({
                type: "PROJECT:SAVE_SUCCESS",
                commitSha,
                changes,
              });
            })
          )
          .catch((error) => {
            projectSubscription.emit({
              type: "PROJECT:SAVE_ERROR",
              error: error.message,
            });
          })
      );
    },
    checkVersion(repoUrl, branch) {
      imports
        .then(({ git, fs, http }) => {
          const projectPath = getProjectPath(repoUrl);
          return git.fetch({
            fs,
            http,
            dir: projectPath,
            url: repoUrl,
            corsProxy: "https://cors.isomorphic-git.org",
            ref: branch,
            depth: 1,
            singleBranch: true,
          });
        })
        .then((response) => {
          this.subscription.emit({
            type: "PROJECT:VERSION_CHECK_SUCCESS",
            commitSha: response.fetchHead,
          });
        });
    },
    getLatestVersion(repoUrl, branch) {
      imports
        .then(({ git, fs, http }) => {
          const projectPath = getProjectPath(repoUrl);
          return git.pull({
            fs,
            http,
            dir: projectPath,
            url: repoUrl,
            corsProxy: "https://cors.isomorphic-git.org",
            ref: branch,
            singleBranch: true,
            author: {
              name: "Christian Alfoni",
              email: "christianalfoni@gmail.com",
            },
          });
        })
        .then(() => loadProject(repoUrl, branch));
    },
  };
};
