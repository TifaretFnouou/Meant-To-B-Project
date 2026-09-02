import { createTheme } from "@mui/material";

export function createAppTheme(direction = "rtl") {
  return createTheme({
    direction,
    palette: {
      mode: "light",
      primary: { main: "#7c3aed", light: "#a78bfa", dark: "#5b21b6" },
      secondary: { main: "#ec4899", light: "#f472b6", dark: "#db2777" },
      background: {
        default: "#f5f3ff",
        paper: "rgba(255,255,255,0.85)",
      },
      text: { primary: "#1e1b4b", secondary: "#64748b" },
    },
    typography: {
      fontFamily: direction === "rtl"
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
            background: "linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 50%, #eff6ff 100%)",
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
            "&:hover": { boxShadow: "0 8px 24px rgba(124,58,237,0.25)" },
          },
          containedPrimary: {
            background: "linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)",
          },
          containedSecondary: {
            background: "linear-gradient(135deg, #ec4899 0%, #f472b6 100%)",
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: "1px solid rgba(124,58,237,0.08)",
            backdropFilter: "blur(12px)",
            backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8))",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(124,58,237,0.1)",
            color: "#1e1b4b",
            boxShadow: "0 4px 30px rgba(124,58,237,0.08)",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 500 },
          colorPrimary: {
            background: "rgba(124,58,237,0.1)",
            color: "#7c3aed",
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.7)",
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: "1px solid rgba(124,58,237,0.08)",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 20px 40px rgba(124,58,237,0.12)",
            },
          },
        },
      },
    },
  });
}

export default createAppTheme("rtl");
