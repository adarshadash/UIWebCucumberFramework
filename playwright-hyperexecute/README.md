# Playwright range-slider test on HyperExecute

The test opens the TestMu AI (LambdaTest) Selenium Playground
[range sliders demo](https://www.testmuai.com/selenium-playground/drag-drop-range-sliders-demo/),
drags the **"Default value 15"** slider to **95**, and checks that the page shows 95.
It runs in parallel on Windows and Linux, in Chrome and Firefox, on the HyperExecute grid.

| File | Purpose |
|---|---|
| `tests/rangeSlider.spec.ts` | The test. Reads its inputs from environment variables. |
| `playwright.config.ts` | Browser projects (`chrome`, `chromium`, `firefox`); writes reports, videos, screenshots and traces |
| `hyperexecute.yaml` | HyperExecute job: matrix, env vars, secrets, cache, pre/post steps, artifacts |
| `../.github/workflows/hyperexecute.yml` | Optional: GitHub Actions pipeline that starts the HyperExecute job |

## 1. Run locally first
```bash
cd playwright-hyperexecute
npm install
npx playwright install chromium firefox
npx playwright test --project=chromium      # or --project=chrome if Google Chrome is installed
npx playwright show-report
```

## 2. One-time HyperExecute setup
1. Log in to LambdaTest / TestMu AI and copy your **Username** and **Access Key** (Profile → Account Settings → Password & Security).
2. **Secret Management:** in the HyperExecute dashboard, open **Secrets** and add a secret named `DEMO_API_TOKEN` with any value.
   `hyperexecute.yaml` reads it with `${{ .secrets.DEMO_API_TOKEN }}`. The value is never stored in git and is masked in logs.
   Use the same mechanism for real passwords or API tokens.
3. Download the HyperExecute CLI into this folder:
   - Linux: `curl -O https://downloads.lambdatest.com/hyperexecute/linux/hyperexecute && chmod +x hyperexecute`
   - macOS: `curl -O https://downloads.lambdatest.com/hyperexecute/darwin/hyperexecute && chmod +x hyperexecute`
   - Windows: download `https://downloads.lambdatest.com/hyperexecute/windows/hyperexecute.exe`

## 3. Run on HyperExecute
```bash
./hyperexecute --user <LT_USERNAME> --key <LT_ACCESS_KEY> --config hyperexecute.yaml
```
The CLI uploads this folder and prints a dashboard link for the job.

## 4. Where each requirement lives in `hyperexecute.yaml`
| Requirement | YAML keys | What happens |
|---|---|---|
| Parallel on ≥2 browser/OS combinations | `runson: ${matrix.os}`, `matrix` (`os: [win, linux]`, `browser: [chrome, firefox]`), `concurrency: 4`, `testSuites: npx playwright test --project=$browser` | 4 tasks run at the same time: Win+Chrome, Win+Firefox, Linux+Chrome, Linux+Firefox |
| Artifacts Management | `uploadArtefacts`, `mergeArtifacts: true`, `report` + `partialReports` | HTML reports, videos, screenshots, traces and the JUnit XML from every VM are uploaded and merged into one downloadable archive per artifact on the job's **Artifacts** tab, plus a consolidated report |
| Secret Management | `DEMO_API_TOKEN: ${{ .secrets.DEMO_API_TOKEN }}` under `env` | The secret is injected at runtime. The test logs only whether it was present. |
| Injecting environment variables | `env:` (`SLIDER_URL`, `SLIDER_LABEL`, `START_VALUE`, `TARGET_VALUE`) | Change a value in the YAML to retarget the test without code changes, e.g. `SLIDER_LABEL: Default value 30`, `START_VALUE: "30"`, `TARGET_VALUE: "60"` |
| Pre steps + dependency caching | `pre:` (`npm install`, `npx playwright install …`), `cacheKey: '{{ checksum "package-lock.json" }}'`, `cacheDirectories: [node_modules]` | Dependencies install before the tests. `node_modules` is restored from the cache on later runs until `package-lock.json` changes. |
| Post steps (optional) | `post:` | Runs after the tests on each VM (prints versions and platform) |

## 5. Trigger from GitHub Actions (optional)
1. In GitHub, go to **Settings → Secrets and variables → Actions** and add `LT_USERNAME` and `LT_ACCESS_KEY`.
2. The workflow `.github/workflows/hyperexecute.yml` runs on pushes to `main` that touch this folder, on pull requests, and manually from **Actions → HyperExecute - Playwright → Run workflow**.
3. It downloads the CLI and runs the same command as step 3. The job link appears in the workflow log, and the CLI log is uploaded as a workflow artifact.

## Notes
- HyperExecute's `win` runner is Windows (Windows 10 or 11, depending on your account's VM pool) with the latest Chrome installed. The `chrome` project uses that installed Chrome through `channel: 'chrome'`.
- If a YAML key is rejected, check it against HyperExecute's YAML docs or the YAML validator in the dashboard. Key names occasionally change between CLI versions.
