import React from "react";
import { EnvironmentProvider } from ".";
import { createAuth } from "./auth/next";
import { createProject } from "./project/next";

const environment = {
  project: createProject(),
  auth: createAuth(),
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
