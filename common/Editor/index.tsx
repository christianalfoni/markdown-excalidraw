import { useEffect, useReducer } from "react";
import {
  createReducer,
  useEnterEffect,
  useTransientEffect,
  WithTransientContext,
} from "react-states";

import { useCanvas } from "./useCanvas";

const LINE_HEIGHT = 30;
const PADDING = 10;
const LINE_LENGTH = 75;
const FONT_SIZE = 16;

type BaseContext = {
  lines: string[];
  line: number;
  char: number;
  lastPositioning: number;
};

type Context = BaseContext & {
  state: "IDLE";
};

type TransientContext =
  | {
      state: "INSERTING";
      key: string;
      line: number;
      lines: string[];
      char: number;
    }
  | {
      state: "REMOVING";
      line: number;
      lines: string[];
      char: number;
    }
  | {
      state: "CHANGING_POSITION";
      lines: string[];
      prevLines: string[];
      prevLine: number;
      line: number;
      char: number;
    };

type Event =
  | {
      type: "CHAR_INSERT";
      key: string;
    }
  | {
      type: "CHAR_REMOVE";
    }
  | {
      type: "NEW_LINE";
    }
  | {
      type: "PREV_LINE";
    }
  | {
      type: "NEXT_LINE";
    }
  | {
      type: "PREV_CHAR";
    }
  | {
      type: "NEXT_CHAR";
    }
  | {
      type: "PREV_WORD";
    }
  | {
      type: "NEXT_WORD";
    }
  | {
      type: "PREV_PARAGRAPH";
    }
  | {
      type: "NEXT_PARAGRAPH";
    };

const reducer = createReducer<
  WithTransientContext<TransientContext, Context>,
  Event
>(
  {
    IDLE: {
      CHAR_INSERT: ({ key }, { lines, line, char }) => {
        if (lines[line].length === LINE_LENGTH) {
          const currentWords = lines[line].split(" ");
          const lastWord = currentWords.pop() || "";

          return {
            state: "CHANGING_POSITION",
            char: lastWord.length + 1,
            line: line + 1,
            prevLine: line,
            prevLines: lines,
            lines: [
              ...lines.slice(0, line),
              currentWords.join(" "),
              lastWord + key,
              ...lines.slice(line + 1),
            ],
          };
        }

        return {
          state: "INSERTING",
          key,
          line,
          lines: [
            ...lines.slice(0, line),
            lines[line].slice(0, char) + key + lines[line].slice(char),
            ...lines.slice(line + 1),
          ],
          char: char + 1,
        };
      },
      CHAR_REMOVE: (_, context) => {
        const { lines, line, char } = context;

        if (char === 0 && line === 0) {
          return context;
        }

        if (char === 0) {
          return {
            state: "CHANGING_POSITION",
            prevLine: line,
            line: line - 1,
            prevLines: lines,
            lines: [...lines.slice(0, line), ...lines.slice(line + 1)],
            char: lines[line - 1].length,
          };
        }

        return {
          state: "REMOVING",
          line,
          lines: [
            ...lines.slice(0, line),
            lines[line].slice(0, char - 1) + lines[line].slice(char),
            ...lines.slice(line + 1),
          ],
          char: char - 1,
        };
      },
      NEW_LINE: (_, { line, lines }) => ({
        state: "CHANGING_POSITION",
        prevLines: lines,
        lines: [...lines.slice(0, line + 1), "", ...lines.slice(line + 1)],
        prevLine: line,
        line: line + 1,
        char: 0,
      }),
      NEXT_LINE: (_, context) =>
        context.line + 1 >= context.lines.length
          ? context
          : {
              state: "CHANGING_POSITION",
              prevLine: context.line,
              prevLines: context.lines,
              lines: context.lines,
              line: context.line + 1,
              char: Math.min(
                context.lines[context.line + 1].length,
                context.char
              ),
            },
      PREV_LINE: (_, context) =>
        context.line - 1 < 0
          ? context
          : {
              state: "CHANGING_POSITION",
              prevLine: context.line,
              prevLines: context.lines,
              lines: context.lines,
              line: context.line - 1,
              char: Math.min(
                context.lines[context.line - 1].length,
                context.char
              ),
            },
      NEXT_CHAR: (_, context) => {
        const { char, lines, line } = context;
        if (char < lines[line].length) {
          return {
            state: "CHANGING_POSITION",
            lines,
            prevLines: lines,
            prevLine: line,
            line,
            char: char + 1,
          };
        } else if (line + 1 < lines.length) {
          return {
            state: "CHANGING_POSITION",
            lines,
            prevLines: lines,
            prevLine: line,
            line: line + 1,
            char: 0,
          };
        }

        return context;
      },
      PREV_CHAR: (_, context) => {
        const { char, lines, line } = context;
        if (char > 0) {
          return {
            state: "CHANGING_POSITION",
            lines,
            prevLines: lines,
            prevLine: line,
            line,
            char: char - 1,
          };
        } else if (line > 0) {
          return {
            state: "CHANGING_POSITION",
            lines,
            prevLines: lines,
            prevLine: line,
            line: line - 1,
            char: lines[line - 1].length,
          };
        }

        return context;
      },
      PREV_WORD: (_, { lines, char, line, lastPositioning }) => {
        if (Date.now() - lastPositioning < 150) {
          return {
            state: "CHANGING_POSITION",
            lines,
            prevLines: lines,
            prevLine: line,
            line,
            char: 0,
          };
        }

        let newChar = char - 2;

        for (newChar; newChar > 0; newChar--) {
          if (lines[line][newChar + 1] === " ") {
            newChar++;
            break;
          }
        }

        return {
          state: "CHANGING_POSITION",
          lines,
          prevLines: lines,
          prevLine: line,
          line,
          char: Math.max(newChar, 0),
        };
      },
      NEXT_WORD: (_, { char, lines, line, lastPositioning }) => {
        if (Date.now() - lastPositioning < 150) {
          return {
            state: "CHANGING_POSITION",
            lines,
            prevLines: lines,
            prevLine: line,
            line,
            char: lines[line].length,
          };
        }

        let newChar = char + 1;

        for (newChar; newChar < lines[line].length; newChar++) {
          if (lines[line][newChar] === " ") {
            break;
          }
        }

        return {
          state: "CHANGING_POSITION",
          lines,
          prevLines: lines,
          prevLine: line,
          line,
          char: Math.min(newChar, lines[line].length),
        };
      },
      NEXT_PARAGRAPH: (_, { line, lines, lastPositioning }) => {
        if (Date.now() - lastPositioning < 150) {
          return {
            state: "CHANGING_POSITION",
            lines,
            prevLines: lines,
            prevLine: line,
            line: lines.length - 1,
            char: 0,
          };
        }

        let newLine = line + 1;

        for (newLine; newLine < lines.length; newLine++) {
          if (lines[newLine] === "") {
            newLine++;
            break;
          }
        }

        newLine = Math.min(newLine, lines.length - 1);

        return {
          state: "CHANGING_POSITION",
          lines,
          prevLines: lines,
          prevLine: line,
          line: newLine,
          char: 0,
        };
      },
      PREV_PARAGRAPH: (_, { lines, line, lastPositioning }) => {
        if (Date.now() - lastPositioning < 150) {
          return {
            state: "CHANGING_POSITION",
            lines,
            prevLines: lines,
            prevLine: line,
            line: 0,
            char: 0,
          };
        }

        let newLine = line - 1;

        for (newLine; newLine > 0; newLine--) {
          if (lines[newLine - 1] === "") {
            break;
          }
        }

        newLine = Math.max(newLine, 0);

        return {
          state: "CHANGING_POSITION",
          lines,
          prevLines: lines,
          prevLine: line,
          line: newLine,
          char: 0,
        };
      },
    },
  },
  {
    INSERTING: ({ lines, char }, context) => ({
      ...context,
      lines,
      char,
    }),
    REMOVING: ({ lines, char }, context) => ({
      ...context,
      lines,
      char,
    }),
    CHANGING_POSITION: ({ lines, char, line }, context) => ({
      ...context,
      lines,
      char,
      line,
      lastPositioning: Date.now(),
    }),
  }
);

export default function Editor({
  value = "",
  caret = {
    line: 0,
    char: 0,
  },
  height = 500,
  onChange,
  onCaretChange,
}: {
  height: number;
  value: string;
  caret: {
    line: number;
    char: number;
  };
  onChange: (value: string) => void;
  onCaretChange: (position: { line: number; char: number }) => void;
}) {
  const width = LINE_LENGTH * FONT_SIZE;
  const [canvas, ctx] = useCanvas(width, height);
  const [context, send] = useReducer(reducer, {
    state: "IDLE",
    lines: value.split("\n"),
    line: caret.line,
    char: caret.char,
    lastPositioning: Date.now(),
  });

  function drawLine(line: number, text: string) {
    ctx.clearRect(PADDING, line * LINE_HEIGHT, width, LINE_HEIGHT);
    ctx.fillText(text, PADDING, (line + 1) * LINE_HEIGHT);
  }

  function drawLines(lines: string[], currentLine: number) {
    ctx.clearRect(PADDING, currentLine * LINE_HEIGHT, width, height);

    for (let line = currentLine; line < lines.length; line++) {
      const text = lines[line];
      ctx.fillText(text, PADDING, (line + 1) * LINE_HEIGHT);
    }
  }

  function drawCaret(line: number, char: number, text: string) {
    ctx.fillRect(
      PADDING + ctx.measureText(text.slice(0, char)).width,
      line * LINE_HEIGHT + LINE_HEIGHT / 2,
      1,
      LINE_HEIGHT / 2
    );
  }

  useEffect(() => {
    if (ctx) {
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.fillStyle = "#EAEAEA";
      ctx.textBaseline = "bottom";

      drawLines(context.lines, 0);
      drawCaret(caret.line, caret.char, context.lines[caret.line]);
    }
  }, [ctx]);

  useEnterEffect(context, "IDLE", () => {
    const keydown = (event: KeyboardEvent) => {
      const key = event.code === "Equal" ? "`" : event.key;

      if (!event.metaKey && key.length === 1) {
        event.preventDefault();
        send({
          type: "CHAR_INSERT",
          key: key,
        });
      } else if (key === "Backspace") {
        event.preventDefault();
        send({
          type: "CHAR_REMOVE",
        });
      } else if (key === "Enter") {
        event.preventDefault();
        send({
          type: "NEW_LINE",
        });
      } else if (key === "ArrowUp") {
        event.preventDefault();
        send({
          type: event.metaKey ? "PREV_PARAGRAPH" : "PREV_LINE",
        });
      } else if (key === "ArrowDown") {
        event.preventDefault();
        send({
          type: event.metaKey ? "NEXT_PARAGRAPH" : "NEXT_LINE",
        });
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        send({
          type: event.metaKey ? "PREV_WORD" : "PREV_CHAR",
        });
      } else if (key === "ArrowRight") {
        event.preventDefault();
        send({
          type: event.metaKey ? "NEXT_WORD" : "NEXT_CHAR",
        });
      }
    };

    document.addEventListener("keydown", keydown);

    return () => {
      document.removeEventListener("keydown", keydown);
    };
  });

  useTransientEffect(context, "INSERTING", ({ line, lines, char }) => {
    drawLine(line, lines[line]);
    drawCaret(line, char, lines[line]);
    onCaretChange({ line, char });
    onChange(lines.join("\n"));
  });

  useTransientEffect(context, "REMOVING", ({ line, lines, char }) => {
    drawLine(line, lines[line]);
    drawCaret(line, char, lines[line]);
    onCaretChange({ line, char });
    onChange(lines.join("\n"));
  });

  useTransientEffect(
    context,
    "CHANGING_POSITION",
    ({ lines, prevLines, prevLine, line, char }) => {
      drawLines(lines, Math.min(prevLine, line));
      drawCaret(line, char, lines[line]);
      onCaretChange({ line, char });

      if (lines !== prevLines) {
        onChange(lines.join("\n"));
      }
    }
  );

  return canvas;
}
