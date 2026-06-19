const assert = require('assert')
const fs = require('fs')
const path = require('path')
const test = require('node:test')

const root = path.join(__dirname, '..')
const contract = fs.readFileSync(path.join(root, 'contracts/ContentModeration.py'), 'utf-8')
const client = fs.readFileSync(path.join(root, 'lib/genlayer-client.ts'), 'utf-8')

test('contract uses semantic consensus instead of strict byte equality', () => {
  assert(!contract.includes('gl.eq_principle.strict_eq'))
  assert(contract.includes('gl.eq_principle.prompt_comparative'))
})

test('contract fetches on-chain web evidence for URL submissions', () => {
  assert(contract.includes('gl.nondet.web.render'))
  assert(contract.includes('WEB_RENDER_FAILED'))
})

test('contract handles core edge cases', () => {
  assert(contract.includes('INVALID_SUBMISSION_ID'))
  assert(contract.includes('ALREADY_EVALUATED'))
  assert(contract.includes('INVALID_AI_RESPONSE'))
  assert(contract.includes('APPEAL_LIMIT_REACHED'))
})

test('frontend uses GenLayer call encoding instead of pseudo ABI hashing', () => {
  assert(client.includes("from 'genlayer-js'"))
  assert(client.includes('toRlp'))
  assert(client.includes('readContract'))
  assert(!client.includes('simpleHash4'))
  assert(!client.includes("crypto.subtle.digest('SHA-256'"))
})
