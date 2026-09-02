import { createTheme } from "@mui/material";
import { brand } from "./theme/brand";

export function createAppTheme(direction = "rtl") {
  return createTheme({
    direction,
    palette: {
      mode: "light",
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
        default: brand.white,
        paper: brand.glass,
      },
      text: {
        primary: brand.charcoal,
        secondary: "rgba(59, 59, 59, 0.68)",
      },
      divider: "rgba(211, 138, 155, 0.18)",
    },
    typography: {
      fontFamily:
        direction === "rtl"
          ? '"Rubik", "Arial", sans-serif'
          : '"Inter", "Rubik", sans-serif',
      h3: { fontWeight: 800, letterSpacing: "-0.02em", color: brand.charcoal },
      h5: { fontWeight: 700, color: brand.charcoal },
      h6: { fontWeight: 600, color: brand.charcoal },
      button: { fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: `linear-gradient(160deg, ${brand.white} 0%, ${brand.yellowSoft} 35%, ${brand.peachSoft} 70%, ${brand.lavenderSoft} 100%)`,
            minHeight: "100vh",
            color: brand.charcoal,
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
            border: `1px solid ${brand.dustyRoseSoft}`,
            backdropFilter: "blur(12px)",
            backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.82))`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: brand.glass,
            backdropFilter: "blur(16px)",
            borderBottom: `1px solid ${brand.dustyRoseSoft}`,
            color: brand.charcoal,
            boxShadow: `0 4px 24px ${brand.peachSoft}`,
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
              backgroundColor: "rgba(255,255,255,0.85)",
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
            border: `1px solid ${brand.dustyRoseSoft}`,
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

export default createAppTheme("rtl");
