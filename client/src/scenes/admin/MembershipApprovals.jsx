import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import {
  useApproveMemberMutation,
  useMyCommunitiesQuery,
  usePendingMembersQuery,
  useRejectMemberMutation,
} from "@state/api";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "../../utils/apiError";

export default function MembershipApprovals() {
  const user = useSelector((s) => s.global.user);
  const userId = String(user?.id || user?._id || "");
  const { data: myC } = useMyCommunitiesQuery();
  const [communityId, setCommunityId] = useState("");

  const manageableCommunities = useMemo(() => {
    const communities = myC?.communities || [];
    if (user?.role === "super_admin") return communities;
    if (!userId) return [];

    return communities.filter((community) => {
      const admins = (community?.admins || []).map((u) => String(u?._id || u));
      const moderators = (community?.moderators || []).map((u) => String(u?._id || u));
      return admins.includes(userId) || moderators.includes(userId);
    });
  }, [myC?.communities, user?.role, userId]);

  useEffect(() => {
    if (!communityId) return;
    const stillAvailable = manageableCommunities.some((c) => c._id === communityId);
    if (!stillAvailable) setCommunityId("");
  }, [communityId, manageableCommunities]);

  useEffect(() => {
    if (communityId) return;
    if (!manageableCommunities.length) return;
    setCommunityId(manageableCommunities[0]._id);
  }, [communityId, manageableCommunities]);

  const pendingQ = usePendingMembersQuery(communityId, { skip: !communityId });
  const [approve] = useApproveMemberMutation();
  const [reject] = useRejectMemberMutation();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const rows = (pendingQ.data?.memberships || []).map((m) => ({
    id: m.user?._id,
    name: m.user?.name,
    email: m.user?.email,
    requestedAt: m.createdAt,
    joinReason: m.joinReason || "",
    aboutMe: m.aboutMe || "",
    contribution: m.contribution || "",
  }));

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Name", flex: 1 },
      { field: "email", headerName: "Email", flex: 1 },
      {
        field: "joinReason",
        headerName: "Why Join",
        flex: 1.2,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" noWrap title={params.row.joinReason}>
            {params.row.joinReason || "-"}
          </Typography>
        ),
      },
      {
        field: "aboutMe",
        headerName: "About",
        flex: 1.2,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" noWrap title={params.row.aboutMe}>
            {params.row.aboutMe || "-"}
          </Typography>
        ),
      },
      {
        field: "contribution",
        headerName: "Contribution",
        flex: 1,
        renderCell: (params) => (
          <Typography variant="body2" color="text.secondary" noWrap title={params.row.contribution}>
            {params.row.contribution || "-"}
          </Typography>
        ),
      },
      {
        field: "requestedAt",
        headerName: "Requested",
        flex: 0.8,
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
                  await approve({ communityId, memberId: params.row.id }).unwrap();
                  toast.success("Member approved");
                } catch (err) {
                  toast.error(getApiErrorMessage(err, "Failed to approve member"));
                }
              }}
            >
              Approve
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={() => {
                setRejectTarget(params.row);
                setRejectReason("");
                setRejectDialogOpen(true);
              }}
            >
              Reject
            </Button>
          </Stack>
        ),
      },
    ],
    [approve, reject, communityId]
  );

  const submitReject = async () => {
    if (!rejectTarget?.id || !communityId) return;
    try {
      await reject({ communityId, memberId: rejectTarget.id, reason: rejectReason }).unwrap();
      toast.success("Member rejected");
      setRejectDialogOpen(false);
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to reject member"));
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={1}>Membership approvals</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Community admins (and super admin) can approve membership requests.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2} alignItems={{ sm: "center" }}>
        <TextField
          select
          label="Select community"
          value={communityId}
          onChange={(e) => setCommunityId(e.target.value)}
          sx={{ minWidth: 320 }}
        >
          {manageableCommunities.map((c) => (
            <MenuItem key={c._id} value={c._id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {!manageableCommunities.length ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          You do not currently have membership-approval permissions in any community.
        </Alert>
      ) : null}

      {pendingQ.error ? <Alert severity="error" sx={{ mb: 2 }}>{pendingQ.error?.data?.message || "Failed"}</Alert> : null}

      <Box height="70vh">
        <DataGrid rows={rows} columns={columns} loading={pendingQ.isLoading} disableRowSelectionOnClick />
      </Box>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject Membership Request</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            You can optionally provide a reason for rejecting {rejectTarget?.name || "this user"}.
          </Typography>
          <TextField
            label="Reason (optional)"
            multiline
            minRows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            inputProps={{ maxLength: 500 }}
            helperText={`${rejectReason.length}/500`}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setRejectDialogOpen(false);
              setRejectTarget(null);
              setRejectReason("");
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={submitReject}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
