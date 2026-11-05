# IAM 566 · Numerical Optimization

website: https://iam566-numericaloptimisation.github.io

Lecture notes for IAM 566, Fall 2026. The site is a condensed reading of the course PDFs where stay in [lecture-notes_AI-Generated](https://github.com/IAM566-NumericalOptimisation/lecture-notes_AI-Generated). This repository is the website.

## Adding a chapter

A chapter is one markdown file in `content/notes/`. The PDF is the source. [MarkItDown](https://github.com/microsoft/markitdown) turns that PDF into a markdown draft. The draft is edited, then placed in this repository. It is not published as MarkItDown wrote it.

### 1. Take the PDF

Clone the notes repository and use the chapter PDF, for example `0.2 - Calculus.pdf`.

```bash
git clone https://github.com/IAM566-NumericalOptimisation/lecture-notes_AI-Generated.git
```

### 2. Convert it with MarkItDown

MarkItDown is a Python tool that converts a PDF (and Word, PowerPoint, and other office files) to Markdown, keeping headings, lists, and tables. Python 3.10 or newer is required.

```bash
python -m venv .venv
source .venv/bin/activate
pip install 'markitdown[pdf]'
markitdown "0.2 - Calculus.pdf" -o draft.md
```

`draft.md` is a working file. Leave it outside `content/notes/`. Lecture PDFs are full of mathematics, and MarkItDown often flattens formulas into plain text. Rewrite those in LaTeX before the note is ready: inline `$A \subseteq \mathbb{R}$`, display

```markdown
$$
\|x\|_p = \left(\sum_{i=1}^{n} |x_i|^p\right)^{1/p}.
$$
```

Read the draft against the PDF. Drop repeated exposition, fix headings that came out of a table, and keep each definition and theorem as a paragraph beginning with `**Definition.**` or `**Theorem.**`.

### 3. Put the note in the site

Save the edited chapter as `content/notes/<slug>.md`. The slug is the address, so `calculus.md` is served at `/notes/calculus/`. The file starts with this front matter:

```yaml
---
title: Calculus
code: "0.2"
order: 2
status: published
pdf: https://github.com/IAM566-NumericalOptimisation/lecture-notes_AI-Generated/blob/main/0.2%20-%20Calculus.pdf
---
```

| Field | Role |
| --- | --- |
| `title` | Name on the homepage and on the chapter page. |
| `code` | Chapter number, such as `0.2` or `4`. |
| `order` | Position in the homepage list. |
| `status` | `published` renders the note. `forthcoming` renders “Coming soon.” |
| `pdf` | Destination of the Full notes button. Omit the field until that link should appear. |

A line that begins with `##` is a section. Those sections are the contents on the side of the page. The opening text, before the first `##`, is the introduction.

A figure is a line on its own:

```markdown
[[LpBall]]
```

The names that exist now are `SupInf`, `Affine`, `Span`, `Basis`, `Metric`, `LpBall`, `Cauchy`, `Projection`, `GramSchmidt`, `Subspaces`, `Transform`, and `Eigen`. They are registered, with their titles, in `components/figures/registry.tsx`. A new figure needs an entry there as well as the marker in the note. On a wide screen each figure sits beside its section and stays in view while the section is read.

`linear-algebra.md` is the pattern to follow. The other files are still `status: forthcoming`.

### 4. Open a pull request

From this repository:

```bash
npm install
npm run dev
```

Read the chapter at `http://localhost:3000/notes/<slug>/`. Check the contents, the formulas, and the Full notes link. Then open a pull request with the markdown file and, if you added one, the figure component. Pushing to `main` builds the site and deploys it to GitHub Pages.

## Chapters

| Order | File | PDF |
| --- | --- | --- |
| 0.1 | `content/notes/linear-algebra.md` | `0.1 - Linear Algebra.pdf` |
| 0.2 | `content/notes/calculus.md` | `0.2 - Calculus.pdf` |
| 1 | `content/notes/optimization-problems.md` | `1 - Optimization Problems.pdf` |
| 2 | `content/notes/least-squares.md` | `2 - Least Squares Data Fitting.pdf` |
| 3 | `content/notes/level-curves.md` | `3 - Level Curves and Descent.pdf` |
| 4 | `content/notes/convex-sets.md` | `4 - Convex Sets.pdf` |
| 5 | `content/notes/separation.md` | `5 - Separation and Farkas.pdf` |
