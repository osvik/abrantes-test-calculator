# Abrantes A/B Testing Tools

Free, open-source tools for planning and evaluating A/B test experiments.

**Use them now:** [osvik.github.io/abrantes-test-calculator](https://osvik.github.io/abrantes-test-calculator/)

---

## A/B Test Significance Calculator

Enter the number of participants and conversions for your original and variant(s). The calculator instantly shows:

- **Conversion rate** for each variant
- **Relative improvement** compared to the original (e.g. +20%)
- **Confidence level** (e.g. 95.2%)
- **Statistical significance** — whether you can trust the result

Results update in real time as you type. No server, no signup, no tracking.

### Who is this for

- **Marketing teams** running landing page or email experiments
- **Web designers and developers** testing layout, copy, or UX changes
- **Product managers** evaluating feature variations
- **Anyone** who needs a quick, reliable significance check

### How to read the results

A result is marked **Significant** when the confidence level reaches 95% or higher (p-value < 0.05). This means there is less than a 5% probability that the difference between your variants happened by chance.

For experiments with just one variant, it's also possible to use a 90% confidence level. Although the standard for this type of experiments is 95%, it often it takes a long time to achieve statistical significance.

If the result says **Not Significant**, you either need more data or the difference between variants is too small to be conclusive.

#### Sample size matters

Small sample sizes produce unreliable results. As a general rule:

- Below ~1,000 participants per variant, significance is hard to reach unless the difference is large
- For subtle differences (1-2% improvement), you typically need 10,000+ participants per variant
- Always let your experiment run to completion before making decisions

### Features

- Compare up to 4 variants (original + 3 variations)
- Share experiments via URL — click "Share Link" to copy a URL that restores all your data
- Works entirely in the browser — no data is sent to any server
- Responsive design for desktop and mobile
- Works offline — a service worker caches all assets so both tools remain fully functional without an internet connection
- Print-friendly — use your browser's Print or "Save as PDF" to export a clean A4 report

### Statistical method

The calculator uses a **two-proportion Z-test** (two-tailed):

```
SE = sqrt[(p1 * (1 - p1) / n1) + (p2 * (1 - p2) / n2)]
Z  = (p2 - p1) / SE
p-value = 2 * (1 - normalCDF(|Z|))
```

Where `p1`/`p2` are conversion rates and `n1`/`n2` are participant counts. The normal CDF is computed using an Abramowitz & Stegun error function approximation (max error ~1.5e-7).

The significance threshold is **p < 0.05** (95% confidence).

---

## A/B Test Planner

Estimate how many days, participants, and conversions you need to reach statistical significance **before** you start your experiment.

**Use it:** [osvik.github.io/abrantes-test-calculator/planner.html](https://osvik.github.io/abrantes-test-calculator/planner.html)

### What it does

Enter your average daily traffic and conversions, and the number of variants you plan to test. The planner calculates:

- **Minimum total participants** needed across all groups
- **Minimum total conversions** expected during the experiment
- **Minimum number of days** the experiment should run

It also provides contextual notes about your experiment — warnings for very low or high conversion rates, long durations, and explanations of the statistical assumptions.

### Who is this for

- **Marketing teams** planning experiments and setting expectations with stakeholders
- **Product managers** deciding whether an A/B test is feasible given current traffic
- **Anyone** who wants to know how long an experiment will take before committing resources

### Statistical assumptions

- **7% minimum detectable effect** (relative change) — conservative end of the typical 7-10% range
- **90% or 95% confidence level** (toggleable, defaults to 95%; multiple variants force 95%)
- **80% statistical power** — 80% chance of detecting the effect if it truly exists
- Sample size calculated using the two-proportion Z-test power formula (two-tailed)

---

## Tech stack

Static site — no dependencies, no build step:

- `index.html` / `script.js` — Significance Calculator
- `planner.html` / `planner.js` — Test Planner
- `style.css` — shared styling
- `planner.css` — planner-specific styling
- `print.css` — print/PDF stylesheet (A4 layout, shared by both pages)
- `service-worker.js` — network-first caching for offline support
- `manifest.json` — web app manifest for installability

Hosted on GitHub Pages.

## License

[GNU Affero General Public License v3.0](https://choosealicense.com/licenses/agpl-3.0/)
