const assert = require('assert')
const fs = require('fs')
const path = require('path')
const test = require('node:test')

const root = path.join(__dirname, '..')
const contract = fs.readFileSync(path.join(root, 'contracts/ContentModeration.py'), 'utf-8')
const client = fs.readFileSync(path.join(root, 'lib/genlayer-client.ts'), 'utf-8')

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
})
