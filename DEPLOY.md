# Deployment Guide

## Current Deployment Values

- Project: `AI-powered Content Moderation`
- Live app: https://content-moderation-zeta.vercel.app/
- Current contract address: `0x3CEa734cCB8d30b4d76476Da32c513892aeD13Ae`
- Explorer: https://genlayer.com/explorer?address=0x3CEa734cCB8d30b4d76476Da32c513892aeD13Ae

## Required Environment Variables

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x3CEa734cCB8d30b4d76476Da32c513892aeD13Ae
NEXT_PUBLIC_GENLAYER_RPC_URL=https://rpc.testnet.genlayer.com
```

Set these in both `.env.local` and the Vercel project settings.

## Local Verification

```bash
npm install
npm run test
npm run verify
```

`npm run verify` checks project structure, contract nondeterminism patterns, frontend GenLayer integration, tests, and a production Next.js build.

## Deploy Contract

The GenLayer CLI version available in this environment does not expose a `lint` command. Use local verification first, then deploy:

```bash
npm run verify
npx genlayer deploy contracts/ContentModeration.py --name ContentModeration
```

After deployment:

1. Copy the new contract address.
2. Update `.env.local`.
3. Update Vercel environment variables.
4. Update this file and `README.md`.
5. Redeploy the frontend.

## Deploy Frontend

```bash
vercel --prod
```

Vercel settings:

- Framework preset: Next.js
- Root directory: `.`
- Build command: `npm run build`
- Output directory: `.next`

## Demo Checklist

1. Open the live app.
2. Submit text content.
3. Submit URL content to demonstrate web evidence.
4. Trigger or retry evaluation from Review Queue.
5. Open the request detail page.
6. Show verdict, score, category scores, and AI reason.
7. Submit an appeal for a resolved request.

## Troubleshooting

| Issue | Fix |
|---|---|
| Missing contract address | Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in local/Vercel env |
| Contract calls fail | Confirm wallet is on GenLayer testnet and contract was redeployed after code changes |
| Old UI appears locally | Stop the old Node process on port 3000 and restart `npm run dev` or `npm run start` |
| Evaluation remains pending | Use the Review Queue `Evaluate` button after the submit transaction is accepted |
