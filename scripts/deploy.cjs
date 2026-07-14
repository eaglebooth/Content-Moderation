#!/usr/bin/env node

const { execSync } = require('child_process')
const readline = require('readline')
const path = require('path')

const projectRoot = path.join(__dirname, '..')
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()))
  })
}

async function main() {
  console.log('='.repeat(60))
  console.log('GenLayer ContentModeration Contract Deployment')
  console.log('='.repeat(60))

  try {
    console.log('\n1. Running local verification...')
    execSync('npm.cmd run verify', { stdio: 'inherit', cwd: projectRoot })

    console.log('\n2. GenLayer CLI detected.')
    execSync('npx genlayer --version', { stdio: 'inherit', cwd: projectRoot })
  } catch (error) {
    console.error('\nPre-deployment checks failed.')
    process.exit(1)
  }

  const confirm = await ask('\nDeploy ContentModeration V2 to the currently selected GenLayer Studio network? Type "yes" to continue: ')
  if (confirm.toLowerCase() !== 'yes') {
    console.log('Deployment cancelled.')
    rl.close()
    process.exit(0)
  }

  try {
    console.log('\nDeploying contract...')
    const result = execSync('npx genlayer deploy contracts/ContentModeration.py --name ContentModeration', {
      cwd: projectRoot,
      encoding: 'utf-8',
    })

    console.log(result)
    const addressMatch = result.match(/0x[a-fA-F0-9]{40}/)

    if (!addressMatch) {
      console.log('Deployment finished, but no contract address was found in CLI output.')
      rl.close()
      return
    }

    const contractAddress = addressMatch[0]
    console.log('\n' + '='.repeat(60))
    console.log('DEPLOYMENT SUCCESSFUL')
    console.log('='.repeat(60))
    console.log(`Contract Address: ${contractAddress}`)
    console.log(`Explorer: https://genlayer.com/explorer?address=${contractAddress}`)
    console.log('\nUpdate environment variables:')
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`)
    console.log('NEXT_PUBLIC_NETWORK=studionet')
    console.log('NEXT_PUBLIC_GENLAYER_RPC=')
  } catch (error) {
    console.error('Deployment failed.')
    console.error(error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
