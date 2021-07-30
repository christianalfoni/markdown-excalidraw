import Link from "next/link";
import Image from "next/image";
import { DocumentIcon } from "@heroicons/react/outline";
import SyntaxHighlighter from "react-syntax-highlighter";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Markdown, { MarkdownToJSX } from "markdown-to-jsx";
import { classNames } from "../common/utils";
import type { ExcalidrawAPIRefValue } from "@excalidraw/excalidraw/types/types";
import type Excalidraw from "@excalidraw/excalidraw";

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

type Page = {
  content: string;
};

type Excalidraws = { [id: string]: any };

const excalidrawsContext = createContext<any>({});
const ExcalidrawsProvider = ({
  excalidraws,
  children,
}: {
  excalidraws: Excalidraws;
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
    code: ({ className, children }) => {
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

      console.log(excalidraws, id);
      useEffect(() => {
        import("@excalidraw/excalidraw").then((comp) =>
          setExportToCanvas(() => comp.exportToCanvas)
        );
      }, []);

      if (exportToCanvas) {
        const canvas = exportToCanvas({
          elements: excalidraw.elements,
          appState: excalidraw.state,
        });
        return <img src={canvas.toDataURL()} />;
      }

      return null;
    },
  },
};

type Mode =
  | {
      type: "EDIT";
    }
  | {
      type: "READ";
    }
  | {
      type: "EXCALIDRAW";
      id: string;
    };

export default function Home() {
  const [pages, setPages] = useState<Page[]>([
    {
      content: "# Hello there",
    },
    {
      content: "",
    },
  ]);
  const [Comp, setComp] = useState<typeof Excalidraw | null>(null);

  const [currentPageIndex, setPageIndex] = useState(0);
  const [mode, setMode] = useState<Mode>({ type: "EDIT" });
  const editRef = useRef<HTMLTextAreaElement>(null);
  const excalidrawRef = useRef<ExcalidrawAPIRefValue>(null);
  const [caretPosition, setCaretPosition] = useState(0);
  const [excalidraws, setExcalidraws] = useState<Excalidraws>({});

  const currentPage = pages[currentPageIndex];

  useEffect(() => {
    import("@excalidraw/excalidraw").then((comp) => setComp(comp.default));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        if (mode.type === "EDIT") {
          setMode({ type: "READ" });
        } else if (mode.type === "READ") {
          setMode({ type: "EDIT" });
        }
      }

      if (event.metaKey && event.key === "e") {
        if (mode.type === "EXCALIDRAW") {
          setMode({ type: "EDIT" });
        } else {
          const id = insertExcalidraw(editRef.current?.value ?? "");
          if (id) {
            setMode({
              type: "EXCALIDRAW",
              id,
            });
          }
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mode, caretPosition]);

  useEffect(() => {
    if (mode.type === "EDIT" && editRef.current) {
      editRef.current.focus();
      editRef.current.selectionStart = caretPosition;
      editRef.current.selectionEnd = caretPosition;
    }
  }, [mode]);

  function update(content: string) {
    setPages((pages) => [
      ...pages.slice(0, currentPageIndex),
      { content },
      ...pages.slice(currentPageIndex + 1),
    ]);
  }

  function insertExcalidraw(content: string) {
    const firstLines = content.substr(0, caretPosition).split("\n");
    console.log(firstLines, caretPosition);
    const lastLines = content.substr(caretPosition).split("\n").slice(1);
    const line = firstLines.pop() || "";

    if (line.length === 0) {
      const id = String(Date.now());
      const inserted = `<Excalidraw id="${id}" />`;
      update([...firstLines, inserted, ...lastLines].join("\n"));

      setCaretPosition(caretPosition + inserted.length);

      return id;
    }
    const excalidrawRef = line.match(/<Excalidraw id="(.*)" \/>/);
    if (excalidrawRef) {
      return excalidrawRef[1];
    }
  }

  function updateCaretPosition() {
    setCaretPosition(editRef.current?.selectionStart ?? 0);
  }

  if (mode.type === "EXCALIDRAW") {
    return (
      <div className="h-screen">
        {Comp ? (
          <Comp
            ref={excalidrawRef}
            initialData={
              excalidraws[mode.id]
                ? {
                    elements: excalidraws[mode.id].elements,
                    appState: excalidraws[mode.id].state,
                  }
                : undefined
            }
            onChange={(elements, state) => {
              excalidraws[mode.id] = {
                elements,
                state,
              };
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <div className="h-full py-4 flex font-serif font-normal text-gray-800 mx-auto">
        <div className="space-y-1">
          {pages.map((page, index) => {
            const isCurrent = index === currentPageIndex;

            return (
              <Link href={String(index)} key={index}>
                <a
                  className={classNames(
                    isCurrent
                      ? "text-gray-300 bg-gray-50"
                      : "text-gray-200 hover:text-gray-300",
                    "group flex items-center px-2 py-2 text-base font-medium rounded-r-md"
                  )}
                  aria-current={isCurrent ? "page" : undefined}
                >
                  <DocumentIcon
                    className="mr-2 flex-shrink-0 h-6 w-6"
                    aria-hidden="true"
                  />
                  {index}
                </a>
              </Link>
            );
          })}
        </div>
        <div className="ml-6 mr-4 py-4 flex-1 flex">
          {mode.type === "EDIT" ? (
            <textarea
              ref={editRef}
              className="resize-none outline-none font-mono text-sm mx-auto"
              autoFocus
              cols={75}
              rows={30}
              value={currentPage.content}
              onKeyDown={updateCaretPosition}
              onFocus={updateCaretPosition}
              onClick={updateCaretPosition}
              onChange={(event) => {
                update(event.target.value);
              }}
            ></textarea>
          ) : (
            <div className="mx-auto" style={{ flex: "0 0 55ch" }}>
              <ExcalidrawsProvider excalidraws={excalidraws}>
                <Markdown options={options}>
                  {pages[currentPageIndex].content}
                </Markdown>
              </ExcalidrawsProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
