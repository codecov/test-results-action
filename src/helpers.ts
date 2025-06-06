import * as core from '@actions/core';

const PLATFORMS = [
  'linux',
  'macos',
  'windows',
  'alpine',
  'linux-arm64',
  'alpine-arm64',
];

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

const setFailure = (message: string, failCi: boolean): void => {
  failCi ? core.setFailed(message) : core.warning(message);
  if (failCi) {
    process.exit();
  }
};

const getUploaderName = (platform: string): string => {
  if (isWindows(platform)) {
    return 'codecov.exe';
  } else {
    return 'codecov';
  }
};

const isValidPlatform = (platform: string): boolean => {
  return PLATFORMS.includes(platform);
};

const isWindows = (platform: string): boolean => {
  return platform === 'windows';
};

const getPlatform = (os?: string): string => {
  if (isValidPlatform(os)) {
    core.info(`==> ${os} OS provided`);
    return os;
  }

  let platform = process.env.RUNNER_OS?.toLowerCase();

  // handle arm64
  const arch = process.env.RUNNER_ARCH?.toLowerCase();
  // macos version is universal, so we don't need to add -arm64
  if (arch === 'arm64' && platform !== 'macos') {
    platform += '-arm64';
  }

  if (isValidPlatform(platform)) {
    core.info(`==> ${platform} OS detected`);
    return platform;
  }

  core.info(
      '==> Could not detect OS or provided OS is invalid. Defaulting to linux',
  );
  return 'linux';
};

const getBaseUrl = (platform: string, version: string): string => {
  return `https://cli.codecov.io/${version}/${platform}/${getUploaderName(platform)}`;
};

const getCommand = (
    filename: string,
    generalArgs: string[],
    command: string,
): string[] => {
  const fullCommand = [filename, ...generalArgs, command];
  core.info(`==> Running command '${fullCommand.join(' ')}'`);
  return fullCommand;
};

export {
  PLATFORMS,
  isTrue,
  getBaseUrl,
  getPlatform,
  getUploaderName,
  isValidPlatform,
  isWindows,
  setFailure,
  getCommand,
};
