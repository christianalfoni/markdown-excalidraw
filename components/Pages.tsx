import Markdown, { MarkdownToJSX } from "markdown-to-jsx";
import Image from "next/image";
import * as pathUtil from "path";
import React, { useContext, useEffect, useMemo, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { Excalidraw, Chapter } from "../features/writeBook";
import { useSnippets } from "../features/snippets";
import { usePageState } from "../utils/usePageState";
import { excalidrawsContext } from "./ExcalidrawsProvider";
import { Sandpack } from "@codesandbox/sandpack-react";
import { useEnvironment } from "../environments";
import { useSandboxes } from "../features/sandboxes";

const codeStyle = {
  hljs: {
    display: "block",
    overflowX: "auto",
    marginTop: "1em",
    marginBottom: "1em",
    padding: "1rem",
    color: "#F3F4F6",
    background: "#374151",
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
    color: "#60A5FA",
  },
  "hljs-selector-tag": {
    color: "#F87171",
    fontWeight: "bold",
  },
  "hljs-subst": {
    color: "#F87171",
    fontWeight: "normal",
  },
  "hljs-number": {
    color: "#60A5FA",
  },
  "hljs-literal": {
    color: "#FBBF24",
  },
  "hljs-variable": {
    color: "#374151",
  },
  "hljs-template-variable": {
    color: "#374151",
  },
  "hljs-tag .hljs-attr": {
    color: "#F87171",
  },
  "hljs-string": {
    color: "#FBBF24",
  },
  "hljs-doctag": {
    color: "#d14",
  },
  "hljs-title": {
    color: "#34D399",
  },
  "hljs-section": {
    color: "#34D399",
  },
  "hljs-selector-id": {
    color: "#900",
  },
  "hljs-type": {
    color: "#34D399",
  },
  "hljs-class .hljs-title": {
    color: "#34D399",
  },
  "hljs-tag": {
    color: "#F87171",
    fontWeight: "normal",
  },
  "hljs-name": {
    color: "#F87171",
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

const options: MarkdownToJSX.Options = {
  overrides: {
    h1({ children }) {
      return (
        <h1 className="text-3xl font-medium text-gray-700 px-6 my-4">
          {children}
        </h1>
      );
    },
    h2({ children }) {
      return (
        <h2 className="text-2xl font-medium text-gray-700 px-6 my-3">
          {children}
        </h2>
      );
    },
    h3({ children }) {
      return (
        <h2 className="text-xl font-medium text-gray-700 px-6 my-2">
          {children}
        </h2>
      );
    },
    p({ children }) {
      return <p className="px-6 my-4 text-gray-600">{children}</p>;
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
    code({ children, className }) {
      const language = className.replace("lang-", "");

      return (
        <SyntaxHighlighter language={language} style={codeStyle}>
          {children}
        </SyntaxHighlighter>
      );
    },
    Excalidraw({ id }) {
      const { excalidraw } = useEnvironment();
      const excalidraws = useContext(excalidrawsContext);
      const excalidrawData = excalidraws[id];

      const canvas = excalidraw.exportToCanvas(excalidrawData.elements, {
        ...excalidrawData.appState,
        viewBackgroundColor: "transparent",
      });
      return (
        <div className="w-full flex justify-center">
          <Image
            src={canvas.toDataURL()}
            width={canvas.width}
            height={canvas.height}
          />
        </div>
      );
    },
    Sandbox({ path }) {
      const [context, send] = useSandboxes();
      const sandbox = context.sandboxes[path];

      useEffect(() => {
        send({
          type: "LOAD_SANDBOX",
          path,
        });
      }, []);

      if (!sandbox) {
        return null;
      }

      return (
        <Sandpack
          files={sandbox}
          options={{
            wrapContent: true,
            editorHeight: 325,
          }}
          theme="codesandbox-light"
        />
      );
    },
  },
};

const excalidrawMatch = /<Excalidraw id="(.*)" \/>/;

function getSplitPages(
  content: string,
  excalidraws: Record<string, Excalidraw>,
  exportToCanvas: Function
) {
  const pages: string[] = [];
  const lines = content.split("\n");
  let currentHeight = 0;
  let currentPage = "";

  var c = document.createElement("canvas") as HTMLCanvasElement;
  var ctx = c.getContext("2d")!;
  ctx.font = "16px Inter";

  for (let line = 0; line < lines.length; line++) {
    let text = lines[line];

    const excalidrawRef = text.match(excalidrawMatch);

    if (excalidrawRef) {
      const id = excalidrawRef[1];
      const excalidraw = excalidraws[id];

      const canvas = exportToCanvas(excalidraw.elements, {
        ...excalidraw.appState,
        viewBackgroundColor: "transparent",
      });

      currentHeight += canvas.height;
      currentPage += text + "\n";
      continue;
    }

    if (text.startsWith("<Sandbox")) {
      if (currentPage) {
        pages.push(currentPage);
      }
      pages.push(text);
      currentHeight = 0;
      currentPage = "";
      continue;
    }

    if (text.startsWith("# ")) {
      currentHeight += 36;
    } else if (text.startsWith("## ")) {
      currentHeight += 32;
    } else if (text.startsWith("### ")) {
      currentHeight += 28;
    } else if (text.startsWith("```")) {
      text += "\n";
      currentHeight += 60; // margin + padding
      for (let codeLine = line + 1; codeLine < lines.length; codeLine++) {
        line++;
        text += lines[codeLine] + "\n";
        currentHeight += 21;
        if (lines[codeLine] === "```") {
          break;
        }
      }
    } else {
      const width = Math.ceil(ctx.measureText(text).width);
      const textLines = Math.max(1, Math.ceil(width / 500));
      const height = textLines * 24;

      currentHeight += height;
    }

    if (currentHeight >= 700) {
      pages.push(currentPage);
      currentHeight = 0;
      currentPage = text + "\n";
      continue;
    }

    currentPage += text + "\n";
  }

  pages.push(currentPage);

  return pages;
}

function getInitialPage(pages: string[], currentLine: number) {
  let page = 0;
  let line = 0;

  var c = document.createElement("canvas") as HTMLCanvasElement;
  var ctx = c.getContext("2d")!;
  ctx.font = "16px Inter";

  for (page; page < pages.length; page++) {
    const pageLines = pages[page].split("\n");

    for (line; line < pageLines.length; line++) {
      const width = Math.ceil(ctx.measureText(pageLines[line]).width);

      if (line + Math.ceil(width / 500) - 1 >= currentLine) {
        return page;
      }
    }
  }

  return page;
}

export const Pages = ({
  currentLine,
  chapter,
  chapters,
  excalidraws,
}: {
  currentLine: number;
  chapter: number;
  chapters: Chapter[];
  excalidraws: Record<string, Excalidraw>;
}) => {
  const { excalidraw } = useEnvironment();
  const pages = getSplitPages(
    chapters[chapter].content,
    excalidraws,
    excalidraw.exportToCanvas
  );
  const initialPage = useMemo(
    () => getInitialPage(pages, currentLine),
    [currentLine]
  );

  const { index, flip, next, prev } = usePageState(initialPage);

  return (
    <div className="cover">
      <div className="book">
        <div
          className={`${
            index === 0 ? "bg-gray-600" : "bg-gray-50"
          } book__page book__page--1  rounded-md border-gray-700 border`}
        >
          {index === 0 ? (
            <div className="flex w-full h-full items-center justify-center text-4xl text-gray-50">
              Chapter {index + 1}
            </div>
          ) : (
            <Markdown options={options}>{pages[index - 1] ?? ""}</Markdown>
          )}
          {index === 0 ? null : (
            <span
              className="absolute bottom-0 left-0 text-xs text-gray-500 p-4 cursor-pointer"
              onClick={() => {
                if (index > 0) {
                  prev();
                }
              }}
            >
              Page {index}
            </span>
          )}
        </div>

        <div className="book__page book__page--4 bg-gray-50 rounded-md  border-gray-700 border">
          <Markdown options={options}>{pages[index + 2] ?? ""}</Markdown>
          <span className="absolute bottom-0 right-0 p-4 text-xs text-gray-500 cursor-pointer">
            Page {index + 3}
          </span>
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
            className={
              "book__page-front bg-gray-50 rounded-md border-gray-700 border"
            }
          >
            <Markdown options={options}>{pages[index] ?? ""}</Markdown>
            <span
              className="absolute bottom-0 right-0 text-xs text-gray-500 p-4 cursor-pointer"
              onClick={() => {
                if (index < pages.length - 1) {
                  next();
                }
              }}
            >
              Page {index + 1}
            </span>
          </div>
          <div className="book__page-back bg-gray-50 rounded-md border-gray-700 border">
            <Markdown options={options}>{pages[index + 1] ?? ""}</Markdown>
            <span className="absolute bottom-0 left-0 p-4 cursor-pointer text-xs text-gray-500">
              Page {index + 2}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
