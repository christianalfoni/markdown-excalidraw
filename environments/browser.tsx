import React from "react";
import { EnvironmentProvider } from ".";
import { createProject } from "./project/browser";

export default ({ children }: { children: React.ReactNode }) => (
  <EnvironmentProvider
    environment={{
      project: createProject(),
    }}
  >
    {children}
  </EnvironmentProvider>
);
