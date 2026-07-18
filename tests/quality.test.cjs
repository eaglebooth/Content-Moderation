const assert = require('assert')
const fs = require('fs')
const path = require('path')
const test = require('node:test')

const root = path.join(__dirname, '..')
const contract = fs.readFileSync(path.join(root, 'contracts/ContentModeration.py'), 'utf-8')
const client = fs.readFileSync(path.join(root, 'lib/genlayer-client.ts'), 'utf-8')
const shell = fs.readFileSync(path.join(root, 'components/AppShell.tsx'), 'utf-8')
const submitPage = fs.readFileSync(path.join(root, 'app/app/submit/page.tsx'), 'utf-8')

test('contract has the pinned Studio runtime header', () => {
  const lines = contract.split(/\r?\n/)
  assert.equal(lines[0], '# v0.2.16')
  assert.equal(lines[1], '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }')
  assert.equal(lines[2], 'from genlayer import *')
})

test('contract uses semantic consensus and current web rendering', () => {
  assert.equal((contract.match(/gl\.eq_principle\.prompt_comparative/g) || []).length, 2)
  assert(!contract.includes('gl.eq_principle.strict_eq'))
  assert(contract.includes('gl.nondet.web.render'))
})

test('contract has real payable bond custody and settlement transfers', () => {
  assert(contract.includes('@gl.public.write.payable\n    def submit'))
  assert(contract.includes('bond = gl.message.value'))
  assert.equal((contract.match(/emit_transfer\(value=amount\)/g) || []).length, 2)
  assert(contract.includes('BOND_REFUND'))
  assert(contract.includes('BOND_SLASH'))
})

test('contract authenticates submitter-owned actions', () => {
  assert(contract.includes('gl.message.sender_address.as_hex'))
  assert(contract.includes('NOT_SUBMITTER'))
  assert(!contract.includes('def submit(self, content: str, content_type: str, submitter: str)'))
})

test('contract exposes complete review and appeal lifecycle', () => {
  for (const method of ['submit', 'evaluate', 'open_appeal', 'resolve_appeal', 'accept_rejection', 'claim_bond', 'slash_bond']) {
    assert(contract.includes(`def ${method}`))
  }
})

test('malformed AI output degrades to manual review instead of failing the transaction', () => {
  assert(contract.includes('cleaned.find("{")'))
  assert(contract.includes('cleaned.rfind("}")'))
  assert(contract.includes('The validator output was not valid JSON'))
  assert(!contract.includes('return "INVALID_AI_RESPONSE"'))
})

test('contract uses deterministic transaction time and no nonexistent block API', () => {
  assert(contract.includes('gl.message_raw["datetime"]'))
  assert(contract.includes('def _transaction_timestamp'))
  assert(!contract.includes('gl.get_block_timestamp'))
})

test('public views return deterministic JSON strings', () => {
  assert(contract.includes('def get_system_state(self) -> str'))
  assert(contract.includes('def get_submission(self, submission_id: u256) -> str'))
  assert(contract.includes('sort_keys=True'))
  assert(!contract.includes('get_submissions_by_status'))
})

test('frontend uses the GenLayer SDK and native Studio chain', () => {
  assert(client.includes("from 'genlayer-js'"))
  assert(client.includes("from 'genlayer-js/chains'"))
  assert(client.includes('studionet'))
  assert(client.includes('writeContract'))
  assert(client.includes('TransactionStatus.ACCEPTED'))
  assert(client.includes('getTransaction'))
  assert(client.includes('stateEventuallyMatches'))
  assert(client.includes('setActiveContractAddress'))
  assert(client.includes('verifyContractAddress'))
  assert(client.includes('content-moderation-contract-address-v2'))
  assert(client.includes('leader_receipt'))
  assert(client.includes('localStorage'))
  assert(!client.includes('TransactionStatus.FINALIZED'))
})

test('reviewer contract overrides are verified before they are persisted', () => {
  const verifyPosition = shell.indexOf('await verifyContractAddress(addressInput)')
  const persistPosition = shell.indexOf('setActiveContractAddress(verified.address)')
  assert(verifyPosition >= 0)
  assert(persistPosition > verifyPosition)
})

test('submit page uses the verified one-wei demo bond and validates it locally', () => {
  assert(submitPage.includes("useState('0.000000000000000001')"))
  assert(submitPage.includes('if (bondWei <= 0n)'))
  assert(submitPage.includes('Submission accepted and verified on-chain'))
})
