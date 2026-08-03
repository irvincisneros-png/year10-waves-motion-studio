import { test, expect } from "@playwright/test";
import {
  BONUS_ROUTES,
  FORCE_ROUTES,
  COMPLETION_ROUTES,
  LIGHT_ROUTES,
  MOTION_ROUTES,
  OUTCOME_ROUTES,
  SHELL_ROUTES,
  SOUND_ROUTES,
  WAVES_ROUTES,
} from "./helpers";

const WIDTHS = [320, 375, 768, 1024, 1440];
const CLASSROOM_VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
];

test.describe("responsive layout", () => {
  for (const width of WIDTHS) {
    test(`no horizontal overflow and nav reachable at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });

      for (const route of [
        ...SHELL_ROUTES,
        ...OUTCOME_ROUTES,
        ...WAVES_ROUTES,
        ...SOUND_ROUTES,
        ...LIGHT_ROUTES,
        ...MOTION_ROUTES,
        ...FORCE_ROUTES,
        ...COMPLETION_ROUTES,
        ...BONUS_ROUTES,
      ]) {
        await page.goto(route.url);
        await expect(
          page.getByRole("heading", { level: 1, name: route.heading }),
        ).toBeVisible();

        // The document itself must not scroll horizontally…
        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );
        expect(
          overflow,
          `${route.path} overflows at ${width}px`,
        ).toBeLessThanOrEqual(0);

        // …and that must not be achieved by masking with overflow-x: hidden.
        const masked = await page.evaluate(() => {
          const html = getComputedStyle(document.documentElement).overflowX;
          const body = getComputedStyle(document.body).overflowX;
          return { html, body };
        });
        expect(masked.html).not.toBe("hidden");
        expect(masked.body).not.toBe("hidden");

        // Minimal primary gallery route stays available at every width.
        const nav = page.getByRole("navigation", { name: "Primary" });
        await expect(
          nav.getByRole("link", { name: "All simulators", exact: true }),
        ).toBeVisible();
      }
    });
  }

  test("interactive targets meet the 44px minimum at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/#/progress");
    for (const name of ["Export anonymous summary (JSON)", "Reset all progress"]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
    const settingsBox = await page
      .getByRole("button", { name: "Settings" })
      .boundingBox();
    expect(settingsBox!.height).toBeGreaterThanOrEqual(44);
  });

  test("wave-lab interactive targets meet the 44px minimum at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/#/waves/measure");
    for (const name of [/^1 Predict/, /^2 Investigate/, /^3 Explain/, /^4 Submit/]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      expect(box, `${String(name)} has a bounding box`).not.toBeNull();
      expect(box!.height, `${String(name)} height`).toBeGreaterThanOrEqual(44);
    }

    await page.getByRole("button", { name: /^2 Investigate/ }).click();
    for (const name of [
      "1. Place ruler crest to crest",
      "2. Record this trial",
      "Reset investigation",
    ]) {
      const box = await page
        .getByRole("button", { name })
        .first()
        .boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
    const ruler = await page
      .getByRole("slider", { name: "Ruler tool" })
      .boundingBox();
    expect(ruler!.height).toBeGreaterThanOrEqual(44);

    await page.getByRole("button", { name: /^3 Explain/ }).click();
    const calculate = await page
      .getByRole("button", { name: "Calculate / check with v = fλ" })
      .boundingBox();
    expect(calculate).not.toBeNull();
    expect(calculate!.height).toBeGreaterThanOrEqual(44);
  });

  for (const viewport of CLASSROOM_VIEWPORTS) {
    test(`guided wave task keeps the current action visible at ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/#/waves/measure");

      await expect(page.getByRole("navigation", { name: "Investigation steps" })).toBeVisible();
      const hypothesis = await page.getByTestId("wave-hypothesis").boundingBox();
      expect(hypothesis).not.toBeNull();
      expect(hypothesis!.y + hypothesis!.height).toBeLessThanOrEqual(viewport.height);

      await page.getByRole("button", { name: /^2 Investigate/ }).click();
      const firstAction = await page.getByTestId("place-ruler").boundingBox();
      const secondAction = await page.getByTestId("add-trial").boundingBox();
      expect(firstAction).not.toBeNull();
      expect(secondAction).not.toBeNull();
      expect(firstAction!.y + firstAction!.height).toBeLessThanOrEqual(viewport.height);
      expect(secondAction!.y + secondAction!.height).toBeLessThanOrEqual(viewport.height);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }

  test("sound-lab interactive targets meet the 44px minimum at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/#/sound/pitch-loudness");
    for (const name of [
      "Reset pitch & loudness lab",
      "Add this setting to the trial table",
    ]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
    for (const name of [
      "Tone frequency",
      "Output level",
      "Oscilloscope time scale",
    ]) {
      const box = await page.getByRole("slider", { name }).boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
  });

  test("light-lab interactive targets meet the 44px minimum at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/#/light/properties");
    for (const name of [
      "Light source position",
      "Incident angle",
      "Atmospheric particle size",
    ]) {
      const box = await page.getByRole("slider", { name }).boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
    const reset = await page
      .getByRole("button", { name: "Reset light laboratory" })
      .boundingBox();
    expect(reset!.height).toBeGreaterThanOrEqual(44);
  });

  test("motion and forces targets meet the 44px minimum at 320px", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/#/motion/track");
    for (const name of [
      "Origin position",
      "Move positive 1 s",
      "Record current sample",
    ]) {
      const target =
        name === "Origin position"
          ? page.getByRole("slider", { name })
          : page.getByRole("button", { name });
      const box = await target.boundingBox();
      expect(box, `${name} has a bounding box`).not.toBeNull();
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(44);
    }
    await page.goto("/#/forces/cart");
    for (const name of ["Applied force", "Mass"]) {
      const box = await page.getByRole("slider", { name }).boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
    expect(
      (await page
        .getByRole("button", { name: "Run and record trial" })
        .boundingBox())!.height,
    ).toBeGreaterThanOrEqual(44);
  });

  test("native text and selection controls meet the 44px minimum on every route", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 320, height: 800 });
    for (const route of [
      ...SHELL_ROUTES,
      ...OUTCOME_ROUTES,
      ...WAVES_ROUTES,
      ...SOUND_ROUTES,
      ...LIGHT_ROUTES,
      ...MOTION_ROUTES,
      ...FORCE_ROUTES,
      ...COMPLETION_ROUTES,
      ...BONUS_ROUTES,
    ]) {
      await page.goto(route.url);
      const controls = page.locator(
        'select, textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]):not([type="file"])',
      );
      for (let index = 0; index < (await controls.count()); index++) {
        const control = controls.nth(index);
        if (!(await control.isVisible())) continue;
        const box = await control.boundingBox();
        expect(box, `${route.path} control ${index} has a box`).not.toBeNull();
        expect(box!.height, `${route.path} control ${index} target height`).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
