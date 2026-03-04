import React, { useState, useMemo, useEffect } from "react";
import { Typography, Box, Alert, AlertTitle, Grid, TextField, InputAdornment, FormControl, InputLabel, Select, MenuItem, Stack, Chip, Pagination, SelectChangeEvent, Paper, CircularProgress } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { usePrivLend } from "../context/PrivLendContext";
import { LoanCard } from "../components/LoanCard";

export const Markets: React.FC = () => {
  const {
    activePublicLoans,
    expiredPublicLoans,
    settledPublicLoans,
    refreshData,
    loading
  } = usePrivLend();

  const [searchTerm, setSearchTerm] =
    useState("");
  const [filterBy, setFilterBy] =
    useState<"all" | "active" | "expired">(
      "all"
    );
  const [sortBy, setSortBy] =
    useState<"deadline" | "id">(
      "deadline"
    );

  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setPage(1);
  }, [filterBy, searchTerm, sortBy]);

  const filteredLoans = useMemo(() => {
    let base: typeof activePublicLoans =
      [];

    switch (filterBy) {
      case "active":
        base = activePublicLoans;
        break;
      case "expired":
        base = expiredPublicLoans;
        break;
      default:
        base = [
          ...activePublicLoans,
          ...expiredPublicLoans,
          ...settledPublicLoans
        ];
    }

    if (searchTerm.trim()) {
      const term =
        searchTerm.toLowerCase();

      base = base.filter(loan =>
        (loan.owner ?? "")
          .toLowerCase()
          .includes(term) ||
        loan.loan_id
          .toString()
          .includes(term)
      );
    }

    const sorted = [...base].sort(
      (a, b) =>
        sortBy === "deadline"
          ? a.deadline - b.deadline
          : b.loan_id - a.loan_id
    );

    return sorted;
  }, [
    filterBy,
    searchTerm,
    sortBy,
    activePublicLoans,
    expiredPublicLoans,
    settledPublicLoans
  ]);

  const pageCount = Math.ceil(
    filteredLoans.length /
      itemsPerPage
  );

  const displayedLoans =
    filteredLoans.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );

  return (
    <Box>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={2}
      >
        Global Loan Markets
      </Typography>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        mb={3}
      >
        <Chip
          label={`Active: ${activePublicLoans.length}`}
        />
        <Chip
          label={`Expired: ${expiredPublicLoans.length}`}
          color="error"
        />
        <Chip
          label={`Settled: ${settledPublicLoans.length}`}
        />
      </Stack>

      {/* Search & Filters */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by address or ID..."
              value={searchTerm}
              onChange={e =>
                setSearchTerm(
                  e.target.value
                )
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                Filter
              </InputLabel>
              <Select
                value={filterBy}
                label="Filter"
                onChange={(
                  e: SelectChangeEvent
                ) =>
                  setFilterBy(
                    e.target
                      .value as any
                  )
                }
              >
                <MenuItem value="all">
                  All
                </MenuItem>
                <MenuItem value="active">
                  Active
                </MenuItem>
                <MenuItem value="expired">
                  Expired
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl
              fullWidth
              size="small"
            >
              <InputLabel>
                Sort
              </InputLabel>
              <Select
                value={sortBy}
                label="Sort"
                onChange={(
                  e: SelectChangeEvent
                ) =>
                  setSortBy(
                    e.target
                      .value as any
                  )
                }
              >
                <MenuItem value="deadline">
                  Deadline
                </MenuItem>
                <MenuItem value="id">
                  Newest
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Liquidation Alert */}
      {expiredPublicLoans.length >
        0 && (
        <Alert
          severity="warning"
          sx={{ mb: 4 }}
        >
          <AlertTitle>
            Liquidation
            Opportunities
          </AlertTitle>
          {
            expiredPublicLoans.length
          }{" "}
          loan(s) eligible.
        </Alert>
      )}

      {/* Loan Grid */}
      {loading ? (
        <Box textAlign="center" py={8}>
          <CircularProgress />
        </Box>
      ) : displayedLoans.length === 0 ? (
        <Box
          textAlign="center"
          py={6}
        >
          <Typography color="text.secondary">
            No loans match your
            filters.
          </Typography>
        </Box>
      ) : (
        <>
          <Grid
            container
            spacing={3}
          >
            {displayedLoans.map(
              loan => (
                <Grid
                  size={{ xs: 12, md: 6, lg: 4 }}
                  key={loan.loan_id}
                >
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 20
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                  >
                    <LoanCard
                      loan={loan}
                      onUpdate={
                        refreshData
                      }
                    />
                  </motion.div>
                </Grid>
              )
            )}
          </Grid>

          {pageCount > 1 && (
            <Box
              display="flex"
              justifyContent="center"
              mt={4}
            >
              <Pagination
                count={pageCount}
                page={page}
                onChange={(
                  _,
                  value
                ) =>
                  setPage(value)
                }
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
