#!/usr/bin/env node

const contractAddress = process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
const rawPrivateKey = process.env.PRIVATE_KEY

if (!contractAddress || !/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
  throw new Error('Set CONTRACT_ADDRESS to the deployed ContentModeration contract')
}
if (!rawPrivateKey || !/^(0x)?[a-fA-F0-9]{64}$/.test(rawPrivateKey)) {
  throw new Error('Set PRIVATE_KEY for a funded disposable Studionet test wallet')
}

const privateKey = rawPrivateKey.startsWith('0x') ? rawPrivateKey : `0x${rawPrivateKey}`

function parse(value) {
  if (typeof value !== 'string') return value
  try { return parse(JSON.parse(value)) } catch { return value }
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function main() {
  const [{ createAccount, createClient }, { studionet }, { TransactionStatus }] = await Promise.all([
    import('genlayer-js'),
    import('genlayer-js/chains'),
    import('genlayer-js/types'),
  ])
  const account = createAccount(privateKey)
  const client = createClient({ chain: studionet, account })

  const read = async (functionName, args = []) => parse(await client.readContract({ address: contractAddress, functionName, args }))
  const stateBefore = await read('get_system_state')
  const submissionId = Number(stateBefore.submission_count)

  async function waitForState(check, label, attempts = 45) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const value = await check()
        if (value) return value
      } catch { /* The accepted state may take another RPC poll to become readable. */ }
      await sleep(10_000)
    }
    throw new Error(`Timed out verifying ${label}`)
  }

  async function write(functionName, args = [], value = 0n) {
    const hash = await client.writeContract({ address: contractAddress, functionName, args, value })
    console.log(`${functionName} submitted: ${hash}`)
    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.ACCEPTED,
      interval: 10_000,
      retries: 90,
      fullTransaction: false,
    })
    let transaction = receipt
    if (!transaction.txExecutionResultName) {
      try { transaction = await client.getTransaction({ hash }) } catch { transaction = receipt }
    }
    if (transaction.txExecutionResultName === 'FINISHED_WITH_ERROR') {
      throw new Error(`${functionName} failed on-chain (${hash})`)
    }
    console.log(`${functionName} accepted: ${hash}`)
    return hash
  }

  const submitHash = await write(
    'submit',
    ['Community notice: the public library will extend weekend opening hours for students and families.', 'TEXT'],
    1n,
  )
  await waitForState(async () => Number((await read('get_system_state')).submission_count) === submissionId + 1, 'submission creation')

  const evaluateHash = await write('evaluate', [submissionId])
  const evaluated = await waitForState(async () => {
    const submission = await read('get_submission', [submissionId])
    return submission.status !== 'PENDING' ? submission : null
  }, 'AI moderation outcome', 120)

  let settlementHash = ''
  if (['APPROVED', 'FINAL_APPROVED', 'MANUAL_REVIEW'].includes(evaluated.status)) {
    settlementHash = await write('claim_bond', [submissionId])
    await waitForState(async () => (await read('get_submission', [submissionId])).bond_status === 'REFUNDED', 'bond refund')
  } else {
    throw new Error(`Expected safe sample approval, received ${evaluated.status}; inspect ${evaluateHash}`)
  }

  const finalSubmission = await read('get_submission', [submissionId])
  const finalState = await read('get_system_state')
  console.log(JSON.stringify({
    contract: contractAddress,
    test_wallet: account.address,
    submission_id: String(submissionId),
    verdict: finalSubmission.status,
    bond_status: finalSubmission.bond_status,
    submit_transaction: submitHash,
    evaluate_transaction: evaluateHash,
    settlement_transaction: settlementHash,
    state: finalState,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
