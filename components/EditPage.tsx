import dynamic from "next/dynamic";
import { useState } from "react";

import { CaretPosition } from "../features/writeBook";

const Editor = dynamic(() => import("./Editor"), { ssr: false });

export const EditPage = ({
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
      className="h-full outline-none font-mono text-md flex mx-auto items-center  bg-transparent overflow-hidden"
      style={{ width: "800px" }}
    >
      <Editor
        value={value}
        height={700}
        position={caretPosition}
        onChange={update}
        onCaretChange={updateCaretPosition}
      />
    </div>
  );
};
