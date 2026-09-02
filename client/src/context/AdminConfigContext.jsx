import React, { createContext, useContext, useMemo, useState } from "react";
import { DEFAULT_ADVICE_TOPICS, DEFAULT_TECH_STACK } from "../constants";

const AdminConfigContext = createContext(null);

export function AdminConfigProvider({ children }) {
  const [techStack, setTechStack] = useState([...DEFAULT_TECH_STACK]);
  const [adviceTopics, setAdviceTopics] = useState([...DEFAULT_ADVICE_TOPICS]);

  const addTech = (item) => {
    if (!techStack.includes(item)) setTechStack((prev) => [...prev, item]);
  };

  const removeTech = (item) => {
    setTechStack((prev) => prev.filter((t) => t !== item));
  };

  const addTopic = (item) => {
    if (!adviceTopics.includes(item)) setAdviceTopics((prev) => [...prev, item]);
  };

  const removeTopic = (item) => {
    setAdviceTopics((prev) => prev.filter((t) => t !== item));
  };

  const value = useMemo(
    () => ({
      techStack,
      adviceTopics,
      addTech,
      removeTech,
      addTopic,
      removeTopic,
    }),
    [techStack, adviceTopics]
  );

  return (
    <AdminConfigContext.Provider value={value}>
      {children}
    </AdminConfigContext.Provider>
  );
}

export function useAdminConfig() {
  const ctx = useContext(AdminConfigContext);
  if (!ctx) {
    throw new Error("useAdminConfig must be used within AdminConfigProvider");
  }
  return ctx;
}
