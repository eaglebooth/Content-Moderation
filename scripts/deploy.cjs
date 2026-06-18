#!/usr/bin/env node

/**
 * GenLayer Contract Deployment Script
 * Deploys the ContentModeration contract to GenLayer testnet
 */

import { execSync } from 'child_process'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()))
  })
}

async function main() {
  console.log('='.repeat(60))
  console.log('  GenLayer ContentModeration Contract Deployment')
  console.log('='.repeat(60))
  console.log()

  // Pre-deployment checks
  console.log('Running pre-deployment checks...')
  console.log()

  try {
    // Check Python syntax
    console.log('1. Checking Python syntax...')
    execSync('python -c "import ast; ast.parse(open(\'contracts/ContentModeration.py\').read())"', {
      stdio: 'inherit',
      cwd: __dirname.replace('/scripts', '')
    })
    console.log('   ✓ Python syntax valid')
    console.log()
  } catch (error) {
    console.error('   ✗ Python syntax error!')
    process.exit(1)
  }

  try {
    // Run genlayer lint
    console.log('2. Running genlayer lint...')
    execSync('npx genlayer lint contracts/ContentModeration.py', {
      stdio: 'inherit',
      cwd: __dirname.replace('/scripts', '')
    })
    console.log('   ✓ Linting passed')
    console.log()
  } catch (error) {
    console.error('   ✗ Linting failed!')
    process.exit(1)
  }

  console.log('All pre-deployment checks passed!')
  console.log()

  const confirm = await ask('Do you want to deploy to GenLayer testnet? (yes/no): ')

  if (confirm.toLowerCase() !== 'yes') {
    console.log('Deployment cancelled.')
    rl.close()
    process.exit(0)
  }

  console.log()
  console.log('Deploying contract...')
  console.log()

  try {
    const result = execSync('npx genlayer deploy contracts/ContentModeration.py --name ContentModeration', {
      cwd: __dirname.replace('/scripts', ''),
      encoding: 'utf-8'
    })

    console.log(result)

    // Extract contract address from output
    const addressMatch = result.match(/0x[a-fA-F0-9]{40}/)
    if (addressMatch) {
      const contractAddress = addressMatch[0]
      console.log()
      console.log('='.repeat(60))
      console.log('  DEPLOYMENT SUCCESSFUL!')
      console.log('='.repeat(60))
      console.log()
      console.log(`Contract Address: ${contractAddress}`)
      console.log()
      console.log('Next steps:')
      console.log('1. Verify on GenLayer Explorer:')
      console.log(`   https://genlayer.com/explorer?address=${contractAddress}`)
      console.log()
      console.log('2. Update frontend .env.local:')
      console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`)
      console.log()
      console.log('3. Deploy frontend:')
      console.log('   npm run build')
      console.log('   vercel --prod')
      console.log()
    }
  } catch (error) {
    console.error('Deployment failed!')
    console.error(error.message)
    process.exit(1)
  }

  rl.close()
}

main().catch(console.error)
