import { expect, test } from "@playwright/test";
import { FORCE_ROUTES, MOTION_ROUTES } from "./helpers";

test.describe("Stage 5 routes and availability", () => {
  for (const route of [...MOTION_ROUTES, ...FORCE_ROUTES]) {
    test(`cold load and refresh work for ${route.path}`, async ({ page }) => {
      await page.goto(route.url);
      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      await page.reload();
      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();
    });
  }

  test("outcome gallery exposes real Motion, Forces and Stage 6 models", async ({
    page,
  }) => {
    await page.goto("/#/");
    await expect(
      page.getByRole("link", { name: /Open existing model for outcome 7\.4\.1/ }),
    ).toHaveAttribute("href", "#/motion/track");
    await expect(
      page.getByRole("link", { name: /Open existing model for outcome 7\.4\.4/ }),
    ).toHaveAttribute("href", "#/forces/cart");
    await expect(
      page.getByRole("link", { name: /Open existing model for outcome 7\.3\.4/ }),
    ).toHaveAttribute("href", "#/astronomy");
    await page.goto("/#/astronomy");
    await expect(
      page.getByRole("heading", { name: "Reading starlight" }),
    ).toBeVisible();
  });
});

test.describe("Motion workspace", () => {
  test("signed track distinguishes distance from displacement and average velocity", async ({
    page,
  }) => {
    await page.goto("/#/motion/track");
    await page.getByRole("button", { name: "Move positive 1 s" }).click();
    await page.getByRole("button", { name: "Record current sample" }).click();
    await page.getByRole("button", { name: "Move negative 1 s" }).click();
    await page.getByRole("button", { name: "Record current sample" }).click();
    await expect(
      page.getByTestId("motion-distance-displacement"),
    ).toContainText("4 m / 0 m");
    await expect(
      page.getByText("Average speed / velocity").locator(".."),
    ).toContainText("2 m/s / 0 m/s");
    await page.getByRole("radio", { name: "Left" }).check();
    await expect(
      page.getByTestId("motion-distance-displacement"),
    ).toContainText("4 m / 0 m");
    await page
      .getByTestId("motion-track-comparison")
      .fill(
        "The path gives nonzero average speed, while returning to the run start gives zero average velocity.",
      );
    await page.getByTestId("motion-track-save").click();
    await expect(page.getByText(/Saved for 7.4.1/)).toBeVisible();
  });

  test("diagram interval relabels without moving dots and reversal feedback is specific", async ({
    page,
  }) => {
    await page.goto("/#/motion/diagrams");
    const positions = page.locator('input[aria-label^="Dot"]');
    const before = await positions.evaluateAll((items) =>
      items.map((item) => (item as HTMLInputElement).value),
    );
    await page.getByTestId("motion-interval").selectOption("0.5");
    expect(
      await positions.evaluateAll((items) =>
        items.map((item) => (item as HTMLInputElement).value),
      ),
    ).toEqual(before);
    await page.getByTestId("motion-pattern").selectOption("reversal");
    await page.getByTestId("motion-diagram-check").click();
    await expect(page.getByTestId("motion-diagram-feedback")).toContainText(
      "reverses",
    );
    await page
      .getByTestId("motion-diagram-explanation")
      .fill(
        "The equal-time gaps change sign after the turning point, so direction reverses.",
      );
    await page.getByTestId("motion-diagram-save").click();
    await expect(page.getByText("Saved for 7.4.2.")).toBeVisible();
  });

  test("motion investigation produces a unit-labelled graph, slope, misconception feedback and export", async ({
    page,
  }) => {
    await page.goto("/#/motion/graphs");
    for (const duration of ["1", "3", "5"]) {
      await page.getByRole("slider", { name: "Trial duration" }).fill(duration);
      await page.getByTestId("motion-add-trial").click();
    }
    await expect(page.getByTestId("motion-distance-graph")).toBeVisible();
    await expect(page.getByTestId("motion-slope-result")).toContainText(
      "2 m/s",
    );
    await page
      .locator('[data-control-id="motion.piecewise-story-select"]')
      .selectOption("hill");
    await page.getByTestId("motion-story-check").click();
    await expect(
      page.locator(".field__error, .feedback").getByText(/not a literal hill or path/),
    ).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByTestId("motion-export-csv").click();
    expect((await download).suggestedFilename()).toBe(
      "wavemotion-motion-trials.csv",
    );
  });

  test("reduced-motion mode has no autoplay and keyboard stepping uses the same exact state", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#/motion/track");
    await page.waitForTimeout(350);
    await expect(page.getByTestId("motion-time")).toHaveText("0 s");
    const move = page.getByRole("button", { name: "Move positive 1 s" });
    await move.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("motion-time")).toHaveText("1 s");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByTestId("motion-track-log")).toBeVisible();
  });
});

test.describe("Forces workspace", () => {
  test("vector builder preserves physical arrows while coordinate signs flip", async ({
    page,
  }) => {
    await page.goto("/#/forces/vectors");
    await page.getByTestId("forces-magnitude").fill("5");
    await page.getByTestId("forces-add-force").click();
    await expect(page.getByTestId("forces-net-force")).toContainText("5 N");
    await expect(page.getByTestId("forces-vector-table")).toContainText(
      "right",
    );
    await page.getByTestId("forces-positive-direction").selectOption("left");
    await expect(page.getByTestId("forces-net-force")).toContainText("-5 N");
    await expect(page.getByTestId("forces-vector-table")).toContainText(
      "right",
    );
  });

  test("cart investigation verifies Fnet = ma, supports two sweeps and exports data", async ({
    page,
  }) => {
    await page.goto("/#/forces/cart");
    await page.getByRole("slider", { name: "Applied force" }).fill("6");
    await page.getByRole("slider", { name: "Mass" }).fill("2");
    await page.getByTestId("forces-run-trial").click();
    await expect(page.getByTestId("forces-acceleration")).toContainText(
      "3 / 3 m/s²",
    );
    for (const force of ["8", "10"]) {
      await page.getByRole("slider", { name: "Applied force" }).fill(force);
      await page.getByTestId("forces-run-trial").click();
    }
    await page.getByTestId("forces-sweep").selectOption("mass");
    await page.getByRole("slider", { name: "Applied force" }).fill("6");
    for (const mass of ["1", "2", "3"]) {
      await page.getByRole("slider", { name: "Mass" }).fill(mass);
      await page.getByTestId("forces-run-trial").click();
    }
    await expect(page.getByTestId("forces-force-graph")).toBeVisible();
    await expect(page.getByTestId("forces-mass-graph")).toBeVisible();
    for (const id of [
      "hypothesis",
      "interpretation",
      "verification",
      "uncertainty",
      "conclusion",
      "limitation",
    ])
      await page
        .getByTestId(`forces-cart-${id}`)
        .fill(
          `Complete ${id} based on the controlled data and stated model limits.`,
        );
    await page.getByTestId("forces-save-investigation").click();
    await expect(page.getByText(/Saved for 7.4.4 and 7.4.7/)).toBeVisible();
    const download = page.waitForEvent("download");
    await page.getByTestId("forces-export-json").click();
    expect((await download).suggestedFilename()).toBe(
      "wavemotion-cart-trials.json",
    );
  });

  test("seeded measurement noise reproduces after a reset and never hides ideal acceleration", async ({
    page,
  }) => {
    const measure = async () => {
      await page.getByTestId("forces-noise").check();
      await page.getByRole("slider", { name: "Applied force" }).fill("4");
      await page.getByRole("slider", { name: "Mass" }).fill("2");
      await page.getByTestId("forces-run-trial").click();
      return page.getByTestId("forces-acceleration").textContent();
    };
    await page.goto("/#/forces/cart");
    const first = await measure();
    await page.reload();
    const second = await measure();
    expect(second).toBe(first);
    expect(first).toContain("2 /");
  });

  test("walking case is the sole numeric fixture and names forces on different objects", async ({
    page,
  }) => {
    await page.goto("/#/forces/applications");
    await page.getByTestId("forces-newton-case").selectOption("walking");
    await page.getByTestId("forces-newton-action").click();
    await page.getByTestId("forces-third-law-reveal").click();
    await expect(page.getByTestId("forces-third-law-pair")).toContainText(
      "Earth-on-foot: +400 N",
    );
    await expect(page.getByTestId("forces-third-law-pair")).toContainText(
      "Foot-on-Earth: −400 N",
    );
  });

  test("calculation guards zero mass and saves a valid unit-aware result", async ({
    page,
  }) => {
    await page.goto("/#/forces/calculations");
    await page.getByTestId("forces-calculation-input-0").fill("6");
    await page.getByTestId("forces-calculation-input-1").fill("0");
    await page.getByTestId("forces-calculate").click();
    await expect(page.getByTestId("forces-calculation-result")).toContainText(
      "greater than 0 kg",
    );
    await page.getByTestId("forces-calculation-input-1").fill("2");
    await page.getByTestId("forces-calculate").click();
    await expect(page.getByTestId("forces-calculation-result")).toContainText(
      "3 m/s²",
    );
    await page
      .getByTestId("forces-calculation-interpretation")
      .fill(
        "Positive acceleration is in the selected positive direction and the result unit is metres per second squared.",
      );
    await page.getByTestId("forces-calculation-save").click();
    await expect(page.getByText("Saved for 7.4.7.")).toBeVisible();
  });

  test("Check and Explain reject incomplete submissions and expose progressive hints", async ({
    page,
  }) => {
    await page.goto("/#/motion/check");
    await page.getByTestId("motion-check-submit").click();
    await expect(page.getByTestId("motion-check-feedback")).toContainText(
      "Choose an answer",
    );
    await page.getByTestId("motion-check-hint").click();
    await expect(
      page.getByText(/One quantity counts the whole path/),
    ).toBeVisible();
    await page.goto("/#/forces/explain");
    await page
      .getByTestId("forces-cer-0")
      .fill("Acceleration depends on net force and mass.");
    await page.getByTestId("forces-cer-save").click();
    await expect(page.locator('.field__error', { hasText: 'Evidence is missing' })).toBeVisible();
  });
});
