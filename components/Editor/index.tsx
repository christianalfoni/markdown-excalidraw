import { useEffect, useState } from "react";
import {
  StateTransition,
  Transitions,
  useCommandEffect,
  useStateEffect,
  useStates,
} from "react-states";

import { useCanvas } from "./useCanvas";

const LINE_HEIGHT = 30;
const PADDING = 10;
const LINE_LENGTH = 75;
const FONT_SIZE = 16;
const DOUBLE_DEBOUNCE = 175;

export type Position = {
  char: number;
  line: number;
  absolute: number;
};

type State = {
  state: "IDLE";
  content: string;
  lines: string[];
  lineCount: number;
  drawFromLine: number;
  position: Position;
  lastPositioning: number;
};

type Command =
  | {
      cmd: "UPDATE";
      content: string;
      lines: string[];
      position: Position;
    }
  | {
      cmd: "CHANGE_POSITION";
      lines: string[];
      position: Position;
    };

type Action =
  | {
      type: "CHAR_INSERT";
      key: string;
    }
  | {
      type: "CHAR_REMOVE";
    }
  | {
      type: "WORD_REMOVE";
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

type Transition = StateTransition<State, Command>;

/*
const changePosition = (
  state: State,
  {
    line,
    lines,
    char,
  }: {
    lines: string[];
    line: number;
    char: number;
  }
): Transition => {
  return [
    {
      ...state,
      line,
      lines,
      char,
      lastPositioning: Date.now(),
    },
    {
      cmd: "CHANGE_POSITION",
      char,
      line,
      lines,
      prevLine: state.line,
      prevLines: state.lines,
    },
  ];
};
*/

function getLines(text: string) {
  return text
    .split("\n")
    .map((para) => {
      var words = para.split(" ");
      var lines = [];
      var currentLine = words[0];

      for (var i = 1; i < words.length; i++) {
        var word = words[i];
        var width = (currentLine + " " + word).length;
        if (width < LINE_LENGTH) {
          currentLine += " " + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    })
    .reduce((a, b) => a.concat(b), []);
}

function getPositionByAbsolute(lines: string[], absolute: number) {
  let char = absolute;

  for (let x = 0; x < lines.length; x++) {
    if (char <= lines[x].length) {
      return {
        line: x,
        char,
        absolute,
      };
    }
    char -= lines[x].length + 1;
  }

  return {
    line: 0,
    char,
    absolute,
  };
}

function getAbsolutePosition(
  lines: string[],
  { line, char }: { line: number; char: number }
) {
  let newChar = 0;

  for (let x = 0; x < lines.length; x++) {
    if (x === line) {
      return newChar + char;
    }

    newChar += lines[x].length + 1;
  }

  return newChar + char;
}

function getDrawLine(current: number, lineCount: number, line: number) {
  if (line === current + lineCount - 1) {
    return current + 1;
  }

  if (line === current && current > 0) {
    return current - 1;
  }

  if (line < current || line > lineCount) {
    return Math.max(0, line - 10);
  }

  return current;
}

const transitions: Transitions<State, Action, Command> = {
  IDLE: {
    CHAR_INSERT: (state, { key }): Transition => {
      const content =
        state.content.slice(0, state.position.absolute) +
        key +
        state.content.slice(state.position.absolute);
      const char = state.position.absolute + 1;
      const lines = getLines(content);
      const position = getPositionByAbsolute(lines, char);

      return [
        {
          ...state,
          content,
          lines,
          position,
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "UPDATE",
          content,
          position,
          lines,
        },
      ];
    },
    CHAR_REMOVE: (state): Transition => {
      const content =
        state.content.slice(0, state.position.absolute - 1) +
        state.content.slice(state.position.absolute);
      const char = state.position.absolute - 1;
      const lines = getLines(content);
      const position = getPositionByAbsolute(lines, char);

      return [
        {
          ...state,
          content,
          lines,
          position,
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "UPDATE",
          content,
          position,
          lines,
        },
      ];
    },
    WORD_REMOVE: (state) => {
      if (
        state.content[state.position.absolute] !== " " &&
        state.content[state.position.absolute] !== "\n"
      ) {
        return state;
      }

      const endChar = state.position.absolute;
      let char = endChar - 1;

      for (char; char > 0; char--) {
        if (state.content[char] === " " || state.content[char] === "\n") {
          break;
        }
      }

      const content =
        state.content.slice(0, char) + state.content.slice(endChar);
      const lines = getLines(content);
      const position = getPositionByAbsolute(lines, char);

      return [
        {
          ...state,
          content,
          position,
          char,
          lines,
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "UPDATE",
          content,
          position,
          lines,
        },
      ];
    },

    NEW_LINE: (state): Transition => {
      const content =
        state.content.slice(0, state.position.absolute) +
        "\n" +
        state.content.slice(state.position.absolute);
      const char = state.position.absolute + 1;
      const lines = getLines(content);
      const position = getPositionByAbsolute(lines, char);

      return [
        {
          ...state,
          content,
          lines,
          position,
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "UPDATE",
          content,
          position,
          lines,
        },
      ];
    },

    NEXT_LINE: (state): Transition => {
      const line = Math.min(state.position.line + 1, state.lines.length - 1);
      const char = getAbsolutePosition(state.lines, {
        char: Math.min(state.lines[line].length, state.position.char),
        line,
      });
      const position = getPositionByAbsolute(state.lines, char);

      return [
        {
          ...state,
          position,
          lastPositioning: Date.now(),
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "CHANGE_POSITION",
          lines: state.lines,
          position,
        },
      ];
    },
    PREV_LINE: (state): Transition => {
      const line = Math.max(state.position.line - 1, 0);
      const char = getAbsolutePosition(state.lines, {
        char: Math.min(state.lines[line].length, state.position.char),
        line,
      });
      const position = getPositionByAbsolute(state.lines, char);

      return [
        {
          ...state,
          position,
          lastPositioning: Date.now(),
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "CHANGE_POSITION",
          lines: state.lines,
          position,
        },
      ];
    },
    NEXT_CHAR: (state): Transition => {
      const char = state.position.absolute + 1;
      const position = getPositionByAbsolute(state.lines, char);

      return [
        {
          ...state,

          position,
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "CHANGE_POSITION",
          lines: state.lines,
          position,
        },
      ];
    },
    PREV_CHAR: (state): Transition => {
      const char = state.position.absolute - 1;
      const position = getPositionByAbsolute(state.lines, char);

      return [
        {
          ...state,

          position,
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "CHANGE_POSITION",
          lines: state.lines,
          position,
        },
      ];
    },

    PREV_WORD: (state): Transition => {
      let char: number;

      if (Date.now() - state.lastPositioning < DOUBLE_DEBOUNCE) {
        char = getAbsolutePosition(state.lines, {
          line: state.position.line,
          char: 0,
        });
      } else {
        char = state.position.absolute - 1;

        for (char; char > 0; char--) {
          if (state.content[char] === " " || state.content[char] === "\n") {
            break;
          }
        }
      }

      const position = getPositionByAbsolute(state.lines, char);

      return [
        {
          ...state,

          position,
          lastPositioning: Date.now(),
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "UPDATE",
          content: state.content,
          position,
          lines: state.lines,
        },
      ];
    },

    NEXT_WORD: (state): Transition => {
      let char: number;

      if (Date.now() - state.lastPositioning < DOUBLE_DEBOUNCE) {
        char = getAbsolutePosition(state.lines, {
          line: state.position.line,
          char: state.lines[state.position.line].length,
        });
      } else {
        char = state.position.absolute + 1;

        for (char; char < state.content.length; char++) {
          if (state.content[char] === " " || state.content[char] === "\n") {
            break;
          }
        }
      }

      const position = getPositionByAbsolute(state.lines, char);

      return [
        {
          ...state,

          position,
          lastPositioning: Date.now(),
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "UPDATE",
          content: state.content,
          position,
          lines: state.lines,
        },
      ];
    },

    NEXT_PARAGRAPH: (state): Transition => {
      let char: number;

      if (Date.now() - state.lastPositioning < DOUBLE_DEBOUNCE) {
        char = getAbsolutePosition(state.lines, {
          line: state.lines.length - 1,
          char: 0,
        });
      } else {
        char = state.position.absolute;

        for (char; char < state.content.length; char++) {
          if (
            state.content[char] === "\n" &&
            state.content[char + 1] !== "\n"
          ) {
            char += 1;
            break;
          }
        }
      }

      const position = getPositionByAbsolute(state.lines, char);

      return [
        {
          ...state,

          position,
          lastPositioning: Date.now(),
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "UPDATE",
          content: state.content,
          position,
          lines: state.lines,
        },
      ];
    },

    PREV_PARAGRAPH: (state): Transition => {
      let char: number;

      if (Date.now() - state.lastPositioning < DOUBLE_DEBOUNCE) {
        char = getAbsolutePosition(state.lines, {
          line: 0,
          char: 0,
        });
      } else {
        char = state.position.absolute - 1;

        let startChar;

        for (char; char > 0; char--) {
          if (state.content[char] === "\n" && !startChar) {
            startChar = char;
          } else if (
            state.content[char] === "\n" &&
            state.content[char + 1] !== "\n"
          ) {
            char += 1;
            break;
          }
        }
      }

      const position = getPositionByAbsolute(state.lines, char);

      return [
        {
          ...state,

          position,
          lastPositioning: Date.now(),
          drawFromLine: getDrawLine(
            state.drawFromLine,
            state.lineCount,
            position.line
          ),
        },
        {
          cmd: "UPDATE",
          content: state.content,
          position,
          lines: state.lines,
        },
      ];
    },
  },
};

export default function Editor({
  value = "",
  position = {
    line: 0,
    char: 0,
    absolute: 0,
  },
  height = 500,
  onChange,
  onCaretChange,
}: {
  height: number;
  value: string;
  position: Position;
  onChange: (value: string) => void;
  onCaretChange: (position: Position) => void;
}) {
  const width = LINE_LENGTH * FONT_SIZE;
  const [canvas, ctx] = useCanvas(width, height);
  const [{ char, lines }] = useState(() => {
    const lines = getLines(value);
    return {
      lines,
      char: getAbsolutePosition(lines, position),
    };
  });
  const lineCount = Math.floor(height / LINE_HEIGHT);
  const [state, dispatch] = useStates(transitions, {
    state: "IDLE",
    content: value,
    lines,
    position,
    lastPositioning: Date.now(),
    drawFromLine: getDrawLine(position.line, lineCount, position.line),
    lineCount,
  });

  function drawLines(lines: string[], position: Position) {
    ctx.clearRect(0, 0, width, height);

    for (let line = state.drawFromLine; line < lines.length; line++) {
      const text = lines[line];
      const drawLine = line - state.drawFromLine;
      ctx.fillText(text, PADDING, (drawLine + 1) * LINE_HEIGHT);
    }

    const text = lines[position.line] || "";

    ctx.fillRect(
      PADDING + ctx.measureText(text.slice(0, position.char)).width,
      (position.line - state.drawFromLine) * LINE_HEIGHT + LINE_HEIGHT / 2,
      1,
      LINE_HEIGHT / 2
    );
  }

  useEffect(() => {
    if (ctx) {
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.fillStyle = "#EAEAEA";
      ctx.textBaseline = "bottom";

      drawLines(
        state.lines,
        getPositionByAbsolute(state.lines, state.position.absolute)
      );
      // drawCaret(caret.line, caret.char, state.lines[caret.line]);
    }
  }, [ctx]);

  useStateEffect(state, "IDLE", () => {
    const keydown = (event: KeyboardEvent) => {
      const key = event.code === "Equal" ? "`" : event.key;

      if (!event.metaKey && key.length === 1) {
        event.preventDefault();
        dispatch({
          type: "CHAR_INSERT",
          key: key,
        });
      } else if (key === "Backspace") {
        event.preventDefault();
        dispatch({
          type: event.metaKey ? "WORD_REMOVE" : "CHAR_REMOVE",
        });
      } else if (key === "Enter") {
        event.preventDefault();
        dispatch({
          type: "NEW_LINE",
        });
      } else if (key === "ArrowUp") {
        event.preventDefault();
        dispatch({
          type: event.metaKey ? "PREV_PARAGRAPH" : "PREV_LINE",
        });
      } else if (key === "ArrowDown") {
        event.preventDefault();
        dispatch({
          type: event.metaKey ? "NEXT_PARAGRAPH" : "NEXT_LINE",
        });
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        dispatch({
          type: event.metaKey ? "PREV_WORD" : "PREV_CHAR",
        });
      } else if (key === "ArrowRight") {
        event.preventDefault();
        dispatch({
          type: event.metaKey ? "NEXT_WORD" : "NEXT_CHAR",
        });
      }
    };

    document.addEventListener("keydown", keydown);

    return () => {
      document.removeEventListener("keydown", keydown);
    };
  });

  useCommandEffect(state, "UPDATE", ({ content, lines, position }) => {
    drawLines(lines, position);
    onCaretChange(position);
    onChange(content);
  });

  useCommandEffect(state, "CHANGE_POSITION", ({ position, lines }) => {
    drawLines(lines, position);
    onCaretChange(position);
  });

  return canvas;
}
