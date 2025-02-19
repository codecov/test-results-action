import {
  buildDownloadOptions,
  buildExecutionOptions,
} from './buildExec';

const inputEnvs = {
  'codecov_yml_path': 'dev/codecov.yml',
  'commit_parent': 'fakeparentcommit',
  'directory': 'coverage/',
  'disable_search': 'true',
  'dry_run': 'true',
  'env_vars': 'OS,PYTHON',
  'exclude': 'node_modules/',
  'fail_ci_if_error': 'true',
  'file': 'coverage.xml',
  'files': 'dir1/coverage.xml,dir2/coverage.xml',
  'flags': 'test,test2',
  'handle_no_reports_found': 'true',
  'name': 'codecov',
  'os': 'macos',
  'override_branch': 'thomasrockhu/test',
  'override_build': '1',
  'override_build_url': 'https://example.com/build/2',
  'override_commit': '9caabca5474b49de74ef5667deabaf74cdacc244',
  'override_pr': '2',
  'report_code': 'testCode',
  'root_dir': 'root/',
  'slug': 'fakeOwner/fakeRepo',
  'token': 'd3859757-ab80-4664-924d-aef22fa7557b',
  'url': 'https://enterprise.example.com',
  'verbose': 'true',
  'version': '0.1.2',
  'working-directory': 'src',
};

describe('setting up cli invocation', () => {
  const OLD_ENV = {...process.env};

  beforeEach(() => {
    jest.resetModules();
    for (const env of Object.keys(inputEnvs)) {
      process.env['INPUT_' + env.toUpperCase()] = inputEnvs[env];
    }
    process.env.OS = 'macos';
    process.env.PYTHON = '3.13';
    process.env.GITHUB_ACTION = 'action';
    process.env.GITHUB_RUN_ID = 'run_id';
    process.env.GITHUB_REF = 'ref';
    process.env.GITHUB_REPOSITORY = 'codecov/test-results-action';
    process.env.GITHUB_SHA = 'sha';
    process.env.GITHUB_HEAD_REF = 'head_ref';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('download options', () => {
    const {platform, uploaderName, uploaderVersion} = buildDownloadOptions();
    expect(platform).toEqual('macos');
    expect(uploaderName).toEqual('codecov');
    expect(uploaderVersion).toEqual('0.1.2');
  });

  test('execution options', () => {
    const failCi = true;
    const verbose = false;
    const {generalArgs, uploadCommand, uploadExecArgs, executionEnvironment} =
        buildExecutionOptions(failCi, verbose);

    expect(uploadCommand).toEqual('do-upload');

    const expectedGeneralArgs = [
      '--codecov-yml-path',
      'dev/codecov.yml',
      '--enterprise-url',
      'https://enterprise.example.com',
    ];
    expect(generalArgs).toEqual(expectedGeneralArgs);

    const expectedUploadExecArgs = [
      '--disable-search',
      '-d',
      '-e',
      'OS,PYTHON',
      '--exclude',
      'node_modules/',
      '-Z',
      '-f',
      'coverage.xml',
      '-f',
      'dir1/coverage.xml',
      '-f',
      'dir2/coverage.xml',
      '-F',
      'test',
      '-F',
      'test2',
      '--handle-no-reports-found',
      '-n',
      'codecov',
      '-B',
      'thomasrockhu/test',
      '-b',
      '1',
      '--build-url',
      'https://example.com/build/2',
      '-C',
      '9caabca5474b49de74ef5667deabaf74cdacc244',
      '-P',
      '2',
      '--report-code',
      'testCode',
      '--network-root-folder',
      'root/',
      '-s',
      'coverage/',
      '-r',
      'fakeOwner/fakeRepo',
      '--report-type',
      'test_results',
    ];
    expect(uploadExecArgs).toEqual(expectedUploadExecArgs);

    const expectedExecutionEnvironment = {
      'cwd': 'src',
      'env': expect.objectContaining({
        'CODECOV_TOKEN': 'd3859757-ab80-4664-924d-aef22fa7557b',
        'OS': 'macos',
        'PYTHON': '3.13',
        'GITHUB_ACTION': 'action',
        'GITHUB_RUN_ID': 'run_id',
        'GITHUB_REF': 'ref',
        'GITHUB_REPOSITORY': 'codecov/test-results-action',
        'GITHUB_SHA': 'sha',
        'GITHUB_HEAD_REF': 'head_ref',
      }),
    };
    expect(executionEnvironment).toEqual(expectedExecutionEnvironment);
  });
});
