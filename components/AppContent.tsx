import React from "react";
import { match } from "react-states";
import { useProject } from "../features/project";
import { classNames } from "../utils";

export const AppContent = ({ children }: { children: React.ReactNode }) => {
  const [project] = useProject();

  return (
    <div
      className={classNames(
        "absolute top-0 min-h-screen w-screen flex font-serif font-normal text-gray-600 mx-auto transition-all ease-in-out duration-300",
        match(project.menu, {
          TOC: () => "left-72",
          IDLE: () => "left-0",
          GIT: () => "-left-72",
        })
      )}
    >
      {children}
    </div>
  );
};
