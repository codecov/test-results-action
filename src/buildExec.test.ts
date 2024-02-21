import {
  buildUploadExec,
} from './buildExec';

test('upload args', () => {
  const envs = {
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
  for (const env of Object.keys(envs)) {
    process.env['INPUT_' + env.toUpperCase()] = envs[env];
  }

  const {uploadExecArgs, uploadCommand} = buildUploadExec();
  const expectedArgs = [
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

  expect(uploadExecArgs).toEqual(expectedArgs);
  expect(uploadCommand).toEqual('do-upload');
  for (const env of Object.keys(envs)) {
    delete process.env['INPUT_' + env.toUpperCase()];
  }
});
