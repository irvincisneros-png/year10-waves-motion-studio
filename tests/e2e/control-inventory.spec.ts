import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  BONUS_ROUTES,
  COMPLETION_ROUTES,
  FORCE_ROUTES,
  LIGHT_ROUTES,
  MOTION_ROUTES,
  OUTCOME_ROUTES,
  SHELL_ROUTES,
  SOUND_ROUTES,
  WAVES_ROUTES,
} from './helpers';

const SHIPPED_ROUTES = [
  ...SHELL_ROUTES,
  ...OUTCOME_ROUTES,
  ...WAVES_ROUTES,
  ...SOUND_ROUTES,
  ...LIGHT_ROUTES,
  ...MOTION_ROUTES,
  ...FORCE_ROUTES,
  ...COMPLETION_ROUTES,
  ...BONUS_ROUTES,
];

const inventorySource = readFileSync(
  resolve(process.cwd(), 'CONTROL_INVENTORY.md'),
  'utf8',
);

const PRODUCT_CONTROL_NAMESPACE = /^(?:global|shell|bonus-wave-rider|outcome-7-1-[1-4]|wave-lab|em-spectrum|sound-lab|hearing|cultural-sound|ultrasound|optics|vision|astronomy|motion|forces|society|mastery|teacher|progress)\./;

/** Stable control IDs are documented as backtick-delimited workspace.control tokens. */
const DOCUMENTED_CONTROL_IDS = new Set(
  [...inventorySource.matchAll(/`([a-z][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*)`/g)]
    .map((match) => match[1])
    .filter((id) => PRODUCT_CONTROL_NAMESPACE.test(id)),
);

/**
 * These IDs intentionally identify a repeatable control family rather than one
 * DOM node. Route-specific specs exercise their add/remove behaviour and names.
 */
const REPEATABLE_CONTROL_IDS = new Set([
  'forces.delete-force-button',
  'forces.force-direction-select',
  'forces.force-magnitude-input',
  'forces.force-type-toggle',
  'motion.strobe-dot-editor',
  'optics.trial-delete-button',
]);

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="link"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Product controls must be explicitly mapped to an inventoried ID, either on
 * the control itself or on a semantic group that owns a repeatable family.
 * Ordinary in-content links remain covered by the accessible-name and route
 * suites; buttons and form controls may never escape the inventory this way.
 */
const INVENTORIED_PRODUCT_CONTROL_SELECTOR = [
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
].join(',');

test.describe('runtime control-inventory parity', () => {
  for (const route of SHIPPED_ROUTES) {
    test(`${route.path} has documented, unique runtime IDs and named controls`, async ({
      page,
    }) => {
      await page.goto(route.url);
      await expect(
        page.getByRole('heading', { level: 1, name: route.heading }),
      ).toBeVisible();

      const renderedIds = await page
        .locator('[data-control-id]')
        .evaluateAll((elements) =>
          elements.map((element) => element.getAttribute('data-control-id') ?? ''),
        );

      const malformedIds = renderedIds.filter(
        (id) => !/^[a-z][a-z0-9-]*\.[a-z0-9][a-z0-9.-]*$/.test(id),
      );
      expect(malformedIds, `malformed runtime IDs on ${route.path}`).toEqual([]);

      const undocumentedIds = [...new Set(renderedIds)].filter(
        (id) => !DOCUMENTED_CONTROL_IDS.has(id),
      );
      expect(undocumentedIds, `undocumented runtime IDs on ${route.path}`).toEqual([]);

      const counts = new Map<string, number>();
      for (const id of renderedIds) counts.set(id, (counts.get(id) ?? 0) + 1);
      const duplicateIds = [...counts]
        .filter(([id, count]) => count > 1 && !REPEATABLE_CONTROL_IDS.has(id))
        .map(([id, count]) => `${id} (${count})`);
      expect(duplicateIds, `duplicate non-repeatable IDs on ${route.path}`).toEqual([]);

      await expect(
        page.locator('[data-control-id^="cultural-sound."]'),
        `deferred cultural controls rendered on ${route.path}`,
      ).toHaveCount(0);

      const controls = page.locator(INTERACTIVE_SELECTOR);
      for (let index = 0; index < (await controls.count()); index += 1) {
        await expect(
          controls.nth(index),
          `interactive element ${index + 1} on ${route.path} has no accessible name`,
        ).toHaveAccessibleName(/\S/);
      }

      const ungroupedProductControls = await page
        .locator(INVENTORIED_PRODUCT_CONTROL_SELECTOR)
        .evaluateAll((elements) =>
          elements
            .filter((element) => !element.closest('[data-control-id]'))
            .map((element) => {
              const htmlElement = element as HTMLElement;
              const input = element as HTMLInputElement;
              return {
                name:
                  element.getAttribute('aria-label') ||
                  element.getAttribute('title') ||
                  htmlElement.innerText ||
                  input.value ||
                  element.tagName.toLowerCase(),
                testId: element.getAttribute('data-testid'),
                type: input.type || element.tagName.toLowerCase(),
              };
            }),
        );
      expect(
        ungroupedProductControls,
        `product controls outside the inventory on ${route.path}`,
      ).toEqual([]);
    });
  }

  test('the deferred cultural route remains absent', async ({ page }) => {
    await page.goto('/#/sound/cultural-materials');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeVisible();
    await expect(page.locator('[data-control-id^="cultural-sound."]')).toHaveCount(0);
  });
});
