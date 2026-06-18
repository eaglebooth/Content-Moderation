# 🚀 Deployment Guide

This guide walks you through deploying the AI Content Moderation project to GitHub and Vercel.

---

## 📦 Prerequisites

- **GitHub account** - Create one at [github.com](https://github.com)
- **Vercel account** - Create one at [vercel.com](https://vercel.com) (can sign up with GitHub)
- **Node.js 18+** installed locally
- **GenLayer CLI** installed (`npm install -g genlayer`)
- Contract already deployed to GenLayer testnet with address: `0x3CEa734cCB8d30b4d76476Da32c513892aeD13Ae`

---

## 📤 Step 1: Push to GitHub

### Option A: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Login to GitHub
gh auth login

# Create a new repository
gh repo create ai-content-moderation \
  --public \
  --description "AI-Powered Content Moderation on GenLayer" \
  --homepage "https://genlayer.com"

# Push your code
git push -u origin master
```

### Option B: Using GitHub Website

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `ai-content-moderation`
3. Description: `AI-Powered Content Moderation on GenLayer`
4. Select **Public**
5. **Do NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**
7. Follow the instructions to push an existing repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ai-content-moderation.git
   git push -u origin master
   ```

---

## ☁️ Step 2: Deploy to Vercel

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name: ai-content-moderation
# - In which directory is your code? . (current directory)
# - Want to override settings? No
```

### Via Vercel Dashboard (Web)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository:
   - Select your GitHub account
   - Choose `ai-content-moderation` repository
3. Configuration:
   - **Project Name**: `ai-content-moderation`
   - **Framework Preset**: Next.js
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Environment Variables:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x3CEa734cCB8d30b4d76476Da32c513892aeD13Ae
   NEXT_PUBLIC_GENLAYER_RPC_URL=https://rpc.testnet.genlayer.com
   ```
5. Click **Deploy**
6. Wait for build to complete (usually 2-5 minutes)

---

## ✅ Step 3: Verify Deployment

After deployment:

1. **Vercel App URL**: Copy from Vercel dashboard (usually `https://ai-content-moderation.vercel.app`)
2. **Test the app**:
   - Open the deployed URL
   - You should see the homepage with "Submit Content" form
   - Navigate to Review and Statistics pages
   - Connect your wallet (MetaMask) to test real transactions
3. **Contract verification**:
   - Verify contract on GenLayer Explorer: https://genlayer.com/explorer?address=0x3CEa734cCB8d30b4d76476Da32c513892aeD13Ae
   - Check that contract source code is visible

---

## 🔧 Optional: Custom Domain

To use a custom domain:

1. In Vercel dashboard, go to your project
2. **Settings** → **Domains**
3. Add your domain (e.g., `moderation.yourdomain.com`)
4. Follow Vercel's instructions to configure DNS

---

## 📝 Notes

- **Contract Address**: The deployed contract address is already configured in `.env.local`. When deploying to Vercel, add the same environment variables in the Vercel dashboard.
- **RPC Endpoint**: Using GenLayer testnet RPC. For production, switch to mainnet.
- **Wallet Connection**: Requires MetaMask or compatible wallet. Users will be prompted to connect when submitting content.
- **Transaction Fees**: Submitting content and appealing require gas fees on GenLayer testnet (use testnet tokens).

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails with "Cannot find module 'tailwindcss'" | Run `npm install` before deploying |
| Contract calls fail | Ensure MetaMask is connected to GenLayer testnet |
| Environment variables not working | Check Vercel dashboard → Project Settings → Environment Variables |
| Transaction stuck | GenLayer evaluation takes 30-60 seconds. Check transaction status on explorer. |

---

## 📊 Project Summary

**Project Name**: AI Content Moderation

**Description**: AI-powered content moderation system built on GenLayer that uses multi-validator consensus for fair, transparent decisions. Users submit text or image URLs, AI validators evaluate against community guidelines, and decisions are enforced on-chain with appeal mechanisms.

**GitHub**: `https://github.com/YOUR_USERNAME/ai-content-moderation`

**Live Demo**: `https://ai-content-moderation.vercel.app` (after deployment)

---

**Built with GenLayer Intelligent Contracts**
