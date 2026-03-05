import { spawn, execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

const TIMEOUT_MS = 10_000;
const INSTALL_TIMEOUT_MS = 30_000;
const SANDBOX_DIR = path.resolve(process.cwd(), 'sandbox');

function ensureSandbox() {
  if (!fs.existsSync(SANDBOX_DIR)) {
    fs.mkdirSync(SANDBOX_DIR, { recursive: true });
  }
  const pkgPath = path.join(SANDBOX_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    fs.writeFileSync(pkgPath, JSON.stringify({ type: 'module' }, null, 2));
  }
}

export function parsePackages(code: string): string[] {
  const importRegex = /^import\s+.*?\s+from\s+['"]([^'"./][^'"]*)['"]/gm;
  const packages = new Set<string>();

  for (const match of code.matchAll(importRegex)) {
    const spec = match[1];
    // handle scoped packages like @reduxjs/toolkit
    const pkg = spec.startsWith('@')
      ? spec.split('/').slice(0, 2).join('/')
      : spec.split('/')[0];
    packages.add(pkg);
  }

  return [...packages];
}

function installMissingPackages(packages: string[]) {
  const missing = packages.filter(
    (pkg) => !fs.existsSync(path.join(SANDBOX_DIR, 'node_modules', pkg))
  );
  if (missing.length > 0) {
    execSync(`npm install ${missing.join(' ')}`, {
      cwd: SANDBOX_DIR,
      timeout: INSTALL_TIMEOUT_MS,
    });
  }
}

export async function runCode(code: string, language: 'typescript' | 'javascript' | 'python', lessonTitle?: string): Promise<ExecuteResult> {
  const ext = language === 'typescript' ? 'ts' : language === 'javascript' ? 'mjs' : 'py';
  const slug = lessonTitle
    ? lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : randomUUID();
  const tmpDir = language === 'javascript' ? SANDBOX_DIR : os.tmpdir();
  const tmpFile = path.join(tmpDir, `techbridge-${slug}.${ext}`);

  try {
    fs.writeFileSync(tmpFile, code, 'utf-8');

    let command: string;
    let args: string[];

    if (language === 'typescript') {
      command = 'npx';
      args = ['tsx', tmpFile];
    } else if (language === 'javascript') {
      ensureSandbox();
      installMissingPackages(parsePackages(code));
      command = 'node';
      args = [tmpFile];
    } else {
      command = 'python3';
      args = [tmpFile];
    }

    return await new Promise<ExecuteResult>((resolve) => {
      let stdout = '';
      let stderr = '';

      const child = spawn(command, args, {
        env: { ...process.env, NODE_NO_WARNINGS: '1' },
        timeout: TIMEOUT_MS,
      });

      child.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
      child.stderr.on('data', (data: Buffer) => { stderr += data.toString(); });

      child.on('close', (code) => {
        resolve({ stdout, stderr, exitCode: code ?? 1 });
      });

      child.on('error', (err) => {
        resolve({ stdout, stderr: err.message, exitCode: 1 });
      });

      setTimeout(() => {
        child.kill('SIGKILL');
        resolve({ stdout, stderr: 'Execution timed out after 10 seconds', exitCode: 124 });
      }, TIMEOUT_MS);
    });
  } finally {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }
}
