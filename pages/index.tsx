import Link from "next/link";
import Image from "next/image";
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
  TocContext,
  CaretPosition,
} from "../features/project";
import { DevtoolsProvider } from "react-states/devtools";
import { match } from "react-states";
import { useRouter } from "next/router";
import { Excalidraw } from "../environments/project";

const Editor = dynamic(() => import("../common/Editor"), { ssr: false });

const codeStyle = {
  hljs: {
    display: "block",
    overflowX: "auto",
    marginTop: "1em",
    marginBottom: "1em",
    padding: "1em",
    color: "rgb(107, 114, 128)",
    background: "rgb(31, 41, 55)",
    borderRadius: "12px",
  },
  "hljs-comment": {
    color: "#998",
    fontStyle: "italic",
  },
  "hljs-quote": {
    color: "#998",
    fontStyle: "italic",
  },
  "hljs-keyword": {
    color: "rgb(107, 114, 128)",
    fontWeight: "bold",
  },
  "hljs-selector-tag": {
    color: "rgb(107, 114, 128)",
    fontWeight: "bold",
  },
  "hljs-subst": {
    color: "rgb(107, 114, 128)",
    fontWeight: "normal",
  },
  "hljs-number": {
    color: "#008080",
  },
  "hljs-literal": {
    color: "#008080",
  },
  "hljs-variable": {
    color: "#008080",
  },
  "hljs-template-variable": {
    color: "#008080",
  },
  "hljs-tag .hljs-attr": {
    color: "#008080",
  },
  "hljs-string": {
    color: "#d14",
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
    color: "#000080",
    fontWeight: "normal",
  },
  "hljs-name": {
    color: "#000080",
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
    code({ className, children }) {
      const language = className.replace("lang-", "");

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
                    ? "text-gray-400"
                    : "text-gray-200 hover:text-gray-300",
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
  toc,
  onToggleToc,
  pages,
  pageIndex,
  onAddPage,
}: {
  children: React.ReactNode;
  toc: TocContext;
  onToggleToc: () => void;
  onAddPage: () => void;
  pages: Page[];
  pageIndex: number;
}) => (
  <div className="min-h-screen w-screen overflow-hidden">
    <div
      className={classNames(
        "p-4 absolute top-0 min-h-screen transition-all ease-in-out duration-500",
        match(toc, {
          VISIBLE: () => "left-0",
          HIDDEN: () => "-left-72",
        })
      )}
    >
      <TOC pages={pages} pageIndex={pageIndex} onAddPage={onAddPage} />
    </div>
    <div
      className={classNames(
        "absolute top-0 min-h-screen w-screen flex font-serif font-normal text-gray-50 mx-auto transition-all ease-in-out duration-300",
        match(toc, {
          VISIBLE: () => "left-72",
          HIDDEN: () => "left-0",
        })
      )}
    >
      <MenuAlt2Icon
        onClick={onToggleToc}
        className="w-6 h-6 text-gray-10 0 absolute top-4 left-4"
      />
      <DatabaseIcon className="w-6 h-6 text-gray-100 absolute top-4 right-4" />
      <div className="mx-auto flex items-center">{children}</div>
    </div>
  </div>
);

const App = () => {
  const [project, send] = useProject();
  const [Comp, setComp] = useState<typeof ExcalidrawComponent | null>(null);
  const excalidrawRef = useRef<ExcalidrawAPIRefValue>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((comp) => setComp(comp.default));
  }, []);

  return match(project, {
    LOADING_PROJECT: () => (
      <div className="w-screen h-screen flex items-center justify-center">
        Loading...
      </div>
    ),
    READY: ({ excalidraws, pages, pageIndex }) => {
      const currentPage = pages[pageIndex];
      const nextPage = pages[pageIndex + 1];

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
            toc={project.toc}
            pages={pages}
            pageIndex={pageIndex}
            onToggleToc={() => {
              send({
                type: "TOGGLE_TOC",
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
            toc={project.toc}
            pages={pages}
            pageIndex={pageIndex}
            onToggleToc={() => {
              send({
                type: "TOGGLE_TOC",
              });
            }}
            onAddPage={() => {
              send({
                type: "ADD_PAGE",
              });
            }}
          >
            <ExcalidrawsProvider excalidraws={excalidraws}>
              <div
                style={{ width: "55ch", height: "700px" }}
                className="bg-white rounded-md py-4 px-6 my-6"
              >
                <Markdown options={options}>{currentPage.content}</Markdown>
              </div>
              {nextPage ? (
                <div
                  style={{ width: "55ch", height: "700px" }}
                  className="bg-white rounded-md py-4 px-6 my-6"
                >
                  <Markdown options={options}>{nextPage.content}</Markdown>
                </div>
              ) : null}
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
  const children = (
    <ProjectFeature
      repoUrl="https://github.com/christianalfoni/test-book"
      page={router.query.page ? Number(router.query.page) : 0}
    >
      <App />
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
