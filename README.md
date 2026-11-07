# MDOF Calculator — free vibration of a shear frame, step by step

An interactive, self-contained solution of the MDOF problem on the exam sheet
(*Free vibration response of MDOF systems*): four concrete square columns per
floor, three lumped masses, three lateral degrees of freedom.

Open **`index.html`** — a single file, no server, no internet, no build step.
It works offline from a USB stick and also from `file://`.

Created by **Nezzar**, with the help of DeepSeek Harness.

The site ships as **MDOF Calculator** on Vercel
(<https://mdof-calculator.vercel.app/>). The deployable folder is `vercel/`:

1. `node src/pack.js https://your-project.vercel.app` — rebuilds the page with that
   absolute address, writes `vercel/` and zips it to `mdof-vercel.zip`.
2. Drag the **`vercel` folder** onto <https://vercel.com/new> (or run
   `npx vercel --prod` inside it). No framework preset, no build command:
   `index.html` is the entry.
3. `vercel.json` sets cache headers and serves the `.py` / `.c` sources as plain text
   instead of downloads; `robots.txt` and `sitemap.xml` carry the same address;
   `404.html` is picked up automatically.

### Link previews (Facebook, Messenger, WhatsApp, Slack, Discord, X)

`og.png` (1200 × 630, ~110 KB) is the card those apps show when the link is pasted:
the MDOF Calculator name, the mode-1 deformed frame, f₁ = 5.315 Hz, T₁ = 0.1881 s,
3 modes, 2–3 storeys, and an *Open the calculator →* button — legible at the ~300 px
width Messenger uses.

```html
<meta property="og:image" content="https://mdof-calculator.vercel.app/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
```

Text lengths are kept inside what the previews actually show, so nothing is cut off
with an ellipsis: `og:title` 46 characters (limit ~60), `og:description` 87 (~125),
`<meta name="description">` 152 (~155 for Google). The image carries a call to action
because link-preview checkers flag cards that have none.

Scrapers do not run JavaScript and do not resolve relative paths, so that URL must be
**absolute and the real one**. It is written once, in `src/site.json`, and stamped
into the page, `robots.txt` and `sitemap.xml` by the build:

```
node src/pack.js https://your-project.vercel.app
```

After the first deploy, paste the URL into the
[Facebook sharing debugger](https://developers.facebook.com/tools/debug/) and press
*Scrape Again*: Messenger caches previews for days, and the debugger is the only way
to force a refetch without changing the URL. WhatsApp caches longer still.

The card is generated from `src/og.html` by `node src/og.js` — edit the HTML and
re-run, no image editor needed.

---

## The problem as given

| Quantity | Value |
|---|---|
| Columns per floor | 4, concrete, square |
| Section | 300 mm × 300 mm |
| f'c | 21 MPa |
| Storey heights | h₁ = 1.25 h₂ = 1.333333 h₃ = 4 m |
| Masses (floor 1 / 2 / roof) | 5,000 / 2,500 / 1,250 kg |
| Mode-shape factor at the top floor | 1.000 |

Asked: (1) stiffness of one column and the equivalent stiffness per floor,
(2) natural frequencies and periods, (3) mode-shape factors per floor,
(4) sketch of the mode shapes and of the total mode shape.

## Modelling assumptions

The standard shear-frame idealisation, and it is stated on the page:

1. **Rigid floor slabs.** The beams are treated as infinitely stiff in bending,
   so every point on a floor has the same horizontal displacement. Three
   storeys → three DOFs.
2. **Inextensible columns.** No axial deformation, so there is no vertical
   motion and no rocking.
3. **Columns fixed at both ends** (into the foundations and into the slabs),
   which gives the storey stiffness `12EI/h³`.
4. **Lumped masses.** All mass is at floor level; the columns carry none.
5. **Linear elastic, undamped.** Small displacements, no P-Δ, no soil
   flexibility, no torsion — a pure planar 3-DOF system.

## Step by step

### 1 · Section and storey stiffness

```
Ec   = 4700 √21            = 21,538.1 MPa
I    = b h³/12 = 0.3⁴/12   = 6.75 × 10⁻⁴ m⁴
EI                         = 14,538.2 kN·m²
k_col = 12 EI / h³         k_floor = 4 k_col
```

| Storey | h (m) | k_col (kN/m) | k_floor (kN/m) |
|---|---|---|---|
| 1 | 4.00 | 2,725.9 | 10,903.7 |
| 2 | 3.20 | 5,324.1 | 21,296.2 |
| 3 | 3.00 | 6,461.4 | 25,845.7 |

The shortest ground storey is the most flexible — the stiffness scales as
`1/h³`, and h drops by 25 % from storey 1 to storey 3.

### 2 · Mass and stiffness matrices

```
K = [  32,199.9  -21,296.2        0    ]  kN/m
    [ -21,296.2   47,141.9  -25,845.7 ]
    [      0     -25,845.7   25,845.7 ]

M = diag(5,000  2,500  1,250) kg
```

### 3 · Eigenvalue problem

```
det(K − λM) = 0        λ = ω²
λ³ − 45,973.32 λ² + 3.94445×10⁸ λ − 3.84099×10¹¹ = 0
```

Solved for the symmetric system `M^(−1/2) K M^(−1/2)` (cyclic Jacobi on the
3×3), then transformed back:

| Mode | λ = ω² (1/s²) | ω (rad/s) | f (Hz) | T (s) |
|---|---|---|---|---|
| 1 | 1,115.2 | 33.395 | **5.315** | **0.18815** |
| 2 | 9,833.7 | 99.165 | **15.783** | **0.06336** |
| 3 | 35,024.5 | 187.148 | **29.786** | **0.03357** |

### 4 · Mode shapes (top floor = 1.000)

| Level | φ₁ | φ₂ | φ₃ |
|---|---|---|---|
| Floor 1 | 0.7568 | −0.6582 | 0.1034 |
| Floor 2 | 0.9461 | 0.5244 | −0.6939 |
| Roof | 1.0000 | 1.0000 | 1.0000 |
| Modal mass (kg) | 6,350.9 | 4,103.4 | 2,507.3 |

Mode 1 is the classic cantilever sway: the three floors move together and the
roof travels furthest, 1.32 times the first floor. Mode 2 changes sign once —
the first storey swings one way while the two upper floors go the other. Mode 3
changes sign twice: the first floor barely moves, the second floor swings back
and the roof whips forward against it, which is why its modal mass is the
smallest (2.5 t).

### 5 · Total mode shape

The total response is the superposition

```
x(t) = Σ_r φ_r [ q_r(0) cos ω_r t + q̇_r(0)/ω_r sin ω_r t ]
q_r(0) = φ_rᵀ M x₀
```

For the default "uniform sway" initial condition (every floor pulled 20 mm):

| Mode | generalised amplitude | share of the 20 mm |
|---|---|---|
| 1 | 23.30 mm | dominant |
| 2 | −3.56 mm | 15 % |
| 3 | 0.26 mm | 1 % |

so the total shape is essentially mode 1 with a small wobble — and because
5.315 : 15.783 : 29.786 Hz is not an integer ratio, the roofline never repeats
exactly. Peak floor displacement over the first 6 s: 20.0 / 24.0 / 27.1 mm —
the light upper floors overshoot the 20 mm they were pulled, while the roof
absorbs the least of it.

## What the page contains

`index.html` is a player, not a scroll. Four parts:

- **Hero** — the frame drawn to scale with mode 1 overlaid, and the four numbers
  that answer the question: f₁, T₁, k₁ and ω₁.
- **The walkthrough** — ten chapters for three storeys, nine for two. Each holds
  2–4 frames that build one idea: the idealisation, one column as a spring,
  K and M, the eigenvalue statement, the determinant expanded term by term, the
  characteristic cubic, the roots on the det curve, three guesses showing how SHIFT + SOLVE picks a root, one chapter per mode whose
  rows are typed in as they stand and solved for one unknown each, and finally
  the animated building ringing in each mode and in total. ▶ Play advances by itself, the arrows step, the speed
  control scales the dwell, ↻ replays the current frame, and the figure redraws
  at every frame. On the motion frames a second control switches between readable
  slow motion and the true period, and warns that 29.8 Hz is a blur — the shape
  is what you are meant to see. If the operating system asks for reduced motion,
  the animation is held still at its extreme instead of running.
- **The equations are typeset, not typed** — real stacked fractions, radicals
  with an over-bar, sub/superscripts and italic variables (Cambria Math, no
  library, no CDN). They are also **animated**: each factor lights up in the
  order it is used, so you can see *which* numbers are multiplied before the
  result lands. The eigenvalue chapter adds a dedicated row-by-row figure:
  every K₁ⱼ φⱼ product appears under its own column, then the signed sum,
  then the right-hand side ω² m₁ φ₁ — and they agree.
- **The answers** — K and M, the cubic, the frequency/period table, the mode-shape
  factors level by level, and the live checks (orthogonality, eigenvalue
  residual, root sum, completeness).
- **The builder** — 2 or 3 storeys, f'c, section, column count, every storey
  height and mass, damping ζ, and the initial condition. Change anything and the
  numbers, the figures and the whole walkthrough are rebuilt from scratch.
- **The interface** borrows the component patterns of the current shadcn /
  21st.dev register and rebuilds them by hand — no React, no Tailwind, no CDN,
  because the page has to open from a folder with no network. A sliding pill
  behind the active chapter tab, segmented controls with a travelling thumb,
  dark tooltips plus Space / ← → / R shortcuts, sonner-style toasts when the
  model is rebuilt, spotlight cards that follow the pointer, numbers that tick
  to their new value instead of snapping, and Copy results on the answers.

### The determinant, drawn the way it is taught

The determinant chapter is the one students usually lose, so it is not a
lecture — it is a demonstration, frame by frame, on the actual 3×3 matrix:

1. the sign pattern **+ − +** is drawn over the top row, and the expansion is
   written once: every entry is a *pivot* times the 2×2 left when its row and
   column are deleted;
2. the deleted row and column fade out and the surviving cells are outlined —
   one dashed box per run of columns, so for the middle pivot you see **two
   separate boxes**, not one merged block;
3. two curved arrows then pair the survivors: the main diagonal (green, from the
   top-left survivor to the bottom-right) and the cross diagonal (amber). Both bow
   away from each other and, at the one point where a diagonal pair has to meet,
   the green arrow passes over the amber one with a thin white break — so no arrow
   ever sits on a digit or on a cell letter. The captions name exactly which cells
   are multiplied: `e × i` and `f × h`;
4. term 2 repeats it for the middle pivot, where the surviving pair is
   non-adjacent — `d × i` and `f × g`;
5. term 3 stops at the pivot, because the corner cell is zero and a zero pivot
   wipes out its whole minor;
6. the last frame stacks the three products into a ladder —

   ```
   T₁  −0.125B³ + 5,746.67B² − 53,840,900B + 141,786,763,963
   T₂  −4,535,291B + 93,774,314,790
   T₃  0                          (pivot is zero, so the term vanishes)
   ────────────────────────────────────────────────────────────
   det = T₁ − T₂ + T₃
       = −0.125B³ + 5,746.67B² − 49,305,609B + 48,012,449,173
   ÷ −0.125  B³ − 45,973.34B² + 394,444,874B − 384,099,593,381
   ```

   which is the same cubic the frequency chapter then solves. Nothing is
   asserted without the multiplication that produced it being visible.

Every number in these figures is recomputed from the current model, so the
arrows land on the right cells for 2 storeys (one subtraction, `a·d − b·c`,
with the four cells lettered a, b / c, d) as well as for the a … i grid of a
3-storey frame.

### The rows solved the way the class calculator does it

The mode chapters divide nothing out. Each row of `(K − λM)φ = 0` is typed in
exactly as it stands, with one letter standing for the single unknown left in it,
and solved with SHIFT + SOLVE:

| Row | What is typed in (mode 1) | Unknown | SHIFT + SOLVE |
|---|---|---|---|
| 3 | −5,169.15 X + 4,890.34 × 1.0000 = 0 | φ₂ | X = 0.9461 |
| 2 | −4,259.24 X + 8,870.78 × 0.946064 − 5,169.15 × 1.0000 = 0 | φ₁ | X = 0.7568 |
| 1 | 5,324.77 × 0.756750 − 4,259.24 × 0.946064 | — | −1.2 × 10⁻³ ≈ 0 |

Row 3 is the only row holding a single unknown, so it starts. Row 2 inherits that
answer and solves the next one. Row 1 contains only knowns, is never used to solve
anything, and is kept as the check — the leftover −1.2 × 10⁻³ is the rounding in
the φ values printed to four decimals, not a mistake. Every number that goes in can
be pointed at in the row above.

The same treatment turns the determinant into λ. The polynomial is entered as it
stands, `det = 0`, and the starting guess decides which root comes back:

| Guess X₀ | Converges to | Steps |
|---|---|---|
| 1,000 | 1,115.2116 | 4 |
| 10,000 | 9,833.6546 | 4 |
| 35,000 | 35,024.4730 | 3 |

which is why the page says out loud that a different guess finds a different root:
the calculator is not asked for "the answer", it is asked for *a* root.

### Phones

The page is usable one-handed: the walkthrough stacks to a single column, the
figure keeps one fixed height and the player buttons move **above** the
explanation, so stepping through frames never shifts what is under your thumb
(the narration is the only thing that changes length, and it grows downward);
the chapter strip scrolls horizontally and scrolls the active tab into view,
controls and inputs are at least 40–44 px tall, inputs are 16 px so iOS does
not zoom on focus, the chips stop being squeezed, the builder's two buttons stack
instead of overhanging the card, and the document never scrolls sideways
(`scrollWidth` = viewport width at 360, 390 and 1440 px). Figures are SVG,
so they scale to the panel and stay crisp; long polynomials wrap inside the
formula card instead of running off its edge.

`detailed.html` is the long-form version of the same solution: one scrolled
document with a parameter drawer, a Rayleigh slider and the polynomial root
trace. It solves the same model with the same engine.

## Verification

The page recomputes these checks at runtime and shows them green:

| Check | Result |
|---|---|
| Eigen residual max \|(K − λM)φ\| / k | 4.3 × 10⁻¹⁶ |
| Sum of roots Σλ vs trace(M⁻¹K) | 45,973.34 = 45,973.34 |
| Mass orthogonality max \|φᵣᵀMφₛ\| | 1.4 × 10⁻¹⁶ |
| Completeness ‖ΦΦᵀM − I‖ | 4.1 × 10⁻¹⁶ |
| Product of the roots ∏λ vs det K′ / det M′ | 3.8410 × 10¹¹ = 3.8410 × 10¹¹ |
| Rayleigh with the self-weight shape | 1,116.9 ≥ 1,115.2 (+0.15 %) |
| Symmetry max \|Kᵢⱼ − Kⱼᵢ\| / K | 0 |

`node tests/engine-check.js` replays the same identities head-lessly — 49
assertions on the material, the storey stiffnesses, K, λ, the mode shapes, the
modal masses, the checks above and the 2-storey model — and exits non-zero on the
first disagreement, so a change that breaks the physics cannot be shipped
silently.

Two independent solvers sit beside the page:

- `mdof_solver.py` — NumPy reference (246 lines), prints the same table and
  writes `results.json`.
- `mdof_eigen.c` — C99 reference, closed-form cubic + cofactor eigenvectors,
  no dependencies beyond libm. **It ships as readable source only**: there is
  no C compiler on the machine where this was built, so it was verified by
  transliterating its algorithm and comparing every number, not by compiling.

## Files

| File | What it is |
|---|---|
| `index.html` | the interactive solution — hero, 10-chapter walkthrough, answers, builder. One file, offline |
| `detailed.html` | the long-form scrolled version of the same solution |
| `src/` | the parts `index.html` is built from (`math.js` is the typesetting kit), plus `build.js`, a headless `verify.js` and the screenshot script |
| `tests/engine-check.js` | 49 head-less assertions on the engine (`node tests/engine-check.js`) |
| `mdof_solver.py` | NumPy reference solver |
| `mdof_eigen.c` | C99 reference solver (source, not compiled here) |
| `results.json` | machine-readable answers from the Python solver |
| `screenshots/` | captures of every part of the page |
| `README.md` | this note |

## Limits worth saying out loud

- Undamped free vibration only; no forced excitation, no response spectrum.
- The rigid-diaphragm and fixed-ended-column assumptions make this the
  *stiffest* simple idealisation. Real frames with flexible beams are softer,
  so these frequencies are upper bounds.
- Columns are sized 300 × 300 mm and carry no axial check; this is a dynamics
  exercise, not a design.

### 3D view, share links, calculator keys, offline
- **2D / 3D / Both** switch above the tour. 3D (three.js r159, `three.min.js`, loaded only when first needed) shows on *The frame*, the last step of each *Mode* chapter and *In motion*; matrix and determinant steps stay flat. Drag to orbit; sway is exaggerated to 9 % of the height. No WebGL → falls back to 2D.
- **Share link** in Answers: the URL carries every input (`?n=2&fc=28&h=…&m=…&v=3d`), range-checked on load.
- **On your calculator** card: the monic characteristic equation as fx-991ES PLUS / fx-991EX key steps, with the expected roots.
- **Offline**: `sw.js` caches the page, three.js and icons after the first visit (bump `C` in sw.js when assets change).
- Check: `node src/check3d.js`.
