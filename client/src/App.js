import React, { useMemo } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider, CssBaseline, StyledEngineProvider } from "@mui/material";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { createAppTheme } from "./theme";
import AppRoutes from "./routes/AppRoutes";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SchedulingProvider } from "./context/SchedulingContext";
import { AdminConfigProvider } from "./context/AdminConfigContext";
import FeedbackReminder from "./components/feedback/FeedbackReminder";

const cacheRtl = createCache({ key: "muirtl", stylisPlugins: [prefixer, rtlPlugin] });
const cacheLtr = createCache({ key: "muiltr" });

function ThemedApp() {
  const { isRtl } = useLanguage();
  const theme = useMemo(() => createAppTheme(isRtl ? "rtl" : "ltr"), [isRtl]);
  const cache = isRtl ? cacheRtl : cacheLtr;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AdminConfigProvider>
            <NotificationProvider>
              <SchedulingProvider>
                <Router>
                  <AppRoutes />
                  <FeedbackReminder />
                </Router>
              </SchedulingProvider>
            </NotificationProvider>
          </AdminConfigProvider>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <StyledEngineProvider injectFirst>
        <ThemedApp />
      </StyledEngineProvider>
    </LanguageProvider>
  );
}

export default App;
