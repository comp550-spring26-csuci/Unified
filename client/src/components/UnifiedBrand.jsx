import { Box, Typography } from "@mui/material";

export default function UnifiedBrand({ variant = "bar", onClick, sx }) {
  const isSidebar = variant === "sidebar";
  const ringPx = isSidebar ? 52 : 46;
  const iconPx = isSidebar ? 80 : 70;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: isSidebar ? 1.4 : 1.2,
        cursor: onClick ? "pointer" : "default",
        transition: "opacity 0.2s ease, transform 0.2s ease",
        "&:hover": onClick ? { opacity: 0.9, transform: "translateY(-1px)" } : undefined,
        userSelect: "none",
        ...sx,
      }}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          width: ringPx,
          height: ringPx,
          borderRadius: "50%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background:
            theme.palette.mode === "dark"
              ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.14), rgba(255,255,255,0.04))"
              : "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(0,0,0,0.03))",
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 6px 16px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,0.1)"
              : "0 5px 14px rgba(15,23,42,0.14), inset 0 0 0 1px rgba(15,23,42,0.06)",
        })}
      >
        <Box
          component="img"
          src="/logo.png"
          alt=""
          sx={{
            width: iconPx,
            height: iconPx,
            maxWidth: "none",
            objectFit: "contain",
            display: "block",
          }}
        />
      </Box>

      <Typography
        component="span"
        sx={(theme) => ({
          fontWeight: 900,
          fontSize: isSidebar ? "1.62rem" : "1.4rem",
          lineHeight: 1,
          letterSpacing: "-0.045em",
          color: theme.palette.mode === "dark" ? "#E8F1FF" : "#0F2745",
          textShadow:
            theme.palette.mode === "dark"
              ? "0 1px 0 rgba(0,0,0,0.35)"
              : "0 1px 0 rgba(255,255,255,0.7)",
          transform: "translateY(-0.02em)",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        })}
      >
        Unified
      </Typography>
    </Box>
  );
}
