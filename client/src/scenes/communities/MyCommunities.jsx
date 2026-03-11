import { Alert, Box, Chip, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useMemo } from "react";
import { useMyCommunitiesQuery } from "@state/api";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

function normalizeId(value) {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return String(value?._id || value?.id || "");
}

export default function MyCommunities() {
  const navigate = useNavigate();
  const user = useSelector((s) => s.global.user);
  const userId = normalizeId(user);
  const { data, isLoading, error } = useMyCommunitiesQuery();

  const rows = useMemo(
    () =>
      (data?.communities || []).map((c) => {
        const createdBy = normalizeId(c?.createdBy);
        const admins = (c?.admins || []).map(normalizeId);
        const moderators = (c?.moderators || []).map(normalizeId);
        let membershipType = "Joined";
        if (userId && createdBy === userId) membershipType = "Owner";
        else if (userId && admins.includes(userId)) membershipType = "Admin";
        else if (userId && moderators.includes(userId)) membershipType = "Moderator";

        return {
          id: c._id,
          name: c.name,
          status: c.status,
          region: c.region || "",
          membershipType,
        };
      }),
    [data?.communities, userId]
  );

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Community", flex: 1 },
      {
        field: "membershipType",
        headerName: "Your Role",
        flex: 0.6,
        minWidth: 140,
        renderCell: (params) => {
          const value = params.value || "Joined";
          const color =
            value === "Owner"
              ? "success"
              : value === "Admin"
                ? "primary"
                : value === "Moderator"
                  ? "warning"
                  : "default";
          return <Chip size="small" label={value} color={color} variant={value === "Joined" ? "outlined" : "filled"} />;
        },
      },
      { field: "region", headerName: "Region", flex: 0.7 },
      { field: "status", headerName: "Status", flex: 0.5 },
    ],
    []
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={1}>My communities</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Communities where your membership is approved. Use "Your Role" to see if it is your own community or one you joined.
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error?.data?.message || "Failed"}</Alert> : null}

      <Box height="70vh">
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          sx={{
            "& .MuiDataGrid-row:hover": { cursor: "pointer" },
            "& .MuiDataGrid-row:focus-within": { cursor: "pointer" },
          }}
          onRowClick={(params) => navigate(`/communities/${params.row.id}`)}
        />
      </Box>
    </Box>
  );
}
