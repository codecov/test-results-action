/* eslint-disable  @typescript-eslint/no-explicit-any */

import * as core from '@actions/core';
import * as github from '@actions/github';

import {
  isTrue,
  getPlatform,
  getUploaderName,
} from './helpers';
import {
  setFailure,
} from './helpers';


const context = github.context;

const cleanEnvVars = (envVars: string) => {
  const cleanedVars = [];
  for (const envVar of envVars.split(',')) {
    const envVarClean = envVar.trim();
    if (envVarClean) {
      cleanedVars.push(envVarClean);
    }
  }
  return cleanedVars;
};

const isPullRequestFromFork = (): boolean => {
  core.info(`eventName: ${context.eventName}`);
  if (!['pull_request', 'pull_request_target'].includes(context.eventName)) {
    return false;
  }

  const baseLabel = context.payload.pull_request.base.label;
  const headLabel = context.payload.pull_request.head.label;

  core.info(`baseRef: ${baseLabel} | headRef: ${headLabel}`);
  return baseLabel.split(':')[0] !== headLabel.split(':')[0];
};


const getOverrideBranch = (token: string): string => {
  let overrideBranch = core.getInput('override_branch');
  if (!overrideBranch && !token && isPullRequestFromFork()) {
    core.info('==> Fork detected, tokenless uploading used');
    // backwards compatibility with certain versions of the CLI that expect this
    process.env['TOKENLESS'] = context.payload.pull_request.head.label;
    overrideBranch = context.payload.pull_request.head.label;
  }
  return overrideBranch;
};

const buildDownloadOptions = () => {
  const os = core.getInput('os');
  const platform = getPlatform(os);
  const uploaderName = getUploaderName(platform);
  const uploaderVersion = core.getInput('version') || 'latest';

  return {platform, uploaderName, uploaderVersion};
};

const buildGeneralArgs = (verbose: boolean) => {
  const codecovYmlPath = core.getInput('codecov_yml_path');
  const url = core.getInput('url');
  const args = [];

  if (codecovYmlPath) {
    args.push('--codecov-yml-path', `${codecovYmlPath}`);
  }
  if (url) {
    args.push('--enterprise-url', `${url}`);
  }
  if (verbose) {
    args.push('-v');
  }

  return args;
};

const buildUploadArgs = (token: string, envVars, failCi: boolean) => {
  const disableSearch = isTrue(core.getInput('disable_search'));
  const dryRun = isTrue(core.getInput('dry_run'));
  const exclude = core.getInput('exclude');
  const file = core.getInput('file');
  const files = core.getInput('files');
  const flags = core.getInput('flags');
  const handleNoReportsFound = isTrue(core.getInput('handle_no_reports_found'));
  const name = core.getInput('name');
  const overrideBranch = getOverrideBranch(token);
  const overrideBuild = core.getInput('override_build');
  const overrideBuildUrl = core.getInput('override_build_url');
  const overrideCommit = core.getInput('override_commit');
  const overridePr = core.getInput('override_pr');
  const reportCode = core.getInput('report_code');
  const rootDir = core.getInput('root_dir');
  const searchDir = core.getInput('directory');
  const slug = core.getInput('slug');

  const uploadExecArgs = [];
  const uploadCommand = 'do-upload';

  if (disableSearch) {
    uploadExecArgs.push('--disable-search');
  }
  if (dryRun) {
    uploadExecArgs.push('-d');
  }
  if (envVars.length) {
    uploadExecArgs.push('-e', envVars.join(','));
  }
  if (exclude) {
    uploadExecArgs.push('--exclude', `${exclude}`);
  }
  if (failCi) {
    uploadExecArgs.push('-Z');
  }
  if (file) {
    uploadExecArgs.push('-f', `${file}`);
  }
  if (files) {
    files.split(',').map((f) => f.trim()).forEach((f) => {
      if (f) {
        uploadExecArgs.push('-f', `${f}`);
      }
    });
  }
  if (flags) {
    flags.split(',').map((f) => f.trim()).forEach((f) => {
      if (f) {
        uploadExecArgs.push('-F', `${f}`);
      }
    });
  }
  if (handleNoReportsFound) {
    uploadExecArgs.push('--handle-no-reports-found');
  }
  if (name) {
    uploadExecArgs.push('-n', `${name}`);
  }
  if (overrideBranch) {
    uploadExecArgs.push('-B', `${overrideBranch}`);
  }
  if (overrideBuild) {
    uploadExecArgs.push('-b', `${overrideBuild}`);
  }
  if (overrideBuildUrl) {
    uploadExecArgs.push('--build-url', `${overrideBuildUrl}`);
  }
  if (overrideCommit) {
    uploadExecArgs.push('-C', `${overrideCommit}`);
  } else if (
    `${context.eventName}` == 'pull_request' ||
    `${context.eventName}` == 'pull_request_target'
  ) {
    uploadExecArgs.push('-C', `${context.payload.pull_request.head.sha}`);
  }
  if (overridePr) {
    uploadExecArgs.push('-P', `${overridePr}`);
  } else if (
    `${context.eventName}` == 'pull_request_target'
  ) {
    uploadExecArgs.push('-P', `${context.payload.number}`);
  }
  if (reportCode) {
    uploadExecArgs.push('--report-code', `${reportCode}`);
  }
  if (rootDir) {
    uploadExecArgs.push('--network-root-folder', `${rootDir}`);
  }
  if (searchDir) {
    uploadExecArgs.push('-s', `${searchDir}`);
  }
  if (slug) {
    uploadExecArgs.push('-r', `${slug}`);
  }

  uploadExecArgs.push('--report-type', 'test_results');

  return {
    uploadExecArgs,
    uploadCommand,
  };
};

const buildExecutionEnvironment = (token: string, envVars) => {
  const uploadOptions: any = {};
  uploadOptions.env = Object.assign(process.env, {
    GITHUB_ACTION: process.env.GITHUB_ACTION,
    GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
    GITHUB_REF: process.env.GITHUB_REF,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_SHA: process.env.GITHUB_SHA,
    GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF || '',
  });

  for (const envVar of envVars) {
    uploadOptions.env[envVar] = process.env[envVar];
  }

  if (token) {
    uploadOptions.env.CODECOV_TOKEN = token;
  }

  const workingDir = core.getInput('working-directory');
  if (workingDir) {
    uploadOptions.cwd = workingDir;
  }

  return uploadOptions;
};

const getToken = async (): Promise<string> => {
  let token = core.getInput('token');
  let url = core.getInput('url');
  const useOIDC = isTrue(core.getInput('use_oidc'));
  const isFromFork = isPullRequestFromFork();
  if (useOIDC && !isFromFork) {
    if (!url) {
      url = 'https://codecov.io';
    }
    try {
      token = await core.getIDToken(url);
      return Promise.resolve(token);
    } catch (err) {
      setFailure(
          `Codecov: Failed to get OIDC token with url: ${url}. ${err.message}`,
          true,
      );
    }
  }
  return token;
};

const buildExecutionOptions = async (failCi: boolean, verbose: boolean) => {
  const token = await getToken();
  const envVars = core.getInput('env_vars');
  const cleanedEnvVars = cleanEnvVars(envVars);

  const generalArgs = buildGeneralArgs(verbose);
  const {uploadExecArgs, uploadCommand} =
    buildUploadArgs(token, cleanedEnvVars, failCi);
  const executionEnvironment = buildExecutionEnvironment(token, cleanedEnvVars);

  return {generalArgs, uploadCommand, uploadExecArgs, executionEnvironment};
};

export {
  buildDownloadOptions,
  buildExecutionOptions,
};
