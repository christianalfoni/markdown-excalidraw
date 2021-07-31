import React from "react";
import { EnvironmentProvider } from ".";
import { createProject } from "./project/next";

export default ({ children }: { children: React.ReactNode }) => (
  <EnvironmentProvider
    environment={{
      project: createProject(),
    }}
  >
    {children}
  </EnvironmentProvider>
);
