# ContentModeration V2 Release Evidence

Verified on GenLayer Studionet on 2026-07-18.

## Deployment

- Contract: `0x981Ad492F0Cc733A16bb2C81d56E7c0c13d9E6eE`
- Local/deployed source comparison: exact match (`a0bddf35dd1225392b3f1f10485526a1fa2319d4f94f2495d4b5e6ba6269792a`)
- Schema: 11 public methods detected
- Test wallet: `0xeb57bc7125fa60d7482CE12058397369AB3581f8`

## Payable Moderation Lifecycle

| Step | Result | Transaction |
| --- | --- | --- |
| Submit safe text with a 1 wei moderation bond | Submission `0` created, bond locked | `0xa32a98c39f161fb31148f1b91d55e4eb7ed84cba32c8674f125e273ab5d06001` |
| Run GenLayer semantic moderation | `APPROVED` | `0x45ff40e3f828b1b1231d21ad648dfc4505872e8cfeb1aee0db8842f6fcaf4065` |
| Claim approved bond | Bond `REFUNDED` | `0xeb48c65100994dc47cf264851bbe8902b85ce2faae77b7a33a292cd753d92f83` |

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
