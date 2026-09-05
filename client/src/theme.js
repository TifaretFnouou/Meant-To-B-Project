import { createTheme } from "@mui/material";
import { brand } from "./theme/brand";

export function createAppTheme(direction = "rtl", mode = "light") {
  const isDark = mode === "dark";

  return createTheme({
    direction,
    palette: {
      mode,
      primary: {
        main: brand.dustyRose,
        light: brand.peach,
        dark: "#B86F82",
        contrastText: brand.white,
      },
      secondary: {
        main: brand.lavender,
        light: "#E8DCF0",
        dark: "#B8A0C4",
        contrastText: brand.charcoal,
      },
      warning: {
        main: brand.pastelYellow,
        contrastText: brand.charcoal,
      },
      background: {
        default: isDark ? "#17131B" : brand.white,
        paper: isDark ? "rgba(39, 32, 45, 0.94)" : brand.glass,
      },
      text: {
        primary: isDark ? "#F8F2F7" : brand.charcoal,
        secondary: isDark ? "rgba(248, 242, 247, 0.68)" : "rgba(59, 59, 59, 0.68)",
      },
      divider: isDark ? "rgba(245, 194, 180, 0.16)" : brand.dustyRoseSoft,
    },
    typography: {
      fontFamily:
        direction === "rtl"
          ? '"Rubik", "Arial", sans-serif'
          : '"Inter", "Rubik", sans-serif',
      h3: { fontWeight: 800, letterSpacing: "-0.02em" },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark
              ? "linear-gradient(160deg, #17131B 0%, #211A25 52%, #251C29 100%)"
              : `linear-gradient(160deg, ${brand.white} 0%, ${brand.yellowSoft} 35%, ${brand.peachSoft} 70%, ${brand.lavenderSoft} 100%)`,
            backgroundAttachment: "fixed",
            minHeight: "100vh",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 12,
            padding: "10px 22px",
            boxShadow: "none",
            "&:hover": {
              boxShadow: `0 8px 24px ${brand.dustyRoseSoft}`,
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${brand.dustyRose} 0%, ${brand.peach} 100%)`,
            color: brand.white,
            "&:hover": {
              background: `linear-gradient(135deg, #B86F82 0%, ${brand.dustyRose} 100%)`,
            },
          },
          containedSecondary: {
            background: `linear-gradient(135deg, ${brand.lavender} 0%, ${brand.peach} 100%)`,
            color: brand.charcoal,
          },
          outlined: {
            borderColor: brand.dustyRose,
            color: brand.dustyRose,
            "&:hover": {
              borderColor: brand.dustyRose,
              background: brand.dustyRoseSoft,
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: `1px solid ${isDark ? "rgba(245,194,180,0.14)" : brand.dustyRoseSoft}`,
            backdropFilter: "blur(12px)",
            backgroundImage: isDark
              ? "linear-gradient(135deg, rgba(47,39,53,0.96), rgba(34,28,39,0.92))"
              : "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.82))",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark ? "rgba(28, 23, 32, 0.88)" : brand.glass,
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${isDark ? "rgba(245,194,180,0.14)" : brand.dustyRoseSoft}`,
            color: isDark ? "#F8F2F7" : brand.charcoal,
            boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.28)" : `0 4px 24px ${brand.peachSoft}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500 },
          colorPrimary: {
            background: brand.dustyRoseSoft,
            color: brand.dustyRose,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.85)",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: brand.peach,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: brand.dustyRose,
              },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: `1px solid ${isDark ? "rgba(245,194,180,0.14)" : brand.dustyRoseSoft}`,
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: `0 18px 36px ${brand.peachSoft}`,
            },
          },
        },
      },
    },
  });
}

export default createAppTheme("rtl", "light");
