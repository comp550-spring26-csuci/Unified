import { HistoryOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMyActivityQuery } from "@state/api";

function formatActivityWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Dashboard() {
  const user = useSelector((s) => s.global.user);
  const navigate = useNavigate();
  const userId = user?.id || user?._id;

  const activityQ = useMyActivityQuery(undefined, {
    skip: !userId,
  });

  const activities = activityQ.data?.activities || [];

  return (
    <Box p={3}>
      <Typography variant="h3" fontWeight={800} mb={1}>
        Welcome{user?.name ? `, ${user.name}` : ""}
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Use the sidebar to browse communities, post updates, and manage events.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={4}>
        <Button variant="contained" onClick={() => navigate("/communities")}>
          Browse communities
        </Button>
        <Button variant="outlined" onClick={() => navigate("/my-communities")}>
          My communities
        </Button>
      </Stack>

      <Typography variant="h6" fontWeight={700} mb={1.5} display="flex" alignItems="center" gap={1}>
        <HistoryOutlined color="primary" />
        Recent activity
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Your last 10 actions across posts, comments, events, communities, and
        memberships.
      </Typography>

      {!userId ? (
        <Typography color="text.secondary">Sign in to see your activity.</Typography>
      ) : activityQ.isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : activityQ.isError ? (
        <Alert severity="warning">
          {activityQ.error?.data?.message || "Could not load activity."}
        </Alert>
      ) : activities.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography color="text.secondary">
            No activity yet. Create a community, join one, post, comment, or add
            an event to see it here.
          </Typography>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
          <List disablePadding>
            {activities.map((row, index) => (
              <Box key={`${row.at}-${row.action}-${index}`}>
                {index > 0 ? <Divider component="li" /> : null}
                <ListItem alignItems="flex-start" sx={{ py: 1.75, px: 2 }}>
                  <ListItemIcon sx={{ minWidth: 40, mt: 0.25 }}>
                    <Typography variant="caption" color="text.secondary" component="span" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                      {index + 1}
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography component="span" fontWeight={700}>
                        {row.action}
                      </Typography>
                    }
                    secondary={
                      <Stack component="span" spacing={0.5} sx={{ mt: 0.5 }}>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          sx={{ display: "block" }}
                        >
                          {row.detail}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
                          {formatActivityWhen(row.at)}
                        </Typography>
                      </Stack>
                    }
                    secondaryTypographyProps={{ component: "div" }}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
