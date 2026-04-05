import { HistoryOutlined, TrendingUpOutlined, PieChartOutlined } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMyActivityQuery } from "@state/api";

const CHART_COLORS = ["#0ea5e9", "#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6"];

function formatActivityWhen(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function localDateKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function shortDayLabel(d) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export default function Dashboard() {
  const theme = useTheme();
  const user = useSelector((s) => s.global.user);
  const navigate = useNavigate();
  const userId = user?.id || user?._id;

  const activityQ = useMyActivityQuery(undefined, {
    skip: !userId,
  });

  const activities = activityQ.data?.activities || [];

  const pieData = useMemo(() => {
    const counts = {};
    activities.forEach((a) => {
      const key = a.action || "Other";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([id, value], i) => ({
      id,
      label: id,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [activities]);

  const lineSeries = useMemo(() => {
    const now = new Date();
    const buckets = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      buckets.push({ key: localDateKey(d), date: d, count: 0 });
    }
    activities.forEach((a) => {
      if (!a.at) return;
      const ad = new Date(a.at);
      ad.setHours(0, 0, 0, 0);
      const k = localDateKey(ad);
      const b = buckets.find((x) => x.key === k);
      if (b) b.count += 1;
    });
    return [
      {
        id: "Actions",
        data: buckets.map((b) => ({
          x: shortDayLabel(b.date),
          y: b.count,
        })),
      },
    ];
  }, [activities]);

  const weekTotal = useMemo(
    () => lineSeries[0]?.data.reduce((s, p) => s + p.y, 0) ?? 0,
    [lineSeries],
  );

  const axisColor = theme.palette.text.secondary;
  const gridColor = theme.palette.divider;

  return (
    <Box p={3} sx={{ maxWidth: 1400, mx: "auto" }}>
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

      {!userId ? (
        <Typography color="text.secondary">Sign in to see your activity.</Typography>
      ) : activityQ.isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : activityQ.isError ? (
        <Alert severity="warning">
          {activityQ.error?.data?.message || "Could not load activity."}
        </Alert>
      ) : (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={4}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  height: "100%",
                  background: (t) =>
                    t.palette.mode === "dark"
                      ? "rgba(14,165,233,0.08)"
                      : "linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <TrendingUpOutlined color="primary" fontSize="small" />
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Recent actions
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={800}>
                  {activities.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 10 items from your account
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <PieChartOutlined color="primary" fontSize="small" />
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    Activity types
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={800}>
                  {pieData.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Unique categories in this window
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: "100%" }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <HistoryOutlined color="primary" fontSize="small" />
                  <Typography variant="overline" color="text.secondary" fontWeight={700}>
                    This week
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={800}>
                  {weekTotal}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Actions in the last 7 days (from recent list)
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {activities.length > 0 && (
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={5}>
                <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, height: "100%" }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    Mix by type
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    Share of each action in your latest activity.
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    <ResponsivePie
                      data={pieData}
                      margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      innerRadius={0.55}
                      padAngle={2}
                      cornerRadius={4}
                      activeOuterOffset={6}
                      colors={{ datum: "data.color" }}
                      borderWidth={1}
                      borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                      enableArcLinkLabels={false}
                      arcLabelsSkipAngle={12}
                      arcLabelsTextColor="#ffffff"
                      theme={{
                        labels: { text: { fontSize: 12, fontWeight: 600 } },
                        tooltip: {
                          container: {
                            background: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            fontSize: 12,
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={7}>
                <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, height: "100%" }}>
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>
                    Last 7 days
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={1.5}>
                    Count of listed actions per day (from your recent activity feed).
                  </Typography>
                  <Box sx={{ height: 280 }}>
                    <ResponsiveLine
                      data={lineSeries}
                      margin={{ top: 16, right: 24, bottom: 40, left: 48 }}
                      xScale={{ type: "point" }}
                      yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
                      axisBottom={{
                        tickSize: 0,
                        tickPadding: 10,
                        tickRotation: -20,
                      }}
                      axisLeft={{
                        tickSize: 0,
                        tickPadding: 8,
                        tickValues: 4,
                      }}
                      colors={["#0ea5e9"]}
                      lineWidth={3}
                      pointSize={10}
                      pointColor={{ theme: "background" }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: "serieColor" }}
                      enableArea
                      areaOpacity={0.12}
                      useMesh
                      theme={{
                        axis: {
                          domain: { line: { stroke: gridColor } },
                          ticks: {
                            line: { stroke: gridColor },
                            text: { fill: axisColor, fontSize: 11 },
                          },
                        },
                        grid: { line: { stroke: gridColor, strokeOpacity: 0.6 } },
                        tooltip: {
                          container: {
                            background: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            fontSize: 12,
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          )}

          <Typography variant="h6" fontWeight={700} mb={1.5} display="flex" alignItems="center" gap={1}>
            <HistoryOutlined color="primary" />
            Recent activity
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Your last 10 actions across posts, comments, events (created, RSVP, and
            volunteering), communities, and memberships.
          </Typography>

          {activities.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography color="text.secondary">
                No activity yet. Create a community, join one, post, comment, create
                an event, or RSVP / volunteer for an event to see it here.
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
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                          sx={{ fontFamily: "monospace", fontWeight: 600 }}
                        >
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
                            <Typography component="span" variant="body2" color="text.primary" sx={{ display: "block" }}>
                              {row.detail}
                            </Typography>
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ display: "block" }}>
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
        </>
      )}
    </Box>
  );
}
