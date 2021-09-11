/* eslint-disable no-console */
import {createAppAuth} from '@octokit/auth-app';
import {Octokit} from '@octokit/rest';
import {Endpoints} from '@octokit/types';
import * as core from '@actions/core';
import {spawnSync} from 'child_process';

const exec = (cmd: string, args: any[] = []): number => {
  core.info(`${cmd} ${args.join(' ')}`);
  const app = spawnSync(cmd, args, {stdio: 'inherit'});
  const code = app.status;
  if (code !== 0) {
    const err: any = new Error(`Invalid status code: ${code}`);
    err.code = code;
    throw err;
  }
  return code;
};

type listInstallationsResponse =
  Endpoints['GET /app/installations']['response'];

async function run(): Promise<void> {
  try {
    const privateKey: string = core.getInput('private_key');
    const appId: string = core.getInput('app_id');
    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey,
      },
      baseUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    });

    const installations: listInstallationsResponse =
      await appOctokit.apps.listInstallations();

    const resp: [string, string][] = (
      await Promise.all(
        installations.data.map(async (installation) => {
          if (installation.account && installation.account.login) {
            const result: {token: string} | undefined = (await appOctokit.auth({
              type: 'installation',
              installationId: installation.id,
            })) as any;
            if (!result) {
              throw new Error('Unable to authenticate');
            }
            return [installation.account.login, result.token];
          } else {
            return null;
          }
        })
      )
    ).filter(Boolean) as any;

    resp.forEach(([scope, token]) => {
      core.setSecret(token);
      exec('git', [
        'config',
        '--global',
        `url.https://x-access-token:${token}@github.com/${scope}/.insteadOf`,
        `git@github.com:${scope}/`,
      ]);
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
