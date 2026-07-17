# Design-token contrast audit — Stage 1 (2026-07-17)

Measured with the WCAG 2.x relative-luminance formula (script equivalent to
the one in `scripts/`; ratios rounded to 2 dp). WCAG AA requires ≥ 4.5:1 for
normal text and ≥ 3:1 for large text / non-text UI parts.

Every pairing used for **text** passes AA (≥ 4.5:1). The two sub-4.5 rows are
decorative/large-only uses and both exceed the 3:1 non-text minimum.

| Pairing | Ratio | Use |
|---|---|---|
| `--ink-strong` #161c28 on `--surface-page` #f7f4ee | 15.54 | headings |
| `--ink-body` #2f3646 on `--surface-page` | 11.01 | body text |
| `--ink-muted` #545c6e on `--surface-page` | 6.11 | secondary text |
| `--ink-strong` on `--surface-card` #ffffff | 17.06 | headings on cards |
| `--ink-body` on `--surface-card` | 12.09 | body on cards |
| `--ink-muted` on `--surface-card` | 6.70 | hints on cards |
| `--ink-body` on `--surface-sunken` #efe9df | 10.01 | chips/table heads |
| `--ink-muted` on `--surface-sunken` | 5.55 | secondary on sunken |
| `--ink-on-nav` #f4f6fb on `--surface-nav` #141b2e | 15.84 | header/footer text |
| `--ink-on-nav-muted` #c4ccdd on `--surface-nav` | 10.63 | nav links |
| `--ink-on-nav` on `--surface-nav-raised` #1e2740 | 13.68 | settings button |
| `--accent-cyan-ink` #056977 on page / card / sunken | 5.81 / 6.38 / 5.28 | links, primary buttons |
| `--accent-violet-ink` #5b34c9 on page / card / sunken | 6.88 / 7.56 / 6.26 | links, skip link |
| `--status-secure` #1f7a4d on card | 5.32 | level text (with icon) |
| `--status-developing` #8a5a0e on card | 5.90 | level text (with icon) |
| `--status-developing` #8a5a0e on `--status-warn-surface` #fbf2e0 | 5.32 | in-development badge |
| `--status-not-attempted` #545c6e on card | 6.70 | level text (with icon) |
| `--status-danger` #b3261e on card | 6.54 | danger button text |
| `--status-danger` on `--status-danger-surface` #fbeceb | 5.70 | error detail |
| `--status-info` #056977 on `--status-info-surface` #e6f4f6 | 5.66 | notices |
| white #ffffff on `--accent-cyan-ink` #056977 | 6.38 | primary button label |
| `--focus-ring-color` #5b34c9 on page | 6.88 | focus ring (non-text, needs ≥3) |
| `--ink-on-accent` #10131b on `--accent-cyan` #00b8d4 | 7.79 | text on bright cyan fill |
| `--ink-on-accent` on `--accent-violet` #7c4dff | 3.86 | **large/decorative only** — never body text |
| `--accent-cyan` (bright) on `--surface-nav` | 7.18 | decorative rules/brand mark |
| `--accent-violet` (bright) on `--surface-nav` | 3.56 | **decorative only** (brand mark stroke) |

Notes:

- `--status-developing` was darkened from #9a6410 to #8a5a0e during the audit
  because the badge-on-warn-surface pairing measured 4.49 (just under AA).
- Status levels are always rendered with an icon + text label — colour never
  carries the meaning alone.
- Automated verification: the axe colour-contrast rule runs on every shell
  route in `tests/e2e/a11y.spec.ts` with zero violations.
