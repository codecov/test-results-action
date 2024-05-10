/* eslint-disable  @typescript-eslint/no-explicit-any */

import * as core from '@actions/core';


const isTrue = (variable) => {
  const lowercase = variable.toLowerCase();
  return (
    lowercase === '1' ||
    lowercase === 't' ||
    lowercase === 'true' ||
    lowercase === 'y' ||
    lowercase === 'yes'
  );
};


const buildGeneralExec = () => {
  const url = core.getInput('url');
  const verbose = isTrue(core.getInput('verbose'));
  const args = [];

  if (url) {
    args.push('--enterprise-url', `${url}`);
  }
  if (verbose) {
    args.push('-v');
  }
  return {args, verbose};
};

const buildUploadExec = () => {
  const token = core.getInput('token');
  const disableSearch = isTrue(core.getInput('disable_search'));
  const dryRun = isTrue(core.getInput('dry_run'));
  const envVars = core.getInput('env_vars');
  const exclude = core.getInput('exclude');
  const failCi = isTrue(core.getInput('fail_ci_if_error'));
  const file = core.getInput('file');
  const files = core.getInput('files');
  const handleNoReportsFound = isTrue(core.getInput('handle_no_reports_found'));
  const os = core.getInput('os');
  const rootDir = core.getInput('root_dir');
  const searchDir = core.getInput('directory');
  let uploaderVersion = core.getInput('version');
  const workingDir = core.getInput('working-directory');

  const uploadExecArgs = [];
  const uploadCommand = 'process-test-results';
  const uploadOptions:any = {};
  uploadOptions.env = Object.assign(process.env, {
    GITHUB_ACTION: process.env.GITHUB_ACTION,
    GITHUB_RUN_ID: process.env.GITHUB_RUN_ID,
    GITHUB_REF: process.env.GITHUB_REF,
    GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
    GITHUB_SHA: process.env.GITHUB_SHA,
    GITHUB_HEAD_REF: process.env.GITHUB_HEAD_REF || '',
  });

  const envVarsArg = [];
  for (const envVar of envVars.split(',')) {
    const envVarClean = envVar.trim();
    if (envVarClean) {
      uploadOptions.env[envVarClean] = process.env[envVarClean];
      envVarsArg.push(envVarClean);
    }
  }
  if (token) {
    uploadExecArgs.push('--provider-token', token);
  }
  if (disableSearch) {
    uploadExecArgs.push('--disable-search');
  }
  if (dryRun) {
    uploadExecArgs.push('-d');
  }
  if (envVarsArg.length) {
    uploadExecArgs.push('-e', envVarsArg.join(','));
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
      uploadExecArgs.push('-f', `${f}`);
    });
  }
  if (handleNoReportsFound) {
    uploadExecArgs.push('--handle-no-reports-found');
  }
  if (rootDir) {
    uploadExecArgs.push('--network-root-folder', `${rootDir}`);
  }
  if (searchDir) {
    uploadExecArgs.push('-s', `${searchDir}`);
  }
  if (workingDir) {
    uploadOptions.cwd = workingDir;
  }
  if (uploaderVersion == '') {
    uploaderVersion = 'latest';
  }


  return {
    uploadExecArgs,
    uploadOptions,
    failCi,
    os,
    uploaderVersion,
    uploadCommand,
  };
};


export {
  buildGeneralExec,
  buildUploadExec,
};
