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
import { RoleModeProvider } from "./context/RoleModeContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SchedulingProvider } from "./context/SchedulingContext";
import { AdminConfigProvider } from "./context/AdminConfigContext";
import { ThemeModeProvider, useThemeMode } from "./context/ThemeModeContext";
import FeedbackReminder from "./components/feedback/FeedbackReminder";

const cacheRtl = createCache({ key: "muirtl", stylisPlugins: [prefixer, rtlPlugin] });
const cacheLtr = createCache({ key: "muiltr" });

function ThemedApp() {
  const { isRtl } = useLanguage();
  const { mode } = useThemeMode();
  const theme = useMemo(
    () => createAppTheme(isRtl ? "rtl" : "ltr", mode),
    [isRtl, mode]
  );
  const cache = isRtl ? cacheRtl : cacheLtr;

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RoleModeProvider>
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
          </RoleModeProvider>
        </AuthProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <ThemeModeProvider>
        <StyledEngineProvider injectFirst>
          <ThemedApp />
        </StyledEngineProvider>
      </ThemeModeProvider>
    </LanguageProvider>
  );
}

export default App;
