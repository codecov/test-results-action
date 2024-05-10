import * as fs from 'fs';
import * as path from 'path';
import {pipeline} from 'stream/promises';
import {ReadableStream} from 'stream/web';


import * as exec from '@actions/exec';

import {
  buildGeneralExec,
  buildUploadExec,
} from './buildExec';
import {
  getBaseUrl,
  getPlatform,
  getUploaderName,
  setFailure,
  getCommand,
} from './helpers';

import verify from './validate';
import versionInfo from './version';

let failCi;

try {
  const {
    uploadExecArgs,
    uploadOptions,
    failCi,
    os,
    uploaderVersion,
    uploadCommand,
  } = buildUploadExec();
  const {args, verbose} = buildGeneralExec();

  const platform = getPlatform(os);

  const filename = path.join(__dirname, getUploaderName(platform));

  const fileWriteStream = fs.createWriteStream(filename, {
    flags: 'w',
  });

  try {
    const res = await fetch(getBaseUrl(platform, uploaderVersion));
    await pipeline(res.body as ReadableStream, fileWriteStream);
  } catch (err) {
    setFailure(
        `Codecov: Failed to write uploader binary: ${err.message}`,
        true,
    );
  }

  fileWriteStream.close();

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


  const doUploadTestResults = async () => {
    await exec.exec(
        getCommand(filename, args, uploadCommand).join(' '),
        uploadExecArgs,
        uploadOptions,
    );
  };


  const runCmd = async (fn, fnName) => {
    await fn().catch(
        (err) => {
          setFailure(
              `Codecov: 
                Failed to properly ${fnName}: ${err.message}`,
              failCi,
          );
        },
    );
  };

  const runCommands = async () => {
    await runCmd(doUploadTestResults, 'upload test result files');
  };


  await runCommands();
  unlink();
} catch (err) {
  setFailure(`Codecov: Encountered an unexpected error ${err.message}`, failCi);
}
