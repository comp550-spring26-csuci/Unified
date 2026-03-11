import { alpha } from "@mui/material/styles";

/**
 * Blue/white UI theme (with optional dark mode).
 *
 * The app originally shipped with a dark-heavy token system. This theme
 * modernizes the look to match the provided references: clean white surfaces,
 * subtle borders, rounded cards, and a crisp blue primary.
 */

// Sky-blue focused palette (white surfaces + sky accents)
const SKY = {
  50: "#f0f9ff",
  100: "#e0f2fe",
  200: "#bae6fd",
  300: "#7dd3fc",
  400: "#38bdf8",
  500: "#0ea5e9",
  600: "#0284c7",
  700: "#0369a1",
  800: "#075985",
  900: "#0c4a6e",
};

export const themeSettings = (mode) => {
  const isDark = mode === "dark";

  const common = {
    typography: {
      fontFamily: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"].join(","),
      fontSize: 14,
      h1: { fontSize: 40, fontWeight: 800, letterSpacing: "-0.02em" },
      h2: { fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" },
      h3: { fontSize: 28, fontWeight: 800, letterSpacing: "-0.015em" },
      h4: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" },
      h5: { fontSize: 18, fontWeight: 700 },
      h6: { fontSize: 16, fontWeight: 700 },
      button: { textTransform: "none", fontWeight: 700 },
    },
    shape: { borderRadius: 14 },
  };

  const light = {
    palette: {
      mode: "light",
      primary: {
        main: SKY[500],
        light: SKY[400],
        dark: SKY[600],
        contrastText: "#ffffff",
      },
      secondary: {
        main: SKY[500],
      },
      text: {
        primary: "#0f172a", // slate-900
        secondary: "#475569", // slate-600
      },
      background: {
        // User requested "everything in white and sky blue"
        default: "#ffffff",
        paper: "#ffffff",
        // Use a very light sky tint for subtle section separation (still reads as white).
        alt: SKY[50],
      },
      divider: "#e5e7eb", // gray-200
      neutral: {
        main: "#64748b", // slate-500
      },
      success: { main: "#16a34a" },
      warning: { main: "#f59e0b" },
      error: { main: "#ef4444" },
      info: { main: SKY[500] },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: "#ffffff",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${SKY[100]}`,
            boxShadow: "0 8px 24px rgba(2, 132, 199, 0.06)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            paddingLeft: 14,
            paddingRight: 14,
          },
          contained: {
            boxShadow: "none",
            ":hover": { boxShadow: "none" },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: "medium",
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: "#ffffff",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: "#ffffff",
            borderRight: `1px solid ${SKY[100]}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            marginLeft: 10,
            marginRight: 10,
            marginTop: 4,
            marginBottom: 4,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999,
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: `1px solid ${SKY[100]}`,
            borderRadius: 16,
            backgroundColor: "#ffffff",
          },
          columnHeaders: {
            backgroundColor: SKY[50],
            borderBottom: `1px solid ${SKY[100]}`,
          },
          row: {
            ":hover": {
              backgroundColor: alpha(SKY[100], 0.55),
            },
          },
        },
      },
    },
  };

  const dark = {
    palette: {
      mode: "dark",
      primary: {
        main: SKY[400],
        light: SKY[300],
        dark: SKY[600],
      },
      secondary: {
        main: SKY[300],
      },
      background: {
        default: "#0b1220",
        paper: "#0f172a",
        alt: "#0f172a",
      },
      divider: "rgba(148,163,184,0.22)",
      text: {
        primary: "#e2e8f0",
        secondary: "#94a3b8",
      },
      neutral: {
        main: "#94a3b8",
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(148,163,184,0.22)",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: "1px solid rgba(148,163,184,0.18)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            paddingLeft: 14,
            paddingRight: 14,
          },
          contained: {
            boxShadow: "none",
            ":hover": { boxShadow: "none" },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: "rgba(2,6,23,0.25)",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: "#0f172a",
            borderRight: "1px solid rgba(148,163,184,0.18)",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            marginLeft: 10,
            marginRight: 10,
            marginTop: 4,
            marginBottom: 4,
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            border: "1px solid rgba(148,163,184,0.18)",
          },
        },
      },
    },
  };

  return {
    ...common,
    ...(isDark ? dark : light),
  };
};
