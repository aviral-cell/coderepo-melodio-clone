# Contributing to Melodio

## Candidate Contract Surface

- This repo uses two root-level contract files:
  - `candidate-contracts/candidate-frontend-contract.ts`
  - `candidate-contracts/candidate-backend-contract.ts`
- These files define candidate-facing exports for Knip reachability.

## Adding a candidate-visible helper or export

1. Implement the code in its normal location (e.g. `frontend/src/shared/utils/...` or `backend/src/features/...`).
2. Re-export it from the appropriate root contract file:
   - `candidate-contracts/candidate-frontend-contract.ts` (frontend)
   - `candidate-contracts/candidate-backend-contract.ts` (backend)
3. Run `bun run unused:check` to verify nothing candidate-facing is flagged as stale.

## Running unused-code checks

- **Command:** `bun run unused:check`
- **Tool:** [Knip](https://knip.dev); config in `knip.json`.
- The root contract files are configured as entry files so candidate-facing code is not reported as dead. Add targeted exceptions only when necessary (e.g. generated code or dynamic imports) and document them.

For more detail, see the **Candidate Contract Surface** and **Unused code detection** sections in [README.md](./README.md).
