import React from "react";
import { EnvironmentProvider } from ".";
import { createProject } from "./project/next";

const environment = {
  project: createProject(),
};

export default function NextEnvironment({
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
