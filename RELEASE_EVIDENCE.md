# ContentModeration V2 Release Evidence

Verified on GenLayer Studionet on 2026-07-18.

## Deployment

- Contract: `0x991272C07158e7cC526233Dee29F765D75163461`
- Local/deployed source comparison: exact match
- Schema: 11 public methods detected
- Test wallet: `0xeb57bc7125fa60d7482CE12058397369AB3581f8`

## Payable Moderation Lifecycle

| Step | Result | Transaction |
| --- | --- | --- |
| Submit safe text with a 1 wei moderation bond | Submission `0` created, bond locked | `0x434d8814d298d93def3d0059c60e3486cf1c3be9d6025f82ff2d050c6e362caf` |
| Run GenLayer semantic moderation | `APPROVED` | `0x81bd9b92e270f7368e73ea3cdaacc171e93141fcf33fd060b29dc00e44983ceb` |
| Claim approved bond | Bond `REFUNDED` | `0x94f1ae5e5b3cf60593e248d257d1021cfc11f1486b084d91f1b54bea2893c8a6` |

Final state:

```json
{
  "settlement_count": "1",
  "submission_count": "1",
  "total_bonded": "0",
  "total_refunded": "1",
  "total_slashed": "0"
}
```

The test was executed by `npm run test:runtime`. The disposable wallet private key is not stored in this repository.
