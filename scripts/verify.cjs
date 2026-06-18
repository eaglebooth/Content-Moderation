#!/usr/bin/env node

/**
 * Project Verification Script
 * Runs all pre-deployment checks
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const projectRoot = process.cwd()

function checkFile(filePath, description) {
  const fullPath = path.join(projectRoot, filePath)
  if (fs.existsSync(fullPath)) {
    console.log(`✓ ${description}`)
    return true
  } else {
    console.error(`✗ Missing: ${filePath}`)
    return false
  }
}

function checkPythonSyntax() {
  try {
    console.log('Checking Python syntax...')
    execSync('python -c "import ast; ast.parse(open(\'contracts/ContentModeration.py\').read())"', {
      stdio: 'inherit',
      cwd: projectRoot
    })
    console.log('✓ Python syntax valid')
    return true
  } catch (error) {
    console.error('✗ Python syntax error!')
    return false
  }
}

function checkContractHeader() {
  const contractPath = path.join(projectRoot, 'contracts/ContentModeration.py')
  const content = fs.readFileSync(contractPath, 'utf-8')
  const lines = content.split('\n')

  const expectedHeader = '# v0.2.16'
  const expectedDepends = '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }'
  const expectedImport = 'from genlayer import *'

  if (lines[0]?.trim() === expectedHeader && lines[1]?.trim() === expectedDepends) {
    console.log('✓ Contract header correct')
  } else {
    console.error('✗ Contract header incorrect')
    return false
  }

  if (lines.findIndex(line => line.includes(expectedImport)) > 0) {
    console.log('✓ Import statement correct')
  } else {
    console.error('✗ Missing genlayer import')
    return false
  }

  return true
}

function checkForbiddenTypes() {
  const contractPath = path.join(projectRoot, 'contracts/ContentModeration.py')
  const content = fs.readFileSync(contractPath, 'utf-8')

  const forbidden = ['int', 'float', 'tuple', 'list', 'dict', 'bool', 'NamedTuple', 'Optional', 'List', 'Dict']

  // Remove comments and strings to avoid false positives
  const lines = content.split('\n')
  const cleanLines = lines.map(line => {
    // Remove single-line comments
    const withoutComment = line.split('#')[0]
    // Remove string literals (simple approach)
    return withoutComment.replace(/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/g, '')
  })

  const cleanContent = cleanLines.join('\n')

  // Check for forbidden types in signatures/storage only
  // Pattern: type annotation contexts (after : or -> in function defs, or storage: type)
  const violations = []
  for (const type of forbidden) {
    // Match: storage: type, or param: type, or -> type at end or before ,
    // But NOT int(...) function calls
    const regex = new RegExp(`(?:storage:|:\\s*|->\\s*)${type}(?:\\s|,|\\)|\\]|$)`, 'g')
    if (regex.test(cleanContent)) {
      violations.push(type)
    }
  }

  if (violations.length === 0) {
    console.log('✓ No forbidden types in signatures/storage')
    return true
  } else {
    console.error(`✗ Forbidden types found: ${violations.join(', ')}`)
    return false
  }
}

function checkNondetPattern() {
  const contractPath = path.join(projectRoot, 'contracts/ContentModeration.py')
  const content = fs.readFileSync(contractPath, 'utf-8')

  if (!content.includes('gl.eq_principle.strict_eq')) {
    console.error('✗ Missing strict_eq pattern')
    return false
  }

  const hasNondetInsideLocal = /def\s+\w+\(.*\):.*\n.*gl\.nondet\.(web|exec_prompt)/s.test(content)

  if (hasNondetInsideLocal) {
    console.log('✓ Nondeterministic operations properly wrapped')
    return true
  } else {
    console.error('✗ Nondet calls not inside local functions')
    return false
  }
}

function checkU256Usage() {
  const contractPath = path.join(projectRoot, 'contracts/ContentModeration.py')
  const content = fs.readFileSync(contractPath, 'utf-8')

  if (content.includes('u256(')) {
    console.log('✓ u256 wrappers present')
    return true
  } else {
    console.error('✗ Missing u256 wrappers')
    return false
  }
}

function checkProjectStructure() {
  console.log('Checking project structure...')
  let allGood = true

  const required = [
    'contracts/ContentModeration.py',
    'frontend/app/layout.tsx',
    'frontend/app/page.tsx',
    'frontend/app/review/page.tsx',
    'frontend/app/results/page.tsx',
    'frontend/lib/genlayer-client.ts',
    'package.json',
    'README.md',
    'scripts/deploy.cjs',
    'tailwind.config.js',
    '.gitignore'
  ]

  for (const file of required) {
    if (!checkFile(file, `  ${file}`)) {
      allGood = false
    }
  }

  return allGood
}

function main() {
  console.log('='.repeat(60))
  console.log('  AI Content Moderation - Verification')
  console.log('='.repeat(60))
  console.log()

  let passed = true

  console.log('1. Project Structure')
  console.log('-'.repeat(40))
  if (!checkProjectStructure()) passed = false
  console.log()

  console.log('2. Python Syntax')
  console.log('-'.repeat(40))
  if (!checkPythonSyntax()) passed = false
  console.log()

  console.log('3. Contract Header')
  console.log('-'.repeat(40))
  if (!checkContractHeader()) passed = false
  console.log()

  console.log('4. Type Safety')
  console.log('-'.repeat(40))
  if (!checkForbiddenTypes()) passed = false
  console.log()

  console.log('5. Nondeterminism Pattern')
  console.log('-'.repeat(40))
  if (!checkNondetPattern()) passed = false
  console.log()

  console.log('6. Numeric Precision')
  console.log('-'.repeat(40))
  if (!checkU256Usage()) passed = false
  console.log()

  console.log('='.repeat(60))
  if (passed) {
    console.log('  ✅ ALL CHECKS PASSED')
    console.log('='.repeat(60))
    console.log()
    console.log('Your contract is ready for deployment!')
    console.log('Next steps:')
    console.log('  1. Install genlayer CLI: npm install -g genlayer')
    console.log('  2. Run: genlayer lint contracts/ContentModeration.py')
    console.log('  3. Run: genlayer deploy contracts/ContentModeration.py')
    console.log()
    process.exit(0)
  } else {
    console.log('  ❌ SOME CHECKS FAILED')
    console.log('='.repeat(60))
    console.log()
    console.log('Please fix the issues above before deploying.')
    process.exit(1)
  }
}

main().catch(console.error)
