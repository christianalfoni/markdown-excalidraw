import { createContext, useContext } from "react";
import { Auth } from "./auth";
import { Project } from "./project";

export interface Environment {
  project: Project;
  auth: Auth;
}

const environmentContext = createContext<Environment>({} as Environment);

export const useEnvironment = () => useContext(environmentContext);

export const EnvironmentProvider = ({
  children,
  environment,
}: {
  children: React.ReactNode;
  environment: Environment;
}) => {
  return (
    <environmentContext.Provider value={environment}>
      {children}
    </environmentContext.Provider>
  );
};
