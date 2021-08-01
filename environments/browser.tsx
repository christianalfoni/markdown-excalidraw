import React from "react";
import { EnvironmentProvider } from ".";
import { createProject } from "./project/browser";

const environment = {
  project: createProject(),
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
