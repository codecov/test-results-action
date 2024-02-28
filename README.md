## Usage

Currently, the Action will identify linux, macos, and windows runners. However, the Action may misidentify other architectures. The OS can be specified as
- alpine
- alpine-arm64
- linux
- linux-arm64
- macos
- windows

Inside your `.github/workflows/workflow.yml` file:

```yaml
steps:
- uses: actions/checkout@master
- uses: codecov/test-results-action@v0
  with:
    fail_ci_if_error: true # optional (default = false)
    files: ./junit1.xml,./junit2.xml # optional
    flags: py3.11 # optional
    name: codecov-umbrella # optional
    token: ${{ secrets.CODECOV_TOKEN }} # required
    verbose: true # optional (default = false)
```

The Codecov token can also be passed in via environment variables:

```yaml
steps:
- uses: actions/checkout@master
- uses: codecov/test-results-action@v0
  with:
    fail_ci_if_error: true # optional (default = false)
    files: ./junit1.xml,./junit2.xml # optional
    flags: python3.10 # optional
    name: codecov-umbrella # optional
    verbose: true # optional (default = false)
  env:
    CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```
>**Note**: This assumes that you've set your Codecov token inside *Settings > Secrets* as `CODECOV_TOKEN`. If not, you can [get an upload token](https://docs.codecov.io/docs/frequently-asked-questions#section-where-is-the-repository-upload-token-found-) for your specific repo on [codecov.io](https://www.codecov.io). Keep in mind that secrets are *not* available to forks of repositories.

## Arguments

Codecov's Action supports inputs from the user. These inputs, along with their descriptions and usage contexts, are listed in the table below:

| Input  | Description | Required |
| :---       |     :---     |    :---:   |
| `token` | Repository Codecov token. Used to authorize report uploads | *Required 
| `codecov_yml_path` | Specify the path to the Codecov YML | Optional 
| `commit_parent` | Override to specify the parent commit SHA | Optional 
| `directory` | Directory to search for test result reports. | Optional 
| `disable_search` | Disable search for test result files. This is helpful when specifying what files you want to upload with the --file option. | Optional 
| `dry_run` | Don't upload files to Codecov | Optional 
| `env_vars` | Environment variables to tag the upload with (e.g. PYTHON \| OS,PYTHON) | Optional 
| `exclude` | Folders to exclude from search | Optional 
| `fail_ci_if_error` | Specify whether or not CI build should fail if Codecov runs into an error during upload | Optional 
| `file` | Path to test result file to upload | Optional 
| `files` | Comma-separated list of files to upload | Optional 
| `flags` | Flag upload to group test results (e.g. py3.10 | py3.11 | py3.12) | Optional 
| `handle_no_reports_found` | Raise no exceptions when no test result reports found | Optional 
| `name` | User defined upload name. Visible in Codecov UI | Optional 
| `os` | Override the assumed OS. Options are linux \| macos \| windows \| . | Optional 
| `override_branch` | Specify the branch name | Optional 
| `override_build` | Specify the build number | Optional 
| `override_build_url` | The URL of the build where this is running | Optional 
| `override_commit` | Specify the commit SHA | Optional 
| `override_pr` | Specify the pull request number | Optional 
| `report_code` | The code of the report. If unsure, do not include | Optional 
| `root_dir` | Used when not in git/hg project to identify project root directory | Optional 
| `slug` | Specify the slug manually (Enterprise use) | Optional 
| `url` | Specify the base url to upload (Enterprise use) | Optional 
| `verbose` | Specify whether the Codecov output should be verbose | Optional 
| `version` | Specify which version of the Codecov CLI should be used. Defaults to `latest` | Optional 
| `working-directory` | Directory in which to execute codecov.sh | Optional 

### Example `workflow.yml` with Codecov Action

```yaml
name: Example workflow for Codecov
on: [push]
jobs:
  run:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    env:
      OS: ${{ matrix.os }}
      PYTHON: '3.10'
    steps:
    - uses: actions/checkout@master
    - name: Setup Python
      uses: actions/setup-python@master
      with:
        python-version: 3.10
    - name: Generate coverage and test result report
      run: |
        pip install pytest
        pip install pytest-cov
        pytest --cov=./ --cov-report=xml --junitxml=./junit.xml
    - name: Upload test results to Codecov
      if: ${{ !cancelled() }}
      uses: codecov/test-results-action@v1
      with:
        files: ./junit.xml,!./cache
        flags: python3.10
        name: codecov-umbrella-test-results
        token: ${{ secrets.CODECOV_TOKEN }}
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        directory: ./coverage/reports/
        env_vars: OS,PYTHON
        fail_ci_if_error: true
        files: ./coverage1.xml,./coverage2.xml,!./cache
        flags: unittests
        name: codecov-umbrella
        token: ${{ secrets.CODECOV_TOKEN }}
        verbose: true
```
