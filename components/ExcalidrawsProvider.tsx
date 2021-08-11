import { createContext } from "react";
import { Excalidraw } from "../environments/project";

export const excalidrawsContext = createContext<{ [id: string]: Excalidraw }>(
  {}
);

export const ExcalidrawsProvider = ({
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
