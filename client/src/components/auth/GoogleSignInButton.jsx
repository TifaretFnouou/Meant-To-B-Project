import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { useLanguage } from "../../context/LanguageContext";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

function GoogleLogoIcon({ size = 28 }) {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Box>
  );
}

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

/**
 * Google sign-in via Identity Services (ID token popup).
 * Calendar is handled separately (email ICS + "Add to Google Calendar" button).
 */
export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const callbackRef = useRef(onCredential);
  const hiddenBtnRef = useRef(null);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;

    if (!CLIENT_ID) {
      setError(t("auth.googleNotConfigured"));
      return undefined;
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => {
            setBusy(false);
            if (response?.credential) {
              callbackRef.current?.(response.credential);
            }
          },
          ux_mode: "popup",
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Official Google icon kept as a reliable fallback trigger for GIS popup flow
        if (hiddenBtnRef.current) {
          hiddenBtnRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(hiddenBtnRef.current, {
            type: "icon",
            theme: "outline",
            size: "large",
            shape: "circle",
          });
        }

        setReady(true);
        setError("");
      })
      .catch(() => {
        if (!cancelled) {
          setError(t("auth.googleLoadFailed"));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleClick = () => {
    if (!ready || disabled || busy) return;
    setBusy(true);

    // Prefer clicking the official GIS control (most reliable credential popup)
    const officialBtn = hiddenBtnRef.current?.querySelector("div[role='button']");
    if (officialBtn) {
      officialBtn.click();
      // GIS may close without callback; release busy after a short window
      window.setTimeout(() => setBusy(false), 2500);
      return;
    }

    if (window.google?.accounts?.id?.prompt) {
      window.google.accounts.id.prompt((notification) => {
        if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
          setBusy(false);
          setError(t("auth.googleLoadFailed"));
        }
      });
      return;
    }

    setBusy(false);
    setError(t("auth.googleLoadFailed"));
  };

  if (error && !CLIENT_ID) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box
      sx={{
        mt: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      {!ready && !error ? (
        <CircularProgress size={28} />
      ) : (
        <Tooltip title={t("auth.continueWithGoogle")}>
          <span>
            <IconButton
              onClick={handleClick}
              disabled={disabled || !ready || busy}
              aria-label={t("auth.continueWithGoogle")}
              sx={{
                width: 56,
                height: 56,
                border: "1px solid",
                borderColor: "divider",
                backgroundColor: "background.paper",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                "&:hover": {
                  backgroundColor: "action.hover",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                },
              }}
            >
              {busy ? <CircularProgress size={24} /> : <GoogleLogoIcon size={28} />}
            </IconButton>
          </span>
        </Tooltip>
      )}

      {error && CLIENT_ID ? (
        <Alert severity="warning" sx={{ width: "100%" }}>
          {error}
        </Alert>
      ) : null}

      {/* Visually hidden official GIS button used as click target */}
      <Box
        ref={hiddenBtnRef}
        aria-hidden
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          whiteSpace: "nowrap",
        }}
      />
    </Box>
  );
}
