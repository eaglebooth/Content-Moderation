# AI-powered Content Moderation

A GenLayer moderation bond protocol for text and public URL content. A submitter locks GEN, an Intelligent Contract reaches a semantic moderation verdict, and a one-time evidence-backed appeal determines whether the bond is returned or transferred to the treasury.

Pitch: this protocol dies without GenLayer because real funds depend on a subjective, context-sensitive judgment over live web evidence that no single operator should control.

## Live Artifacts

- App: https://content-moderation-zeta.vercel.app/
- Repository: https://github.com/eaglebooth/Content-Moderation
- ContentModeration V2: `0x981Ad492F0Cc733A16bb2C81d56E7c0c13d9E6eE`
- Network: GenLayer Studio (`studionet`)
- Verified payable lifecycle: [`RELEASE_EVIDENCE.md`](RELEASE_EVIDENCE.md)

## Contract Lifecycle

1. `submit(content, content_type)` authenticates the transaction sender and locks a non-zero GEN bond.
2. `evaluate(submission_id)` renders public URL evidence when needed and runs semantic validator consensus.
3. `open_appeal(submission_id, reason, evidence_url)` lets only the submitter add new public evidence.
4. `resolve_appeal(submission_id)` issues a final evidence-backed verdict.
5. `claim_bond(submission_id)` returns GEN after approval or unresolved manual review.
6. `slash_bond(submission_id)` transfers GEN to the treasury after final rejection or expiry.

The contract uses `gl.eq_principle.prompt_comparative`, not `strict_eq`, because free-form evidence reasoning must be compared by meaning. All public views return deterministic JSON strings.

## Frontend

The Next.js app preserves the existing blue, white, black, and orange visual system. Each transaction has a dedicated page:

- `/app/submit` creates a bonded request.
- `/app/review` reads the complete on-chain queue.
- `/app/request/[id]` presents the record and valid next actions.
- `/app/evaluate/[id]` runs initial consensus.
- `/app/appeal/[id]` opens or resolves an appeal.
- `/app/settle/[id]` settles the bond.
- `/app/analytics` derives outcomes and ledger totals from contract state.

The client uses `genlayer-js`, its native `studionet` chain, accepted transaction receipts, real wallet accounts, real payable values, and real view calls. Every write verifies the expected on-chain state change, and missing Studionet receipt metadata is recovered with `getTransaction` instead of being reported as a false failure. No Solidity ABI or Ethereum-mainnet fallback is used.

## Local Verification

```bash
npm install
npm test
npm run verify
npm run dev
```

After deploying a fresh contract, exercise real payable custody, AI consensus, and refund settlement with a disposable funded wallet:

```powershell
$env:CONTRACT_ADDRESS="0x..."
$env:PRIVATE_KEY="..."
npm run test:runtime
```

The runtime script never prints the private key and the repository does not store it.

Configure `.env.local` after redeployment:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x981Ad492F0Cc733A16bb2C81d56E7c0c13d9E6eE
NEXT_PUBLIC_NETWORK=studionet
NEXT_PUBLIC_GENLAYER_RPC=
```

## Deployment Handoff

The deployed V2 address must be kept identical in local configuration, Vercel environment variables, and this README. Reviewers can also enter another deployed address at runtime with **Use & verify**; the selection is stored only in their browser and can be reset with **Restore default**. Use **Sync Contract** before exercising write flows so a network or address mismatch is visible immediately.

## Repository Structure

```text
app/             Next.js routes
components/      shared navigation and shell
contracts/       ContentModeration Intelligent Contract
lib/             genlayer-js Studio client
scripts/         static and build verification
tests/           contract/integration guard tests
```

## License

MIT
