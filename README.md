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
    token: ${{ secrets.CODECOV_GITHUB_TOKEN }} # optional (default = false)
    verbose: true # optional (default = false)
```

### IMPORTANT NOTES
It's important that this action only runs once during your CI, as every run of the action will overwrite the comment left by the previous run.

If you are generating test result reports in many jobs/steps then the upload-artifact will be essential. Using this action you can temporarily store reports,
and download them for later use. In our case, we can generate as many reports as we'd like and store them, and at the end of CI we can download them all and
use the test results action. Here's an example of what this would look like for a CI workflow that uses multiple jobs and the matrix strategy to generate multiple
test reports. It's crucial that both the name of the artifact and name of the files are unique. 

You can find the repository for the upload-artifact [here](https://github.com/actions/upload-artifact).

It is also important that the test-results-action has access to a github token with permissions to write to pull requests. This can easily be done by giving the
default GITHUB_TOKEN generated for the action permission to write to pull requests. This can be done by adding the following.

```yaml
permissions:
  pull-requests: write
```

The docs for permissions for github actions are [here](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs).

```yaml
name: Example workflow
on: [pull_request]

jobs:
  frontend:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - name: Run tests
        run: npx vitest --reporter=junit

      - name: Store results
        uses: actions/upload-artifact@v4
        with:
          name: codecov-frontend-junit-${{ matrix.os }}
          path: frontend-${{ matrix.os }}-junit.xml
  backend:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - name: Run tests
        run: pytest --junit-xml=backend-${{ matrix.os }}-junit.xml
      - name: Store results
        uses: actions/upload-artifact@v4
        with:
          name: codecov-backend-junit-${{ matrix.os }}
          path: backend-${{ matrix.os }}-junit.xml

  results:
    permissions:
      pull-requests: write
    runs-on: ubuntu-latest
    needs: [frontend, backend]
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          pattern: codecov-*-junit-*
          merge-multiple: true
          path: artifact
      - name: Process test results
        uses: codecov/test-results-action@v0
        with:
          directory: artifact
```

## Arguments

Codecov's Action supports inputs from the user. These inputs, along with their descriptions and usage contexts, are listed in the table below:

| Input  | Description | Required |
| :---       |     :---     |    :---:   |
| `token` | Github token to use to authenticate with the Github API to post/edit comments | Optional 
| `directory` | Directory to search for test result reports. | Optional 
| `disable_search` | Disable search for test result files. This is helpful when specifying what files you want to upload with the --file option. | Optional 
| `exclude` | Folders to exclude from search | Optional 
| `fail_ci_if_error` | Specify whether or not CI build should fail if Codecov runs into an error during upload | Optional 
| `file` | Path to test result file to upload | Optional 
| `files` | Comma-separated list of files to upload | Optional 
| `handle_no_reports_found` | Raise no exceptions when no test result reports found | Optional 
| `os` | Override the assumed OS. Options are linux \| macos \| windows \| . | Optional 
| `root_dir` | Used when not in git/hg project to identify project root directory | Optional 
| `verbose` | Specify whether the Codecov output should be verbose | Optional 
| `version` | Specify which version of the Codecov CLI should be used. Defaults to `latest` | Optional 
| `working-directory` | Directory in which to execute codecov.sh | Optional 