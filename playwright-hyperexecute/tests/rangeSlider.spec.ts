import { test, expect, Locator, Page } from '@playwright/test';

// Injected environment variables (set in hyperexecute.yaml `env:` or locally)
const URL =
  process.env.SLIDER_URL ??
  'https://www.testmuai.com/selenium-playground/drag-drop-range-sliders-demo/';
const SLIDER_LABEL = process.env.SLIDER_LABEL ?? 'Default value 15';
const START_VALUE = process.env.START_VALUE ?? '15';
const TARGET_VALUE = Number(process.env.TARGET_VALUE ?? 95);

/** Drags a range slider's thumb to `target`, then fine-tunes with the keyboard if the
 *  pixel drag lands a step or two off (thumb width / sub-pixel rounding). */
async function dragSliderTo(page: Page, slider: Locator, target: number) {
  const box = await slider.boundingBox();
  if (!box) throw new Error('Slider is not visible');

  const min = Number((await slider.getAttribute('min')) ?? 0);
  const max = Number((await slider.getAttribute('max')) ?? 100);
  const current = Number(await slider.inputValue());

  const xFor = (v: number) => box.x + ((v - min) / (max - min)) * box.width;
  const y = box.y + box.height / 2;

  await page.mouse.move(xFor(current), y);
  await page.mouse.down();
  await page.mouse.move(xFor(target), y, { steps: 20 });
  await page.mouse.up();

  for (let i = 0; i < 10; i++) {
    const v = Number(await slider.inputValue());
    if (v === target) break;
    await slider.press(v < target ? 'ArrowRight' : 'ArrowLeft');
  }
}

test(`Drag "${SLIDER_LABEL}" slider to ${TARGET_VALUE} and verify the displayed value`, async ({ page }, testInfo) => {
  // Secret Management demo: the value comes from HyperExecute secrets, never from the repo.
  // Only its presence is logged; the value itself is masked by HyperExecute.
  testInfo.annotations.push({
    type: 'secret',
    description: process.env.DEMO_API_TOKEN ? 'DEMO_API_TOKEN injected' : 'DEMO_API_TOKEN not set',
  });
  console.log(`[env] browser=${testInfo.project.name} os=${process.env.TARGET_OS ?? process.platform} target=${TARGET_VALUE}`);

  await page.goto(URL);

  const section = page.locator('div', {
    has: page.getByRole('heading', { name: SLIDER_LABEL, exact: true }),
  }).last();
  const slider = section.locator('input[type="range"]');
  const output = section.locator('output');

  await expect(slider).toBeVisible();
  await expect(slider).toHaveValue(START_VALUE);
  await expect(output).toHaveText(START_VALUE);

  await dragSliderTo(page, slider, TARGET_VALUE);

  await expect(slider).toHaveValue(String(TARGET_VALUE));
  await expect(output).toHaveText(String(TARGET_VALUE));

  await testInfo.attach('final-state', { body: await page.screenshot(), contentType: 'image/png' });
});
