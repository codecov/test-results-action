import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';

import * as core from '@actions/core';
import * as exec from '@actions/exec';

import {
  buildDownloadOptions,
  buildExecutionOptions,
} from './buildExec';
import {
  isTrue,
  getBaseUrl,
  setFailure,
  getCommand,
} from './helpers';

import verify from './validate';
import versionInfo from './version';

let failCi;

const invokeCLI = async (
    filename: string,
    failCi: boolean,
    verbose: boolean,
) => {
  const {generalArgs, uploadCommand, uploadExecArgs, executionEnvironment} =
      buildExecutionOptions(failCi, verbose);

  const doUploadTestResults = async () => {
    await exec.exec(
        getCommand(filename, generalArgs, uploadCommand).join(' '),
        uploadExecArgs,
        executionEnvironment,
    );
  };


  const runCmd = async (fn, fnName) => {
    await fn().catch(
        (err) => {
          setFailure(
              `Codecov: Failed to properly ${fnName}: ${err.message}`,
              failCi,
          );
        },
    );
  };

  const runCommands = async () => {
    await runCmd(doUploadTestResults, 'upload report');
  };

  await runCommands();
};

const downloadAndInvokeCLI = (failCi: boolean, verbose: boolean) => {
  const {platform, uploaderName, uploaderVersion} = buildDownloadOptions();
  const filename = path.join(__dirname, uploaderName);

  https.get(getBaseUrl(platform, uploaderVersion), (res) => {
    const filePath = fs.createWriteStream(filename);
    res.pipe(filePath);
    filePath
        .on('error', (err) => {
          setFailure(
              `Codecov: Failed to write uploader binary: ${err.message}`,
              true,
          );
        }).on('finish', async () => {
          filePath.close();

          await verify(filename, platform, uploaderVersion, verbose, failCi);
          await versionInfo(platform, uploaderVersion);
          await fs.chmodSync(filename, '777');

          const unlink = () => {
            fs.unlink(filename, (err) => {
              if (err) {
                setFailure(
                    `Codecov: Could not unlink uploader: ${err.message}`,
                    failCi,
                );
              }
            });
          };

          await invokeCLI(filename, failCi, verbose);
          unlink();
        });
  });
};

try {
  const failCi = isTrue(core.getInput('fail_ci_if_error'));
  const binaryPath = core.getInput('binary');
  const verbose = isTrue(core.getInput('verbose'));

  if (binaryPath) {
    invokeCLI(binaryPath, failCi, verbose).catch((err) => {
      setFailure(
          `Codecov: Encountered an unexpected error ${err.message}`,
          failCi,
      );
    });
  } else {
    downloadAndInvokeCLI(failCi, verbose);
  }
} catch (err) {
  setFailure(`Codecov: Encountered an unexpected error ${err.message}`, failCi);
}
