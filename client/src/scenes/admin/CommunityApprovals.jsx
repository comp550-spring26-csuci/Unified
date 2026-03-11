import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useMemo } from "react";
import {
  useApproveCommunityMutation,
  useListPendingCommunitiesQuery,
  useRejectCommunityMutation,
} from "@state/api";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";

export default function CommunityApprovals() {
  const { data, isLoading, error } = useListPendingCommunitiesQuery();
  const [approve] = useApproveCommunityMutation();
  const [reject] = useRejectCommunityMutation();

  const rows = (data?.communities || []).map((c) => ({
    id: c._id,
    name: c.name,
    createdAt: c.createdAt,
    region: c.region || "",
    status: c.status,
  }));

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Community", flex: 1 },
      { field: "region", headerName: "Region", flex: 0.6 },
      {
        field: "createdAt",
        headerName: "Submitted",
        flex: 0.7,
        valueGetter: (p) => new Date(p.value).toLocaleString(),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        renderCell: (params) => (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              onClick={async () => {
                try {
                  await approve(params.row.id).unwrap();
                  toast.success("Community approved");
                } catch (err) {
                  toast.error(getApiErrorMessage(err, "Failed to approve community"));
                }
              }}
            >
              Approve
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={async () => {
                try {
                  await reject(params.row.id).unwrap();
                  toast.success("Community rejected");
                } catch (err) {
                  toast.error(getApiErrorMessage(err, "Failed to reject community"));
                }
              }}
            >
              Reject
            </Button>
          </Stack>
        ),
      },
    ],
    [approve, reject]
  );

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={1}>Community approvals</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Super Admin can approve or reject new communities.
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error?.data?.message || "Failed"}</Alert> : null}

      <Box height="70vh">
        <DataGrid rows={rows} columns={columns} loading={isLoading} disableRowSelectionOnClick />
      </Box>
    </Box>
  );
}
