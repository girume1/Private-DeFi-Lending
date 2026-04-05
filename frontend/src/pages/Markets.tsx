import React, { useState, useMemo, useEffect } from "react";
import {
  Typography,
  Box,
  Alert,
  AlertTitle,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Chip,
  Pagination,
  SelectChangeEvent,
  Paper,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from "@mui/material";
import {
  Search as SearchIcon,
  AccountBalance as BalanceIcon,
  SwapHoriz as SwapIcon,
  TrendingUp as TrendingIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { TransactionManager, TransactionItem } from "../services/TransactionManager";
import { motion } from "framer-motion";
import { usePrivLend } from "../context/PrivLendContext";
import { LoanCard } from "../components/LoanCard";

export const Markets: React.FC = () => {
  const {
    activePublicLoans,
    expiredPublicLoans,
    settledPublicLoans,
    refreshData,
    loading,
    currentBlock,
  } = usePrivLend();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterBy, setFilterBy] = useState<
    "all" | "active" | "expired" | "high-collateral"
  >("all");
  const [sortBy, setSortBy] = useState<"deadline" | "id" | "collateral">(
    "deadline",
  );
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const [allTxs, setAllTxs] = useState<TransactionItem[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txPage, setTxPage] = useState(0);
  const TX_PER_PAGE = 10;

  useEffect(() => {
    setPage(1);
  }, [filterBy, searchTerm, sortBy]);

  useEffect(() => {
    setTxLoading(true);
    const manager = new TransactionManager();
    manager.loadFromChain().then(txs => {
      setAllTxs(txs);
      setTxLoading(false);
    }).catch(() => setTxLoading(false));
  }, []);

  const txPageCount = Math.ceil(allTxs.length / TX_PER_PAGE);
  const pagedTxs = useMemo(
    () => allTxs.slice(txPage * TX_PER_PAGE, (txPage + 1) * TX_PER_PAGE),
    [allTxs, txPage],
  );

  function timeAgo(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  // Calculate stats
  const totalCollateralLocked = useMemo(() => {
    return activePublicLoans.filter((loan) => loan.collateral_locked).length;
  }, [activePublicLoans]);

  const averageLtv = useMemo(() => {
    if (activePublicLoans.length === 0) return 0;
    return 66.7; // Default 150% collateral ratio ≈ 66.7% LTV
  }, [activePublicLoans]);

  const filteredLoans = useMemo(() => {
    let base: typeof activePublicLoans = [];

    switch (filterBy) {
      case "active":
        base = activePublicLoans;
        break;
      case "expired":
        base = expiredPublicLoans;
        break;
      case "high-collateral":
        base = [...activePublicLoans, ...expiredPublicLoans]
          .filter((l) => l.collateral_locked)
          .slice(0, 50);
        break;
      default:
        base = [
          ...activePublicLoans,
          ...expiredPublicLoans,
          ...settledPublicLoans,
        ];
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      base = base.filter(
        (loan) =>
          (loan.owner ?? "").toLowerCase().includes(term) ||
          (loan.lender ?? "").toLowerCase().includes(term) ||
          loan.loan_id.toString().includes(term),
      );
    }

    const sorted = [...base].sort((a, b) => {
      if (sortBy === "deadline") return a.deadline - b.deadline;
      if (sortBy === "collateral")
        return b.collateral_locked === a.collateral_locked
          ? 0
          : b.collateral_locked
            ? 1
            : -1;
      return b.loan_id - a.loan_id;
    });

    return sorted;
  }, [
    filterBy,
    searchTerm,
    sortBy,
    activePublicLoans,
    expiredPublicLoans,
    settledPublicLoans,
  ]);

  const pageCount = Math.ceil(filteredLoans.length / itemsPerPage);
  const displayedLoans = filteredLoans.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={2}>
        Global Loan Markets
      </Typography>

      <Typography variant="body1" color="text.secondary" mb={3}>
        Browse and participate in private lending opportunities
      </Typography>

      {/* Market Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, bgcolor: "#0F172A", borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <TrendingIcon sx={{ color: "#10b981" }} />
              <Typography color="text.secondary">Active Loans</Typography>
            </Stack>
            <Typography variant="h4" color="#10b981">
              {activePublicLoans.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, bgcolor: "#0F172A", borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <BalanceIcon sx={{ color: "#f59e0b" }} />
              <Typography color="text.secondary">Total Collateral</Typography>
            </Stack>
            <Typography variant="h6" color="#f59e0b">
              {totalCollateralLocked} locked loan
              {totalCollateralLocked !== 1 ? "s" : ""}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, bgcolor: "#0F172A", borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={1}>
              <WarningIcon sx={{ color: "#ef4444" }} />
              <Typography color="text.secondary">Expired</Typography>
            </Stack>
            <Typography variant="h4" color="#ef4444">
              {expiredPublicLoans.length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 4, bgcolor: "#0F172A", borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by borrower, lender or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: "#111827",
                  "& fieldset": { borderColor: "#334155" },
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "text.secondary" }}>Filter</InputLabel>
              <Select
                value={filterBy}
                label="Filter"
                onChange={(e: SelectChangeEvent) =>
                  setFilterBy(e.target.value as any)
                }
                sx={{ bgcolor: "#111827" }}
              >
                <MenuItem value="all">All Loans</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="expired">Expired Only</MenuItem>
                <MenuItem value="high-collateral">Highest Collateral</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: "text.secondary" }}>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e: SelectChangeEvent) =>
                  setSortBy(e.target.value as any)
                }
                sx={{ bgcolor: "#111827" }}
              >
                <MenuItem value="deadline">Deadline (Earliest)</MenuItem>
                <MenuItem value="collateral">Collateral (Highest)</MenuItem>
                <MenuItem value="id">Newest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Chips */}
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 3, flexWrap: "wrap", gap: 1 }}
      >
        <Chip
          label={`Active: ${activePublicLoans.length}`}
          sx={{
            bgcolor: "#10b98120",
            color: "#10b981",
            border: "1px solid #10b98140",
          }}
        />
        <Chip
          label={`Expired: ${expiredPublicLoans.length}`}
          sx={{
            bgcolor: "#ef444420",
            color: "#ef4444",
            border: "1px solid #ef444440",
          }}
        />
        <Chip
          label={`Settled: ${settledPublicLoans.length}`}
          sx={{
            bgcolor: "#F59E0B20",
            color: "#F59E0B",
            border: "1px solid #F59E0B40",
          }}
        />
        <Chip
          icon={<BalanceIcon />}
          label={`Collateral Locked: ${totalCollateralLocked} loan${totalCollateralLocked !== 1 ? "s" : ""}`}
          variant="outlined"
          sx={{ borderColor: "#f59e0b40", color: "#f59e0b" }}
        />
        <Chip
          icon={<SwapIcon />}
          label={`Avg LTV: ~${averageLtv}%`}
          variant="outlined"
          sx={{ borderColor: "#8b5cf640", color: "#8b5cf6" }}
        />
      </Stack>

      {/* Liquidation Alert */}
      {expiredPublicLoans.length > 0 && (
        <Alert
          severity="warning"
          sx={{
            mb: 4,
            bgcolor: "#ef444420",
            color: "#ef4444",
            border: "1px solid #ef444440",
            "& .MuiAlert-icon": { color: "#ef4444" },
          }}
        >
          <AlertTitle>Liquidation Opportunities</AlertTitle>
          {expiredPublicLoans.length} loan(s) are expired and eligible for
          liquidation by their lenders.
        </Alert>
      )}

      {/* Loan Grid */}
      {loading ? (
        <Box textAlign="center" py={8}>
          <CircularProgress sx={{ color: "#F59E0B" }} />
          <Typography mt={2} color="text.secondary">
            Loading loans...
          </Typography>
        </Box>
      ) : displayedLoans.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            bgcolor: "#0F172A",
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary" mb={2}>
            No loans match your filters.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchTerm("");
              setFilterBy("all");
              setSortBy("deadline");
            }}
          >
            Clear Filters
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {displayedLoans.map((loan) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={loan.loan_id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoanCard loan={loan} onUpdate={refreshData} />
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {pageCount > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, value) => setPage(value)}
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "white",
                    borderColor: "#334155",
                  },
                }}
              />
            </Box>
          )}
        </>
      )}

      {/* Transitions Table */}
      <Paper sx={{ mt: 4, p: 0, bgcolor: "#0F172A", borderRadius: 3, border: "1px solid rgba(245,158,11,0.12)", overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={700} color="white" sx={{ fontFamily: '"Orbitron", sans-serif', fontSize: "0.95rem" }}>
              Recent Transitions
            </Typography>
            <Chip label={`${allTxs.length} total`} size="small" sx={{ bgcolor: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)", fontSize: "0.7rem" }} />
          </Stack>
        </Box>

        {txLoading ? (
          <Box textAlign="center" py={6}><CircularProgress sx={{ color: "#F59E0B" }} size={28} /></Box>
        ) : allTxs.length === 0 ? (
          <Box textAlign="center" py={6}>
            <Typography color="text.secondary" fontSize="0.875rem">No transactions found.</Typography>
          </Box>
        ) : (
          <Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {["#", "BLOCK", "TRANSITION ID", "FUNCTION", "STATUS", "AGE"].map(h => (
                      <TableCell key={h} sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", borderBottom: "1px solid rgba(255,255,255,0.06)", py: 1.2, px: 2, whiteSpace: "nowrap", bgcolor: "rgba(0,0,0,0.2)" }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedTxs.map((tx, idx) => {
                    const globalIdx = txPage * TX_PER_PAGE + idx + 1;
                    const color = tx.status === "Completed" ? "#10b981" : tx.status === "Pending" ? "#f59e0b" : "#ef4444";
                    return (
                      <TableRow
                        key={tx.id}
                        component="a"
                        href={`https://testnet.explorer.provable.com/transaction/${tx.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          textDecoration: "none", cursor: "pointer",
                          "&:hover td": { bgcolor: "rgba(245,158,11,0.03)" },
                          "& td": { borderBottom: "1px solid rgba(255,255,255,0.04)", py: 1.3, px: 2 },
                        }}
                      >
                        <TableCell sx={{ color: "rgba(255,255,255,0.2)", fontSize: "0.72rem", fontFamily: "monospace", width: 36 }}>{globalIdx}</TableCell>
                        <TableCell sx={{ color: "#F59E0B", fontSize: "0.72rem", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                          {tx.blockNumber ? tx.blockNumber.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem", fontFamily: "monospace" }}>
                          {tx.id.slice(0, 14)}…{tx.id.slice(-6)}
                        </TableCell>
                        <TableCell>
                          <Chip label={tx.type} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 600, bgcolor: "rgba(139,92,246,0.12)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.22)" }} />
                        </TableCell>
                        <TableCell>
                          <Chip label={tx.status} size="small" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700, bgcolor: `${color}18`, color, border: `1px solid ${color}35` }} />
                        </TableCell>
                        <TableCell sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                          {tx.timestamp ? timeAgo(tx.timestamp) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" px={2} py={1.5} sx={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <Typography variant="caption" color="text.disabled">
                {txPage * TX_PER_PAGE + 1}–{Math.min((txPage + 1) * TX_PER_PAGE, allTxs.length)} of {allTxs.length}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton size="small" disabled={txPage === 0} onClick={() => setTxPage(p => p - 1)}
                  sx={{ color: txPage === 0 ? "rgba(255,255,255,0.15)" : "#F59E0B", width: 28, height: 28 }}>
                  <ChevronLeft sx={{ fontSize: 18 }} />
                </IconButton>
                {Array.from({ length: Math.min(txPageCount, 8) }, (_, i) => (
                  <Box key={i} onClick={() => setTxPage(i)} sx={{ width: i === txPage ? 22 : 8, height: 8, borderRadius: 4, bgcolor: i === txPage ? "#F59E0B" : "rgba(255,255,255,0.15)", cursor: "pointer", transition: "all 0.2s" }} />
                ))}
                <IconButton size="small" disabled={txPage >= txPageCount - 1} onClick={() => setTxPage(p => p + 1)}
                  sx={{ color: txPage >= txPageCount - 1 ? "rgba(255,255,255,0.15)" : "#F59E0B", width: 28, height: 28 }}>
                  <ChevronRight sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Market Info Footer */}
      <Paper sx={{ mt: 4, p: 2, bgcolor: "#0F172A", borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Current Block:</strong> {currentBlock.toLocaleString()} |
              <strong> Total Loans:</strong>{" "}
              {activePublicLoans.length +
                expiredPublicLoans.length +
                settledPublicLoans.length}{" "}
              |<strong> Last Updated:</strong> {new Date().toLocaleTimeString()}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: "right" }}>
            <Chip
              size="small"
              label="Powered by Aleo ZK-Proofs"
              icon={<ShieldIcon />}
              sx={{ bgcolor: "#F59E0B20", color: "#F59E0B" }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
