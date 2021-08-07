import Link from "next/link";
import Image from "next/image";
import * as pathUtil from "path";
import {
  DatabaseIcon,
  DocumentAddIcon,
  DocumentIcon,
  MenuAlt2Icon,
} from "@heroicons/react/outline";
import SyntaxHighlighter from "react-syntax-highlighter";
import dynamic from "next/dynamic";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Markdown, { MarkdownToJSX } from "markdown-to-jsx";
import { classNames } from "../common/utils";
import type { ExcalidrawAPIRefValue } from "@excalidraw/excalidraw/types/types";
import type ExcalidrawComponent from "@excalidraw/excalidraw";
import {
  ProjectFeature,
  useProject,
  Page,
  MenuContext,
  CaretPosition,
} from "../features/project";
import { DevtoolsProvider } from "react-states/devtools";
import { match } from "react-states";
import { useRouter } from "next/router";
import { Excalidraw, GitChange, GitStatus } from "../environments/project";
import { SnippetsFeature, useSnippets } from "../features/snippets";
import { usePageState } from "../common/usePageState";

const Editor = dynamic(() => import("../common/Editor"), { ssr: false });

const codeStyle = {
  hljs: {
    display: "block",
    overflowX: "auto",
    marginTop: "1em",
    marginBottom: "1em",
    color: "#374151",
    background: "transparent",
    fontSize: "14px",
  },
  "hljs-comment": {
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  "hljs-quote": {
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  "hljs-keyword": {
    color: "#3B82F6",
    fontWeight: "bold",
  },
  "hljs-selector-tag": {
    color: "#EF4444",
    fontWeight: "bold",
  },
  "hljs-subst": {
    color: "#EF4444",
    fontWeight: "normal",
  },
  "hljs-number": {
    color: "#3B82F6",
  },
  "hljs-literal": {
    color: "#F59E0B",
  },
  "hljs-variable": {
    color: "#374151",
  },
  "hljs-template-variable": {
    color: "#374151",
  },
  "hljs-tag .hljs-attr": {
    color: "#EF4444",
  },
  "hljs-string": {
    color: "#F59E0B",
  },
  "hljs-doctag": {
    color: "#d14",
  },
  "hljs-title": {
    color: "#900",
    fontWeight: "bold",
  },
  "hljs-section": {
    color: "#900",
    fontWeight: "bold",
  },
  "hljs-selector-id": {
    color: "#900",
    fontWeight: "bold",
  },
  "hljs-type": {
    color: "#458",
    fontWeight: "bold",
  },
  "hljs-class .hljs-title": {
    color: "#458",
    fontWeight: "bold",
  },
  "hljs-tag": {
    color: "#EF4444",
    fontWeight: "normal",
  },
  "hljs-name": {
    color: "#EF4444",
    fontWeight: "normal",
  },
  "hljs-attribute": {
    color: "#000080",
    fontWeight: "normal",
  },
  "hljs-regexp": {
    color: "#009926",
  },
  "hljs-link": {
    color: "#009926",
  },
  "hljs-symbol": {
    color: "#990073",
  },
  "hljs-bullet": {
    color: "#990073",
  },
  "hljs-built_in": {
    color: "#0086b3",
  },
  "hljs-builtin-name": {
    color: "#0086b3",
  },
  "hljs-meta": {
    color: "#999",
    fontWeight: "bold",
  },
  "hljs-deletion": {
    background: "#fdd",
  },
  "hljs-addition": {
    background: "#dfd",
  },
  "hljs-emphasis": {
    fontStyle: "italic",
  },
  "hljs-strong": {
    fontWeight: "bold",
  },
};

const excalidrawsContext = createContext<any>({});
const ExcalidrawsProvider = ({
  excalidraws,
  children,
}: {
  excalidraws: {
    [id: string]: Excalidraw;
  };
  children: React.ReactNode;
}) => {
  return (
    <excalidrawsContext.Provider value={excalidraws}>
      {children}
    </excalidrawsContext.Provider>
  );
};

const options: MarkdownToJSX.Options = {
  overrides: {
    h1({ children }) {
      return <h1 className="text-3xl font-medium text-gray-700">{children}</h1>;
    },
    p({ children }) {
      return <p className="my-4 text-gray-600">{children}</p>;
    },
    ul({ children }) {
      return <ul className="list-disc ml-8">{children}</ul>;
    },
    Snippet({ path, from, to }) {
      const [context, send] = useSnippets();
      const language = {
        ".tsx": "typescript",
      }[pathUtil.extname(path)];
      const code = context.snippets[path]
        ? context.snippets[path].split("\n").slice(from - 1, to)
        : Array(to - from).fill("");

      useEffect(() => {
        send({
          type: "LOAD_SNIPPET",
          path,
        });
      }, []);

      return (
        <SyntaxHighlighter
          language={language}
          style={codeStyle}
          showLineNumbers
          startingLineNumber={Number(from)}
          lineNumberStyle={{
            width: "40px",
            minWidth: "auto",
          }}
        >
          {code.join("\n")}
        </SyntaxHighlighter>
      );
    },
    Code({ children, language }) {
      return (
        <SyntaxHighlighter language={language} style={codeStyle}>
          {children}
        </SyntaxHighlighter>
      );
    },
    Excalidraw({ id }) {
      const excalidraws = useContext(excalidrawsContext);
      const excalidraw = excalidraws[id];
      const [exportToCanvas, setExportToCanvas] = useState<Function | null>(
        null
      );

      useEffect(() => {
        import("@excalidraw/excalidraw").then((comp) =>
          setExportToCanvas(() => comp.exportToCanvas)
        );
      }, []);

      if (exportToCanvas) {
        const canvas = exportToCanvas({
          elements: excalidraw.elements,
          appState: excalidraw.appState,
        });
        return (
          <Image
            src={canvas.toDataURL()}
            width={canvas.width}
            height={canvas.height}
          />
        );
      }

      return null;
    },
  },
};

const EditPage = ({
  initialContent,
  caretPosition,
  updateCaretPosition,
  onChange,
}: {
  caretPosition: CaretPosition;
  updateCaretPosition: (position: CaretPosition) => void;
  initialContent: string;
  onChange: (content: string) => void;
}) => {
  const [value, setValue] = useState(initialContent);

  function update(content: string) {
    setValue(content);
    onChange(content);
  }

  return (
    <div
      className="py-6 h-full outline-none font-mono text-md flex mx-auto items-center  bg-transparent overflow-hidden"
      style={{ width: "800px" }}
    >
      <Editor
        value={value}
        height={700}
        caret={caretPosition}
        onChange={update}
        onCaretChange={updateCaretPosition}
      />
    </div>
  );
};

const renderGitStatusLabel = (status: GitStatus) => {
  switch (status) {
    case "ADD_UNSTAGED":
    case "ADD_PARTIALLY_STAGED":
    case "ADD_STAGED": {
      return (
        <span className="p-1 rounded bg-green-500 text-green-50 text-xs mr-1">
          add
        </span>
      );
    }
    case "MODIFIED_UNSTAGED":
    case "MODIFIED_STAGED":
    case "MODIFIED_PARTIALLY_STAGED": {
      return (
        <span className="p-1 rounded bg-yellow-500 text-yellow-50 text-xs mr-1">
          modify
        </span>
      );
    }
    case "DELETED_UNSTAGED":
    case "DELETED_STAGED": {
      return (
        <span className="p-1 rounded bg-red-500 text-red-50 text-xs mr-1">
          delete
        </span>
      );
    }
  }
};

const TOC = ({
  pages,
  pageIndex,
  onAddPage,
}: {
  pages: Page[];
  pageIndex: number;
  onAddPage: () => void;
}) => {
  return (
    <>
      {pages.map((page, index) => {
        const isCurrent = index === pageIndex;
        const header = page.toc.find((el) => el.level === 1);

        return (
          <React.Fragment key={index}>
            <Link href={`/?page=${index}`}>
              <a
                className={classNames(
                  isCurrent
                    ? "text-gray-200"
                    : "text-gray-400 hover:text-gray-300",
                  "group flex items-center px-2 py-2 text-base font-medium rounded-r-md"
                )}
                aria-current={isCurrent ? "page" : undefined}
              >
                <DocumentIcon
                  className="mr-2 flex-shrink-0 h-6 w-6"
                  aria-hidden="true"
                />
                {header ? header.name : `Page ${index + 1}`}
              </a>
            </Link>
            {isCurrent ? (
              <button
                onClick={onAddPage}
                className="text-gray-200 hover:text-gray-300 group flex items-center px-2 py-2 text-base font-medium rounded-r-md"
              >
                <DocumentAddIcon
                  className="mr-2 flex-shrink-0 h-6 w-6"
                  aria-hidden="true"
                />
                Add page
              </button>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
};

const ProjectWrapper = ({
  children,
  menu,
  onToggleToc,
  onToggleGit,
  pages,
  pageIndex,
  onAddPage,
  changes,
}: {
  children: React.ReactNode;
  menu: MenuContext;
  onToggleToc: () => void;
  onToggleGit: () => void;
  onAddPage: () => void;
  pages: Page[];
  pageIndex: number;
  changes: GitChange[];
}) => (
  <div className="min-h-screen w-screen overflow-hidden">
    <div
      className={classNames(
        "p-4 absolute top-0 min-h-screen transition-all ease-in-out",
        match(menu, {
          TOC: () => "left-0 duration-500",
          IDLE: () => "-left-72 duration-300",
          GIT: () => "-left-72 duration-300",
        })
      )}
    >
      <TOC pages={pages} pageIndex={pageIndex} onAddPage={onAddPage} />
    </div>
    <div
      className={classNames(
        "absolute top-0 min-h-screen w-screen flex font-serif font-normal text-gray-600 mx-auto transition-all ease-in-out duration-300",
        match(menu, {
          TOC: () => "left-72",
          IDLE: () => "left-0",
          GIT: () => "-left-72",
        })
      )}
    >
      <MenuAlt2Icon
        onClick={onToggleToc}
        className="w-6 h-6 text-gray-100 0 absolute top-4 left-4"
      />
      <DatabaseIcon
        onClick={onToggleGit}
        className="w-6 h-6 text-gray-100 absolute top-4 right-4"
      />
      <div className="mx-auto flex items-center">{children}</div>
    </div>
    <div
      className={classNames(
        "p-4 absolute top-0 min-h-screen transition-all ease-in-out w-72",
        match(menu, {
          TOC: () => "-right-72 duration-300",
          IDLE: () => "-right-72 duration-300",
          GIT: () => "right-0 duration-500",
        })
      )}
    >
      <ul>
        {changes.map(({ path, status }) => (
          <li key={path} className="text-gray-500 mb-2 flex items-center">
            {renderGitStatusLabel(status)}
            {path}
          </li>
        ))}
      </ul>
      <button className="text-gray-300 w-full p-2 bg-gray-800 rounded mt-2">
        SAVE
      </button>
    </div>
  </div>
);

const App = () => {
  const [project, send] = useProject();
  const [Comp, setComp] = useState<typeof ExcalidrawComponent | null>(null);
  const excalidrawRef = useRef<ExcalidrawAPIRefValue>(null);
  const { index, flip, next, prev } = usePageState();

  useEffect(() => {
    import("@excalidraw/excalidraw").then((comp) => setComp(comp.default));
  }, []);

  return match(project, {
    LOADING_PROJECT: () => (
      <div className="w-screen h-screen flex items-center justify-center">
        Loading...
      </div>
    ),
    READY: ({ excalidraws, pages, pageIndex, changes }) => {
      const currentPage = pages[pageIndex];

      return match(project.mode, {
        DRAWING: ({ id }) => (
          <div className="h-screen">
            {Comp ? (
              <Comp
                ref={excalidrawRef}
                initialData={excalidraws[id] ? excalidraws[id] : undefined}
                onChange={(elements, appState) => {
                  if (
                    excalidraws[id] &&
                    excalidraws[id].elements === elements &&
                    excalidraws[id].appState === appState
                  ) {
                    return;
                  }

                  send({
                    type: "UPDATE_EXCALIDRAW",
                    id,
                    excalidraw: {
                      elements,
                      appState,
                    },
                  });
                }}
              />
            ) : null}
          </div>
        ),
        EDITING: () => (
          <ProjectWrapper
            menu={project.menu}
            pages={pages}
            pageIndex={pageIndex}
            changes={changes}
            onToggleToc={() => {
              send({
                type: "TOGGLE_TOC",
              });
            }}
            onToggleGit={() => {
              send({
                type: "TOGGLE_GIT",
              });
            }}
            onAddPage={() => {
              send({
                type: "ADD_PAGE",
              });
            }}
          >
            <EditPage
              key={pageIndex}
              initialContent={currentPage.content}
              caretPosition={project.caretPosition}
              updateCaretPosition={(position) => {
                send({
                  type: "CHANGE_CARET_POSITION",
                  position,
                });
              }}
              onChange={(content) => {
                send({
                  type: "UPDATE_PAGE",
                  content,
                });
              }}
            />
          </ProjectWrapper>
        ),
        READING: () => (
          <ProjectWrapper
            menu={project.menu}
            pages={pages}
            pageIndex={pageIndex}
            changes={changes}
            onToggleToc={() => {
              send({
                type: "TOGGLE_TOC",
              });
            }}
            onToggleGit={() => {
              send({
                type: "TOGGLE_GIT",
              });
            }}
            onAddPage={() => {
              send({
                type: "ADD_PAGE",
              });
            }}
          >
            <ExcalidrawsProvider excalidraws={excalidraws}>
              <div className="cover">
                <div className="book">
                  <div
                    className="book__page book__page--1 bg-gray-50 rounded-md py-4 px-6 border-gray-500 border"
                    onClick={() => {
                      prev();
                    }}
                  >
                    <Markdown options={options}>
                      {pages[index]?.content ?? ""}
                    </Markdown>
                  </div>

                  <div className="book__page book__page--4 bg-gray-50 rounded-md py-4 px-6 border-gray-500 border">
                    <Markdown options={options}>
                      {pages[index + 3]?.content ?? ""}
                    </Markdown>
                  </div>
                  <div
                    className={
                      "book__page book__page--2" +
                      {
                        0: "",
                        1: " transition-flip",
                        2: " flip",
                        3: " flip-2",
                      }[flip]
                    }
                  >
                    <div
                      className="book__page-front bg-gray-50 rounded-md py-4 px-6 border-gray-500 border"
                      onClick={() => {
                        next();
                      }}
                    >
                      <Markdown options={options}>
                        {pages[index + 1]?.content ?? ""}
                      </Markdown>
                    </div>
                    <div className="book__page-back bg-gray-50 rounded-md py-4 px-6 border-gray-500 border">
                      <Markdown options={options}>
                        {pages[index + 2]?.content ?? ""}
                      </Markdown>
                    </div>
                  </div>
                </div>
              </div>
              {/*
              <div
                style={{ width: "55ch", height: "700px" }}
                className="bg-gray-50 rounded-md py-4 px-6 my-6 border-gray-500 border"
              >
                
              </div>
              {nextPage ? (
                <div
                  style={{ width: "55ch", height: "700px" }}
                  className="bg-gray-50 rounded-md py-4 px-6 my-6 border-gray-500 border"
                >
                  <Markdown options={options}>{nextPage.content}</Markdown>
                </div>
              ) : null}
              */}
            </ExcalidrawsProvider>
          </ProjectWrapper>
        ),
      });
    },
  });
};

const Environment = process.browser
  ? dynamic(() => import("../environments/browser"), { ssr: false })
  : dynamic(() => import("../environments/next"));

export default function Home() {
  const router = useRouter();
  const repoUrl = "https://github.com/christianalfoni/test-book";
  const children = (
    <ProjectFeature
      repoUrl={repoUrl}
      page={router.query.page ? Number(router.query.page) : 0}
    >
      <SnippetsFeature repoUrl={repoUrl}>
        <App />
      </SnippetsFeature>
    </ProjectFeature>
  );

  return (
    <Environment>
      {process.env.NODE_ENV === "production" ? (
        children
      ) : (
        <DevtoolsProvider>{children}</DevtoolsProvider>
      )}
    </Environment>
  );
}
