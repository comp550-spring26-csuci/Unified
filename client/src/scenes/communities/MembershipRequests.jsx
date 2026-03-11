import { Alert, Box, Chip, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useMemo } from "react";
import { useMyMembershipsQuery } from "@state/api";
import { useNavigate } from "react-router-dom";

function StatusChip({ status }) {
  if (status === "approved") return <Chip size="small" color="success" label="Approved" />;
  if (status === "pending") return <Chip size="small" color="warning" label="Pending" />;
  if (status === "rejected") return <Chip size="small" color="error" label="Rejected" />;
  return <Chip size="small" label={status || "Unknown"} />;
}

export default function MembershipRequests() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyMembershipsQuery();

  const rows = (data?.memberships || []).map((m) => ({
    id: m._id,
    communityId: m?.community?._id,
    communityName: m?.community?.name || "Community unavailable",
    region: m?.community?.region || "",
    status: m?.status || "",
    joinReason: m?.joinReason || "",
    aboutMe: m?.aboutMe || "",
    rejectionReason: m?.rejectionReason || "",
    requestedAt: m?.createdAt,
    updatedAt: m?.updatedAt,
  }));

  const columns = useMemo(
    () => [
      { field: "communityName", headerName: "Community", flex: 1 },
      { field: "region", headerName: "Region", flex: 0.6 },
      {
        field: "status",
        headerName: "Request Status",
        flex: 0.6,
        renderCell: (params) => <StatusChip status={params.row.status} />,
      },
      {
        field: "joinReason",
        headerName: "Why You Joined",
        flex: 1.1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" noWrap title={params.row.joinReason || ""}>
            {params.row.joinReason || "-"}
          </Typography>
        ),
      },
      {
        field: "aboutMe",
        headerName: "About You",
        flex: 1.1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" noWrap title={params.row.aboutMe || ""}>
            {params.row.aboutMe || "-"}
          </Typography>
        ),
      },
      {
        field: "rejectionReason",
        headerName: "Rejection Reason",
        flex: 1.1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" noWrap title={params.row.rejectionReason || ""}>
            {params.row.status === "rejected" ? (params.row.rejectionReason || "No reason provided") : "-"}
          </Typography>
        ),
      },
      {
        field: "requestedAt",
        headerName: "Requested On",
        flex: 0.8,
        valueGetter: (p) => (p.value ? new Date(p.value).toLocaleString() : ""),
      },
      {
        field: "updatedAt",
        headerName: "Last Updated",
        flex: 0.8,
        valueGetter: (p) => (p.value ? new Date(p.value).toLocaleString() : ""),
      },
    ],
    []
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={1}>Membership Requests</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Track all join requests and see whether each one is pending, approved, or rejected.
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error?.data?.message || "Failed to load requests"}</Alert> : null}

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
          onRowClick={(params) => {
            if (!params.row.communityId) return;
            navigate(`/communities/${params.row.communityId}`);
          }}
        />
      </Box>
    </Box>
  );
}
