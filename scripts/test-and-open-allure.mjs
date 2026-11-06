import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const playwrightCli = path.join(projectRoot, 'node_modules', '@playwright', 'test', 'cli.js');
const allureCli = path.join(projectRoot, 'node_modules', 'allure', 'cli.js');
const testArguments = process.argv.slice(2);
const isCi = Boolean(process.env.CI || process.env.TF_BUILD);

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: projectRoot, stdio: 'inherit' });
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });
}

function openReport() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [allureCli, 'open', '--host', '127.0.0.1', 'allure-report'], {
      cwd: projectRoot,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });

    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}

let exitCode;
try {
  exitCode = await run(process.execPath, [playwrightCli, 'test', ...testArguments]);
} catch (error) {
  console.error('Failed to start Playwright:', error);
  process.exitCode = 1;
}

let reportExitCode;
try {
  reportExitCode = await run(process.execPath, [allureCli, 'generate', 'allure-results', '--output', 'allure-report', '--clean']);
} catch (error) {
  console.error('Failed to generate the Allure report:', error);
  reportExitCode = 1;
}

if (reportExitCode === 0 && !isCi) {
  try {
    await openReport();
    console.log('Opened the Allure report in your browser.');
  } catch (error) {
    console.error('Failed to start the Allure report viewer:', error);
    reportExitCode = 1;
  }
}

process.exitCode = exitCode && exitCode !== 0 ? exitCode : reportExitCode ?? 0;
