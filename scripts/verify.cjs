#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()

function checkFile(filePath, description) {
  const fullPath = path.join(projectRoot, filePath)
  if (fs.existsSync(fullPath)) {
    console.log(`OK ${description}`)
    return true
  }
  console.error(`FAIL Missing: ${filePath}`)
  return false
}

function readContract() {
  return fs.readFileSync(path.join(projectRoot, 'contracts/ContentModeration.py'), 'utf-8')
}

function checkPythonSyntax() {
  try {
    execSync('python -c "import ast; ast.parse(open(\'contracts/ContentModeration.py\').read())"', {
      stdio: 'inherit',
      cwd: projectRoot,
    })
    console.log('OK Python syntax valid')
    return true
  } catch {
    console.error('FAIL Python syntax error')
    return false
  }
}

function checkContractHeader() {
  const lines = readContract().split('\n')
  const headerOk = lines[0]?.trim() === '# v0.2.16'
  const dependsOk = lines[1]?.includes('py-genlayer:')
  const importOk = lines.some((line) => line.trim() === 'from genlayer import *')

  if (!headerOk || !dependsOk || !importOk) {
    console.error('FAIL Contract header/import is incomplete')
    return false
  }

  console.log('OK Contract header/import correct')
  return true
}

function checkForbiddenTypes() {
  const content = readContract()
  const forbidden = ['float', 'tuple', 'list', 'dict', 'bool', 'NamedTuple', 'Optional', 'List', 'Dict']
  const cleanContent = content
    .split('\n')
    .map((line) => line.split('#')[0].replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, ''))
    .join('\n')

  const violations = forbidden.filter((type) => {
    const regex = new RegExp(`(?:storage:|:\\s*|->\\s*)${type}(?:\\s|,|\\)|\\]|$)`, 'g')
    return regex.test(cleanContent)
  })

  if (violations.length > 0) {
    console.error(`FAIL Forbidden type annotations found: ${violations.join(', ')}`)
    return false
  }

  console.log('OK No forbidden type annotations in signatures/storage')
  return true
}

function checkNondeterminismPattern() {
  const content = readContract()

  if (content.includes('gl.eq_principle.strict_eq')) {
    console.error('FAIL strict_eq consensus found; semantic consensus is required')
    return false
  }

  if (!content.includes('gl.eq_principle.prompt_comparative')) {
    console.error('FAIL Missing gl.eq_principle.prompt_comparative')
    return false
  }

  if (!content.includes('gl.nondet.web.render')) {
    console.error('FAIL Missing gl.nondet.web.render evidence fetch')
    return false
  }

  if (!/def\s+\w+\(.*\):.*\n.*gl\.nondet\.(web|exec_prompt)/s.test(content)) {
    console.error('FAIL Nondeterministic calls are not wrapped in local functions')
    return false
  }

  console.log('OK Nondeterministic calls use web evidence and semantic consensus')
  return true
}

function checkU256Usage() {
  if (!readContract().includes('u256(')) {
    console.error('FAIL Missing u256 wrappers')
    return false
  }

  console.log('OK u256 wrappers present')
  return true
}

function checkProjectStructure() {
  const required = [
    'contracts/ContentModeration.py',
    'app/layout.tsx',
    'app/page.tsx',
    'app/app/submit/page.tsx',
    'app/app/review/page.tsx',
    'app/app/analytics/page.tsx',
    'lib/genlayer-client.ts',
    'package.json',
    'README.md',
    'DEPLOY.md',
    'scripts/deploy.cjs',
    'scripts/verify.cjs',
    'tailwind.config.js',
    '.env.local.example',
    '.gitignore',
  ]

  return required.every((file) => checkFile(file, file))
}

function checkFrontendIntegration() {
  const content = fs.readFileSync(path.join(projectRoot, 'lib/genlayer-client.ts'), 'utf-8')

  if (!content.includes("from 'genlayer-js'") && !content.includes('from "genlayer-js"')) {
    console.error('FAIL Frontend client does not import genlayer-js')
    return false
  }

  if (content.includes('simpleHash4') || content.includes("crypto.subtle.digest('SHA-256'")) {
    console.error('FAIL Frontend still uses pseudo ABI hashing')
    return false
  }

  if (!content.includes("from 'genlayer-js/chains'") || !content.includes('studionet') || !content.includes('writeContract') || !content.includes('readContract')) {
    console.error('FAIL Frontend does not use native genlayer-js Studio calls')
    return false
  }

  console.log('OK Frontend uses native genlayer-js Studio calls')
  return true
}

function checkTestsPresent() {
  const testsDir = path.join(projectRoot, 'tests')
  const testFiles = fs.existsSync(testsDir)
    ? fs.readdirSync(testsDir).filter((file) => file.endsWith('.cjs') || file.endsWith('.js') || file.endsWith('.ts'))
    : []

  if (testFiles.length === 0) {
    console.error('FAIL No tests found')
    return false
  }

  console.log(`OK Tests present: ${testFiles.join(', ')}`)
  return true
}

function runBuild() {
  try {
    execSync('npm.cmd run build', { stdio: 'inherit', cwd: projectRoot })
    console.log('OK Next.js build passes')
    return true
  } catch {
    console.error('FAIL Next.js build failed')
    return false
  }
}

function main() {
  console.log('='.repeat(60))
  console.log('AI-powered Content Moderation - Verification')
  console.log('='.repeat(60))

  const checks = [
    ['Project structure', checkProjectStructure],
    ['Python syntax', checkPythonSyntax],
    ['Contract header', checkContractHeader],
    ['Type safety', checkForbiddenTypes],
    ['Nondeterminism pattern', checkNondeterminismPattern],
    ['Numeric precision', checkU256Usage],
    ['Frontend integration', checkFrontendIntegration],
    ['Tests', checkTestsPresent],
    ['Build', runBuild],
  ]

  let passed = true
  for (const [label, check] of checks) {
    console.log(`\n${label}`)
    console.log('-'.repeat(40))
    if (!check()) passed = false
  }

  console.log('\n' + '='.repeat(60))
  if (passed) {
    console.log('ALL CHECKS PASSED')
    process.exit(0)
  }

  console.log('SOME CHECKS FAILED')
  process.exit(1)
}

main()
