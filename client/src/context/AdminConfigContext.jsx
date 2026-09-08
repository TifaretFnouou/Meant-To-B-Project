import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_ADVICE_TOPICS, DEFAULT_TECH_STACK } from "../constants";
import { useAuth } from "./AuthContext";
import {
  fetchAdminConfig,
  addTechRequest,
  removeTechRequest,
  addTopicRequest,
  removeTopicRequest,
} from "../services/api";

const AdminConfigContext = createContext(null);

export function AdminConfigProvider({ children }) {
  const { token, isAdmin } = useAuth();

  // start with the local defaults so the screen is not empty while loading,
  // and replace them as soon as the server response comes back.
  const [techStack, setTechStack] = useState([...DEFAULT_TECH_STACK]);
  const [adviceTopics, setAdviceTopics] = useState([...DEFAULT_ADVICE_TOPICS]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // without a token, or for a non-admin user - no point in trying (server will return 401/403 in any case),
    // and just stay with the local defaults.
    if (!token || !isAdmin) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadConfig() {
      setLoading(true);
      try {
        const config = await fetchAdminConfig();
        if (cancelled) return;
        setTechStack(config.techStack || []);
        setAdviceTopics(config.adviceTopics || []);
        setError(null);
      } catch (err) {
        console.error("[AdminConfigContext] Failed to load config from server:", err);
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadConfig();
    return () => {
      cancelled = true;
    };
    // runs again whenever the token changes (e.g. successful login after the component
    // was already mounted, or logout) - exactly what was missing before.
  }, [token, isAdmin]);

  const addTech = async (item) => {
    const updated = await addTechRequest(item);
    setTechStack(updated);
  };

  const removeTech = async (item) => {
    const updated = await removeTechRequest(item);
    setTechStack(updated);
  };

  const addTopic = async (item) => {
    const updated = await addTopicRequest(item);
    setAdviceTopics(updated);
  };

  const removeTopic = async (item) => {
    const updated = await removeTopicRequest(item);
    setAdviceTopics(updated);
  };

  const value = useMemo(
    () => ({
      techStack,
      adviceTopics,
      loading,
      error,
      addTech,
      removeTech,
      addTopic,
      removeTopic,
    }),
    [techStack, adviceTopics, loading, error]
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