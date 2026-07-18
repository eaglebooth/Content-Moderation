# ContentModeration V2 Deployment Handoff

## Current State

- Network: GenLayer Studio (`studionet`)
- Contract: `0x981Ad492F0Cc733A16bb2C81d56E7c0c13d9E6eE`
- Frontend: approved for GitHub and Vercel deployment
- Previous V1 address: incompatible and removed from runtime configuration

## Required Studio Checks

Test this sequence after deploying `contracts/ContentModeration.py`:

1. Call payable `submit` with text and a non-zero GEN bond.
2. Call `get_system_state` and confirm `submission_count` and `total_bonded` increased.
3. Call `evaluate` and verify a semantic verdict is stored.
4. For rejection/review, call `open_appeal` as the original submitter with a public HTTPS evidence URL.
5. Call `resolve_appeal`.
6. Call `claim_bond` for an approved outcome, or `accept_rejection` then `slash_bond` for a rejected outcome.
7. Confirm the transfer and settlement record.

After all checks pass, set:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x981Ad492F0Cc733A16bb2C81d56E7c0c13d9E6eE
NEXT_PUBLIC_NETWORK=studionet
NEXT_PUBLIC_GENLAYER_RPC=
```

Then run `npm test`, `npm run build`, open the local app, and verify the Sync Contract button before any GitHub or Vercel deployment.
