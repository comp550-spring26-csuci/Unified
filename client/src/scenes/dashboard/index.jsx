import { Box, Button, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const user = useSelector((s) => s.global.user);
  const navigate = useNavigate();

  return (
    <Box p={3}>
      <Typography variant="h3" fontWeight={800} mb={1}>
        Welcome{user?.name ? `, ${user.name}` : ""}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Use the sidebar to browse communities, post updates, and manage events.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button variant="contained" onClick={() => navigate("/communities")}>Browse communities</Button>
        <Button variant="outlined" onClick={() => navigate("/my-communities")}>My communities</Button>
      </Stack>
    </Box>
  );
}
