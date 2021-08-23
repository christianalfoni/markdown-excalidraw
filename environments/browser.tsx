import React from "react";
import { EnvironmentProvider } from ".";
import { createAuth } from "./auth/browser";
import { createExcalidraw } from "./excalidraw/browser";
import { createProject } from "./project/browser";

const environment = {
  project: createProject(),
  auth: createAuth(),
  excalidraw: createExcalidraw(),
};

export default function BrowserEnvironment({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EnvironmentProvider environment={environment}>
      {children}
    </EnvironmentProvider>
  );
}
