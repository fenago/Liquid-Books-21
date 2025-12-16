// Comprehensive MyST Markdown and Jupyter Book features

export interface MystFeature {
  id: string;
  name: string;
  category: MystFeatureCategory;
  description: string;
  syntax: string;
  example: string;
  options?: string[];
}

export type MystFeatureCategory =
  | 'admonitions'
  | 'ui-components'
  | 'interactive-code'
  | 'exercises'
  | 'math'
  | 'diagrams'
  | 'code'
  | 'figures'
  | 'tables'
  | 'layout'
  | 'references'
  | 'content'
  | 'proofs-theorems';

export const featureCategories: Record<MystFeatureCategory, { label: string; description: string; icon: string }> = {
  'admonitions': {
    label: 'Callouts & Admonitions',
    description: 'Highlight important information with styled callout boxes',
    icon: '💡'
  },
  'ui-components': {
    label: 'UI Components',
    description: 'Interactive elements like tabs, cards, dropdowns, and grids',
    icon: '🧩'
  },
  'interactive-code': {
    label: 'Interactive Code Execution',
    description: 'Run code live in the browser with JupyterLite, Pyodide, Thebe, or cloud environments',
    icon: '🚀'
  },
  'exercises': {
    label: 'Exercises & Solutions',
    description: 'Interactive exercises with linked solutions',
    icon: '📝'
  },
  'math': {
    label: 'Math & Equations',
    description: 'LaTeX-style mathematical expressions and equations',
    icon: '∑'
  },
  'diagrams': {
    label: 'Diagrams',
    description: 'Visual diagrams using Mermaid syntax',
    icon: '📊'
  },
  'code': {
    label: 'Code Blocks',
    description: 'Syntax-highlighted code with line numbers and captions',
    icon: '💻'
  },
  'figures': {
    label: 'Figures & Media',
    description: 'Images, figures, videos, and iframes',
    icon: '🖼️'
  },
  'tables': {
    label: 'Tables',
    description: 'Various table formats including CSV and list tables',
    icon: '📋'
  },
  'layout': {
    label: 'Layout & Structure',
    description: 'Margins, sidebars, and content organization',
    icon: '📄'
  },
  'references': {
    label: 'References & Citations',
    description: 'Cross-references, citations, glossary, and index',
    icon: '🔗'
  },
  'content': {
    label: 'Content Blocks',
    description: 'Special content blocks and includes',
    icon: '📦'
  },
  'proofs-theorems': {
    label: 'Proofs & Theorems',
    description: 'Academic elements for mathematical proofs, theorems, and algorithms',
    icon: '📐'
  }
};

export const mystFeatures: MystFeature[] = [
  // ============ ADMONITIONS ============
  {
    id: 'note',
    name: 'Note',
    category: 'admonitions',
    description: 'A general informational note',
    syntax: ':::{note}\nContent here\n:::',
    example: ':::{note}\nThis is an important note for the reader.\n:::'
  },
  {
    id: 'tip',
    name: 'Tip',
    category: 'admonitions',
    description: 'A helpful tip or suggestion',
    syntax: ':::{tip}\nContent here\n:::',
    example: ':::{tip}\nHere\'s a helpful tip to improve your workflow!\n:::'
  },
  {
    id: 'hint',
    name: 'Hint',
    category: 'admonitions',
    description: 'A subtle hint or guidance',
    syntax: ':::{hint}\nContent here\n:::',
    example: ':::{hint}\nTry looking at the documentation for more examples.\n:::'
  },
  {
    id: 'important',
    name: 'Important',
    category: 'admonitions',
    description: 'Highlight critical information',
    syntax: ':::{important}\nContent here\n:::',
    example: ':::{important}\nMake sure to save your work before proceeding.\n:::'
  },
  {
    id: 'warning',
    name: 'Warning',
    category: 'admonitions',
    description: 'Warn about potential issues',
    syntax: ':::{warning}\nContent here\n:::',
    example: ':::{warning}\nThis action cannot be undone!\n:::'
  },
  {
    id: 'caution',
    name: 'Caution',
    category: 'admonitions',
    description: 'Advise caution about something',
    syntax: ':::{caution}\nContent here\n:::',
    example: ':::{caution}\nBe careful when modifying these settings.\n:::'
  },
  {
    id: 'attention',
    name: 'Attention',
    category: 'admonitions',
    description: 'Draw attention to something',
    syntax: ':::{attention}\nContent here\n:::',
    example: ':::{attention}\nPlease read this section carefully.\n:::'
  },
  {
    id: 'danger',
    name: 'Danger',
    category: 'admonitions',
    description: 'Highlight dangerous operations',
    syntax: ':::{danger}\nContent here\n:::',
    example: ':::{danger}\nThis will delete all your data permanently!\n:::'
  },
  {
    id: 'error',
    name: 'Error',
    category: 'admonitions',
    description: 'Describe an error condition',
    syntax: ':::{error}\nContent here\n:::',
    example: ':::{error}\nThis configuration is invalid and will cause failures.\n:::'
  },
  {
    id: 'seealso',
    name: 'See Also',
    category: 'admonitions',
    description: 'Reference related content',
    syntax: ':::{seealso}\nContent here\n:::',
    example: ':::{seealso}\n- [Related Topic 1](#)\n- [Related Topic 2](#)\n:::'
  },
  {
    id: 'admonition-dropdown',
    name: 'Dropdown Admonition',
    category: 'admonitions',
    description: 'Collapsible admonition that can be expanded',
    syntax: ':::{note} Title\n:class: dropdown\nContent here\n:::',
    example: ':::{note} Click to expand\n:class: dropdown\nThis content is hidden by default.\n:::'
  },
  {
    id: 'admonition-custom',
    name: 'Custom Admonition',
    category: 'admonitions',
    description: 'Admonition with custom title',
    syntax: ':::{admonition} Custom Title\n:class: tip\nContent here\n:::',
    example: ':::{admonition} Pro Tip\n:class: tip\nHere\'s an advanced technique.\n:::'
  },

  // ============ UI COMPONENTS ============
  {
    id: 'dropdown',
    name: 'Dropdown',
    category: 'ui-components',
    description: 'Collapsible content section',
    syntax: ':::{dropdown} Title\nContent here\n:::',
    example: ':::{dropdown} More Details\nThis content can be toggled.\n:::'
  },
  {
    id: 'card',
    name: 'Card',
    category: 'ui-components',
    description: 'Styled content card with optional header/footer',
    syntax: '```{card} Card Title\n:header: Header\n:footer: Footer\nCard content\n```',
    example: '```{card} Getting Started\n:header: Quick Start Guide\n:footer: Last updated: 2024\nLearn the basics of our platform.\n```'
  },
  {
    id: 'card-link',
    name: 'Clickable Card',
    category: 'ui-components',
    description: 'Card that links to another page',
    syntax: ':::{card} Title\n:link: https://example.com\nContent\n:::',
    example: ':::{card} Documentation\n:link: https://mystmd.org\nRead the full documentation.\n:::'
  },
  {
    id: 'grid',
    name: 'Grid Layout',
    category: 'ui-components',
    description: 'Responsive grid container for cards',
    syntax: '::::{grid} 1 1 2 3\n:::{card}\nCard 1\n:::\n:::{card}\nCard 2\n:::\n::::',
    example: '::::{grid} 1 1 2 3\n:::{card}\n:header: Feature 1\nDescription of feature 1\n:::\n:::{card}\n:header: Feature 2\nDescription of feature 2\n:::\n::::'
  },
  {
    id: 'tab-set',
    name: 'Tabs',
    category: 'ui-components',
    description: 'Tabbed content sections',
    syntax: '::::{tab-set}\n:::{tab-item} Tab 1\nContent 1\n:::\n:::{tab-item} Tab 2\nContent 2\n:::\n::::',
    example: '::::{tab-set}\n:::{tab-item} Python\n```python\nprint("Hello")\n```\n:::\n:::{tab-item} JavaScript\n```javascript\nconsole.log("Hello");\n```\n:::\n::::'
  },
  {
    id: 'button',
    name: 'Button',
    category: 'ui-components',
    description: 'Clickable button linking to a page',
    syntax: '{button}`Button Text <url>`',
    example: '{button}`Get Started <getting-started.md>`'
  },

  // ============ INTERACTIVE CODE EXECUTION ============
  {
    id: 'jupyterlite',
    name: 'JupyterLite',
    category: 'interactive-code',
    description: 'Full Jupyter environment running entirely in the browser - no server needed. Readers can run and modify Python code.',
    syntax: '```{code-cell} python\n:tags: [jupyterlite]\ncode here\n```',
    example: '```{code-cell} python\n:tags: [jupyterlite]\nimport numpy as np\nimport matplotlib.pyplot as plt\n\nx = np.linspace(0, 10, 100)\nplt.plot(x, np.sin(x))\nplt.show()\n```'
  },
  {
    id: 'pyodide',
    name: 'Pyodide (Python WASM)',
    category: 'interactive-code',
    description: 'Run Python code in WebAssembly - fast, serverless execution directly in the browser with no backend required.',
    syntax: '```{code-cell} python\n:tags: [pyodide]\ncode here\n```',
    example: '```{code-cell} python\n:tags: [pyodide]\nfrom js import document\n\n# Interact with the browser!\nresult = sum(range(100))\nprint(f"Sum of 0-99: {result}")\n```'
  },
  {
    id: 'thebe',
    name: 'Thebe Live Code',
    category: 'interactive-code',
    description: 'Make code cells executable by connecting to a Binder or JupyterHub kernel backend.',
    syntax: '```{code-cell} python\n:tags: [thebe-init]\ncode here\n```',
    example: '```{code-cell} python\n:tags: [thebe-init]\nimport pandas as pd\n\ndf = pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})\ndf.describe()\n```'
  },
  {
    id: 'binder-launch',
    name: 'Binder Launch Button',
    category: 'interactive-code',
    description: 'Add a button to launch the notebook in MyBinder.org for a full interactive cloud environment.',
    syntax: '[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/USER/REPO/HEAD)',
    example: '[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyter-book/jupyter-book/HEAD?labpath=docs%2Fstart%2Fyour-first-book.ipynb)\n\nClick the badge above to launch this notebook in Binder!'
  },
  {
    id: 'colab-launch',
    name: 'Google Colab Button',
    category: 'interactive-code',
    description: 'Add a button to open the notebook in Google Colab for GPU/TPU access and cloud execution.',
    syntax: '[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/USER/REPO/blob/main/notebook.ipynb)',
    example: '[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/jupyter-book/jupyter-book/blob/main/docs/tutorials/intro.ipynb)\n\nRun this notebook with free GPU access in Google Colab!'
  },
  {
    id: 'ipywidgets',
    name: 'Interactive Widgets',
    category: 'interactive-code',
    description: 'Use Jupyter widgets (ipywidgets) for interactive sliders, dropdowns, buttons, and real-time parameter changes.',
    syntax: '```{code-cell} python\nimport ipywidgets as widgets\nwidgets.IntSlider()\n```',
    example: '```{code-cell} python\nimport ipywidgets as widgets\nfrom IPython.display import display\n\nslider = widgets.IntSlider(value=50, min=0, max=100, description="Value:")\noutput = widgets.Output()\n\ndef on_change(change):\n    with output:\n        output.clear_output()\n        print(f"Slider value: {change[\'new\']}")\n\nslider.observe(on_change, names=\'value\')\ndisplay(slider, output)\n```'
  },
  {
    id: 'plotly-interactive',
    name: 'Interactive Plotly Charts',
    category: 'interactive-code',
    description: 'Create interactive Plotly visualizations that readers can zoom, pan, hover, and explore.',
    syntax: '```{code-cell} python\nimport plotly.express as px\nfig = px.scatter(...)\nfig.show()\n```',
    example: '```{code-cell} python\nimport plotly.express as px\nimport pandas as pd\n\ndf = px.data.iris()\nfig = px.scatter(df, x="sepal_width", y="sepal_length", \n                 color="species", hover_data=["petal_width"])\nfig.update_layout(title="Interactive Iris Dataset")\nfig.show()\n```'
  },
  {
    id: 'bokeh-interactive',
    name: 'Bokeh Visualizations',
    category: 'interactive-code',
    description: 'Interactive Bokeh data visualizations with pan, zoom, and linked brushing.',
    syntax: '```{code-cell} python\nfrom bokeh.plotting import figure, show\np = figure()\np.circle([1,2,3], [4,5,6])\nshow(p)\n```',
    example: '```{code-cell} python\nfrom bokeh.plotting import figure, show\nfrom bokeh.io import output_notebook\n\noutput_notebook()\n\np = figure(title="Interactive Bokeh Plot", tools="pan,wheel_zoom,box_zoom,reset")\np.circle([1, 2, 3, 4, 5], [6, 7, 2, 4, 5], size=15, color="navy", alpha=0.5)\nshow(p)\n```'
  },
  {
    id: 'altair-interactive',
    name: 'Altair Vega Charts',
    category: 'interactive-code',
    description: 'Declarative statistical visualizations with Altair/Vega-Lite, including interactive selections.',
    syntax: '```{code-cell} python\nimport altair as alt\nchart = alt.Chart(data).mark_point().encode(x=..., y=...)\nchart\n```',
    example: '```{code-cell} python\nimport altair as alt\nfrom vega_datasets import data\n\ncars = data.cars()\n\nbrush = alt.selection_interval()\n\nchart = alt.Chart(cars).mark_point().encode(\n    x=\'Horsepower:Q\',\n    y=\'Miles_per_Gallon:Q\',\n    color=alt.condition(brush, \'Origin:N\', alt.value(\'lightgray\'))\n).add_params(brush)\n\nchart\n```'
  },
  {
    id: 'code-cell',
    name: 'Executable Code Cell',
    category: 'interactive-code',
    description: 'Standard executable code cell that can be run with any configured execution backend.',
    syntax: '```{code-cell} language\ncode here\n```',
    example: '```{code-cell} python\n# This cell can be executed!\nfor i in range(5):\n    print(f"Hello {i}")\n```'
  },

  // ============ PROOFS & THEOREMS ============
  {
    id: 'theorem',
    name: 'Theorem',
    category: 'proofs-theorems',
    description: 'Mathematical theorem statement',
    syntax: ':::{prf:theorem} Theorem Name\n:label: my-theorem\nTheorem content\n:::',
    example: ':::{prf:theorem} Pythagorean Theorem\n:label: pythagoras\nFor a right triangle: $a^2 + b^2 = c^2$\n:::'
  },
  {
    id: 'proof',
    name: 'Proof',
    category: 'proofs-theorems',
    description: 'Mathematical proof',
    syntax: ':::{prf:proof}\nProof content\n:::',
    example: ':::{prf:proof}\nLet $x$ be any element. By definition...\n\nHence, the theorem is proved. $\\square$\n:::'
  },
  {
    id: 'lemma',
    name: 'Lemma',
    category: 'proofs-theorems',
    description: 'Supporting mathematical lemma',
    syntax: ':::{prf:lemma}\n:label: my-lemma\nLemma content\n:::',
    example: ':::{prf:lemma}\n:label: helper-lemma\nIf $f$ is continuous, then...\n:::'
  },
  {
    id: 'definition',
    name: 'Definition',
    category: 'proofs-theorems',
    description: 'Formal definition',
    syntax: ':::{prf:definition}\n:label: my-def\nDefinition content\n:::',
    example: ':::{prf:definition}\n:label: def-continuous\nA function $f$ is *continuous* if...\n:::'
  },
  {
    id: 'corollary',
    name: 'Corollary',
    category: 'proofs-theorems',
    description: 'Result following from a theorem',
    syntax: ':::{prf:corollary}\nCorollary content\n:::',
    example: ':::{prf:corollary}\nFrom the above theorem, it follows that...\n:::'
  },
  {
    id: 'proposition',
    name: 'Proposition',
    category: 'proofs-theorems',
    description: 'Mathematical proposition',
    syntax: ':::{prf:proposition}\nProposition content\n:::',
    example: ':::{prf:proposition}\nFor all $n > 0$, the following holds...\n:::'
  },
  {
    id: 'axiom',
    name: 'Axiom',
    category: 'proofs-theorems',
    description: 'Fundamental assumption',
    syntax: ':::{prf:axiom}\nAxiom content\n:::',
    example: ':::{prf:axiom} Axiom of Choice\nFor any collection of non-empty sets...\n:::'
  },
  {
    id: 'algorithm',
    name: 'Algorithm',
    category: 'proofs-theorems',
    description: 'Algorithm description',
    syntax: ':::{prf:algorithm} Algorithm Name\n:label: my-algo\nAlgorithm steps\n:::',
    example: ':::{prf:algorithm} Binary Search\n:label: binary-search\n1. Set low = 0, high = n-1\n2. While low <= high:\n   - mid = (low + high) / 2\n   - If arr[mid] == target: return mid\n:::'
  },
  {
    id: 'example-prf',
    name: 'Example (Proof)',
    category: 'proofs-theorems',
    description: 'Mathematical example',
    syntax: ':::{prf:example}\nExample content\n:::',
    example: ':::{prf:example}\nConsider the case where $n = 5$...\n:::'
  },
  {
    id: 'remark',
    name: 'Remark',
    category: 'proofs-theorems',
    description: 'Additional remark or observation',
    syntax: ':::{prf:remark}\nRemark content\n:::',
    example: ':::{prf:remark}\nNote that this result also applies when...\n:::'
  },
  {
    id: 'conjecture',
    name: 'Conjecture',
    category: 'proofs-theorems',
    description: 'Unproven mathematical conjecture',
    syntax: ':::{prf:conjecture}\nConjecture content\n:::',
    example: ':::{prf:conjecture} Goldbach\'s Conjecture\nEvery even integer greater than 2 can be expressed as the sum of two primes.\n:::'
  },
  {
    id: 'criterion',
    name: 'Criterion',
    category: 'proofs-theorems',
    description: 'Mathematical criterion',
    syntax: ':::{prf:criterion}\nCriterion content\n:::',
    example: ':::{prf:criterion} Convergence Criterion\nA series converges if and only if...\n:::'
  },
  {
    id: 'observation',
    name: 'Observation',
    category: 'proofs-theorems',
    description: 'Mathematical observation',
    syntax: ':::{prf:observation}\nObservation content\n:::',
    example: ':::{prf:observation}\nWe observe that the function is monotonically increasing.\n:::'
  },
  {
    id: 'property',
    name: 'Property',
    category: 'proofs-theorems',
    description: 'Mathematical property',
    syntax: ':::{prf:property}\nProperty content\n:::',
    example: ':::{prf:property}\nThe operation is both commutative and associative.\n:::'
  },
  {
    id: 'assumption',
    name: 'Assumption',
    category: 'proofs-theorems',
    description: 'Mathematical assumption',
    syntax: ':::{prf:assumption}\nAssumption content\n:::',
    example: ':::{prf:assumption}\nWe assume that all functions are differentiable.\n:::'
  },

  // ============ EXERCISES ============
  {
    id: 'exercise',
    name: 'Exercise',
    category: 'exercises',
    description: 'Practice exercise for readers',
    syntax: '```{exercise}\n:label: my-exercise\nExercise description\n```',
    example: '```{exercise}\n:label: ex-factorial\nWrite a function `factorial(n)` that returns $n!$\n```'
  },
  {
    id: 'solution',
    name: 'Solution',
    category: 'exercises',
    description: 'Solution linked to an exercise',
    syntax: '````{solution} exercise-label\n:label: my-solution\nSolution content\n````',
    example: '````{solution} ex-factorial\n:label: sol-factorial\n```python\ndef factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n-1)\n```\n````'
  },
  {
    id: 'exercise-dropdown',
    name: 'Dropdown Exercise',
    category: 'exercises',
    description: 'Exercise with hidden content',
    syntax: '```{exercise}\n:class: dropdown\nExercise content\n```',
    example: '```{exercise}\n:class: dropdown\nSolve the following integral: $\\int x^2 dx$\n```'
  },

  // ============ MATH ============
  {
    id: 'inline-math',
    name: 'Inline Math',
    category: 'math',
    description: 'Mathematical expression within text',
    syntax: '$expression$ or {math}`expression`',
    example: 'The equation $E = mc^2$ is famous.'
  },
  {
    id: 'equation-block',
    name: 'Equation Block',
    category: 'math',
    description: 'Displayed equation with optional label',
    syntax: '```{math}\n:label: my-eq\nequation\n```',
    example: '```{math}\n:label: quadratic\nx = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\n```'
  },
  {
    id: 'dollar-math',
    name: 'Dollar Math Block',
    category: 'math',
    description: 'Equation using $$ syntax',
    syntax: '$$\n\\label{my-eq}\nequation\n$$',
    example: '$$\n\\label{euler}\ne^{i\\pi} + 1 = 0\n$$'
  },
  {
    id: 'align-env',
    name: 'Aligned Equations',
    category: 'math',
    description: 'Multiple aligned equations',
    syntax: '$$\n\\begin{align}\neq1 \\\\\neq2\n\\end{align}\n$$',
    example: '$$\n\\begin{align}\na &= b + c \\\\\nd &= e + f\n\\end{align}\n$$'
  },
  {
    id: 'matrix',
    name: 'Matrix',
    category: 'math',
    description: 'Matrix notation',
    syntax: '$$\n\\begin{pmatrix}\na & b \\\\\nc & d\n\\end{pmatrix}\n$$',
    example: '$$\nA = \\begin{pmatrix}\n1 & 2 \\\\\n3 & 4\n\\end{pmatrix}\n$$'
  },

  // ============ DIAGRAMS ============
  {
    id: 'mermaid-flowchart',
    name: 'Mermaid Flowchart',
    category: 'diagrams',
    description: 'Flowchart diagram using Mermaid',
    syntax: '```{mermaid}\nflowchart LR\nA --> B --> C\n```',
    example: '```{mermaid}\nflowchart LR\n    A[Start] --> B{Decision}\n    B -->|Yes| C[Action 1]\n    B -->|No| D[Action 2]\n```'
  },
  {
    id: 'mermaid-sequence',
    name: 'Sequence Diagram',
    category: 'diagrams',
    description: 'Sequence diagram for interactions',
    syntax: '```{mermaid}\nsequenceDiagram\nA->>B: Message\n```',
    example: '```{mermaid}\nsequenceDiagram\n    Client->>Server: Request\n    Server-->>Client: Response\n```'
  },
  {
    id: 'mermaid-class',
    name: 'Class Diagram',
    category: 'diagrams',
    description: 'UML class diagram',
    syntax: '```{mermaid}\nclassDiagram\nClass01 <|-- Class02\n```',
    example: '```{mermaid}\nclassDiagram\n    Animal <|-- Dog\n    Animal <|-- Cat\n    Animal : +name\n    Animal : +makeSound()\n```'
  },
  {
    id: 'mermaid-state',
    name: 'State Diagram',
    category: 'diagrams',
    description: 'State machine diagram',
    syntax: '```{mermaid}\nstateDiagram-v2\n[*] --> State1\n```',
    example: '```{mermaid}\nstateDiagram-v2\n    [*] --> Idle\n    Idle --> Processing: Start\n    Processing --> Complete: Finish\n    Complete --> [*]\n```'
  },
  {
    id: 'mermaid-gantt',
    name: 'Gantt Chart',
    category: 'diagrams',
    description: 'Project timeline chart',
    syntax: '```{mermaid}\ngantt\ntitle Project\nsection Phase 1\nTask 1: 2024-01-01, 30d\n```',
    example: '```{mermaid}\ngantt\n    title Project Timeline\n    section Development\n    Design: 2024-01-01, 14d\n    Implementation: 2024-01-15, 30d\n```'
  },
  {
    id: 'mermaid-pie',
    name: 'Pie Chart',
    category: 'diagrams',
    description: 'Pie chart for data visualization',
    syntax: '```{mermaid}\npie title Title\n"A": 40\n"B": 60\n```',
    example: '```{mermaid}\npie title Browser Market Share\n    "Chrome": 65\n    "Firefox": 20\n    "Safari": 10\n    "Other": 5\n```'
  },

  // ============ CODE ============
  {
    id: 'code-block',
    name: 'Code Block',
    category: 'code',
    description: 'Syntax-highlighted code',
    syntax: '```language\ncode\n```',
    example: '```python\ndef hello():\n    print("Hello, World!")\n```'
  },
  {
    id: 'code-caption',
    name: 'Code with Caption',
    category: 'code',
    description: 'Labeled and captioned code block',
    syntax: '```{code} language\n:label: my-code\n:caption: Caption\ncode\n```',
    example: '```{code} python\n:label: hello-func\n:caption: A simple greeting function\ndef hello(name):\n    return f"Hello, {name}!"\n```'
  },
  {
    id: 'code-linenos',
    name: 'Code with Line Numbers',
    category: 'code',
    description: 'Code block with line numbers',
    syntax: '```{code} language\n:linenos:\ncode\n```',
    example: '```{code} python\n:linenos:\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n```'
  },
  {
    id: 'code-emphasize',
    name: 'Emphasized Lines',
    category: 'code',
    description: 'Highlight specific lines in code',
    syntax: '```{code} language\n:emphasize-lines: 2,3\ncode\n```',
    example: '```{code} python\n:emphasize-lines: 2,3\ndef process(data):\n    cleaned = clean(data)  # Important!\n    return transform(cleaned)  # Key step\n```'
  },
  {
    id: 'code-filename',
    name: 'Code with Filename',
    category: 'code',
    description: 'Show filename above code',
    syntax: '```{code} language\n:filename: filename.ext\ncode\n```',
    example: '```{code} yaml\n:filename: config.yml\nproject:\n  title: My Book\n```'
  },
  {
    id: 'literalinclude',
    name: 'Include External Code',
    category: 'code',
    description: 'Include code from external file',
    syntax: '```{literalinclude} path/to/file.py\n:language: python\n:lines: 1-10\n```',
    example: '```{literalinclude} src/main.py\n:language: python\n:start-at: def main\n:end-before: if __name__\n```'
  },

  // ============ FIGURES ============
  {
    id: 'image',
    name: 'Image',
    category: 'figures',
    description: 'Simple image with options',
    syntax: '```{image} path/to/image.png\n:alt: Alt text\n:width: 500px\n```',
    example: '```{image} images/diagram.png\n:alt: System architecture diagram\n:width: 80%\n:align: center\n```'
  },
  {
    id: 'figure',
    name: 'Figure',
    category: 'figures',
    description: 'Image with caption and label',
    syntax: '```{figure} path/to/image.png\n:label: my-fig\n:alt: Alt text\nCaption text\n```',
    example: '```{figure} images/results.png\n:label: fig-results\n:alt: Experimental results\n\nFigure 1: Results showing performance improvement.\n```'
  },
  {
    id: 'subfigure',
    name: 'Subfigures',
    category: 'figures',
    description: 'Multiple images as subfigures',
    syntax: ':::{figure}\n:label: my-fig\n![](image1.png)\n![](image2.png)\nCaption\n:::',
    example: ':::{figure}\n:label: comparison\n![Before](before.png)\n![After](after.png)\n\nComparison of before and after processing.\n:::'
  },
  {
    id: 'video',
    name: 'Video',
    category: 'figures',
    description: 'Embedded video file',
    syntax: ':::{figure} video.mp4\nVideo caption\n:::',
    example: ':::{figure} demo.mp4\nDemonstration of the feature in action.\n:::'
  },
  {
    id: 'iframe',
    name: 'Iframe (YouTube)',
    category: 'figures',
    description: 'Embed external content like YouTube',
    syntax: ':::{iframe} https://youtube.com/embed/ID\n:width: 100%\nCaption\n:::',
    example: ':::{iframe} https://www.youtube.com/embed/dQw4w9WgXcQ\n:width: 100%\nTutorial video walkthrough.\n:::'
  },

  // ============ TABLES ============
  {
    id: 'markdown-table',
    name: 'Markdown Table',
    category: 'tables',
    description: 'Standard markdown table',
    syntax: '| Col1 | Col2 |\n|------|------|\n| A    | B    |',
    example: '| Feature | Status |\n|---------|--------|\n| Auth    | Done   |\n| API     | WIP    |'
  },
  {
    id: 'list-table',
    name: 'List Table',
    category: 'tables',
    description: 'Table from list structure',
    syntax: '```{list-table} Title\n:header-rows: 1\n* - Col1\n  - Col2\n* - A\n  - B\n```',
    example: '```{list-table} Features\n:header-rows: 1\n* - Feature\n  - Description\n* - Tabs\n  - Tabbed content\n* - Cards\n  - Card layouts\n```'
  },
  {
    id: 'csv-table',
    name: 'CSV Table',
    category: 'tables',
    description: 'Table from CSV data',
    syntax: '```{csv-table} Title\n:header-rows: 1\n\nCol1,Col2\nA,B\n```',
    example: '```{csv-table} Data Summary\n:header-rows: 1\n\nMetric,Value\nUsers,1000\nRevenue,$50K\n```'
  },

  // ============ LAYOUT ============
  {
    id: 'aside',
    name: 'Aside',
    category: 'layout',
    description: 'Side content in margin',
    syntax: ':::{aside}\nSide content\n:::',
    example: ':::{aside}\nThis appears in the margin as a side note.\n:::'
  },
  {
    id: 'margin',
    name: 'Margin Note',
    category: 'layout',
    description: 'Note in the page margin',
    syntax: ':::{margin}\nMargin content\n:::',
    example: ':::{margin}\nAdditional context for the reader.\n:::'
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    category: 'layout',
    description: 'Sidebar content block',
    syntax: ':::{sidebar} Title\nSidebar content\n:::',
    example: ':::{sidebar} Quick Reference\n- Item 1\n- Item 2\n- Item 3\n:::'
  },
  {
    id: 'epigraph',
    name: 'Epigraph',
    category: 'layout',
    description: 'Quotation at chapter start',
    syntax: '> Quote text\n> -- Attribution',
    example: '> The only way to do great work is to love what you do.\n> -- Steve Jobs'
  },
  {
    id: 'blockquote',
    name: 'Blockquote',
    category: 'layout',
    description: 'Quoted text block',
    syntax: '> Quoted content',
    example: '> This is important quoted text that deserves emphasis.'
  },
  {
    id: 'pull-quote',
    name: 'Pull Quote',
    category: 'layout',
    description: 'Highlighted quote pulled from text',
    syntax: ':::{pull-quote}\nQuote content\n:::',
    example: ':::{pull-quote}\n"Design is not just what it looks like. Design is how it works."\n:::'
  },
  {
    id: 'container',
    name: 'Container',
    category: 'layout',
    description: 'Generic container for grouping content',
    syntax: ':::{container} class-name\nContent here\n:::',
    example: ':::{container} full-width\nThis content spans the full width of the page.\n:::'
  },
  {
    id: 'div',
    name: 'Div Block',
    category: 'layout',
    description: 'Generic div for custom styling',
    syntax: ':::{div} .class-name\nContent\n:::',
    example: ':::{div} .highlight-box\nThis content will be styled with the highlight-box class.\n:::'
  },
  {
    id: 'hlist',
    name: 'Horizontal List',
    category: 'layout',
    description: 'Display list items horizontally',
    syntax: ':::{hlist}\n:columns: 3\n- Item 1\n- Item 2\n- Item 3\n:::',
    example: ':::{hlist}\n:columns: 4\n- Python\n- JavaScript\n- Rust\n- Go\n:::'
  },
  {
    id: 'rubric',
    name: 'Rubric',
    category: 'layout',
    description: 'Heading without TOC entry',
    syntax: ':::{rubric} Title\n:::',
    example: ':::{rubric} Prerequisites\n:::\n\nBefore you begin, ensure you have...'
  },
  {
    id: 'centered',
    name: 'Centered Text',
    category: 'layout',
    description: 'Center-aligned text block',
    syntax: ':::{centered}\nCentered content\n:::',
    example: ':::{centered}\n★ ★ ★\n:::'
  },

  // ============ REFERENCES ============
  {
    id: 'cross-reference',
    name: 'Cross Reference',
    category: 'references',
    description: 'Link to labeled content',
    syntax: '[](#label) or {ref}`label`',
    example: 'See [](#my-figure) for details.'
  },
  {
    id: 'citation',
    name: 'Citation',
    category: 'references',
    description: 'Cite a bibliographic reference',
    syntax: '{cite}`key` or {cite:p}`key`',
    example: 'According to {cite}`smith2024`, the results show...'
  },
  {
    id: 'bibliography',
    name: 'Bibliography',
    category: 'references',
    description: 'Include bibliography section',
    syntax: '```{bibliography}\n:style: unsrt\n```',
    example: '```{bibliography}\n:filter: cited\n```'
  },
  {
    id: 'glossary',
    name: 'Glossary',
    category: 'references',
    description: 'Define glossary terms',
    syntax: '```{glossary}\nTerm\n  Definition of the term\n```',
    example: '```{glossary}\nAPI\n  Application Programming Interface\n\nSDK\n  Software Development Kit\n```'
  },
  {
    id: 'glossary-term',
    name: 'Glossary Reference',
    category: 'references',
    description: 'Reference a glossary term',
    syntax: '{term}`Term`',
    example: 'We provide a comprehensive {term}`API` for developers.'
  },
  {
    id: 'footnote',
    name: 'Footnote',
    category: 'references',
    description: 'Add a footnote',
    syntax: 'Text[^1]\n\n[^1]: Footnote content',
    example: 'This is important[^note].\n\n[^note]: Additional context here.'
  },
  {
    id: 'doc-reference',
    name: 'Document Reference',
    category: 'references',
    description: 'Link to another document in the project',
    syntax: '{doc}`path/to/document`',
    example: 'See the {doc}`getting-started` guide for more information.'
  },
  {
    id: 'numref',
    name: 'Numbered Reference',
    category: 'references',
    description: 'Reference with automatic numbering',
    syntax: '{numref}`label`',
    example: 'As shown in {numref}`fig-results`, the values increased.'
  },
  {
    id: 'eq-reference',
    name: 'Equation Reference',
    category: 'references',
    description: 'Reference to a labeled equation',
    syntax: '{eq}`equation-label`',
    example: 'Using {eq}`quadratic-formula`, we can solve for x.'
  },
  {
    id: 'index-entry',
    name: 'Index Entry',
    category: 'references',
    description: 'Add an entry to the book index',
    syntax: '{index}`term` or {index}`term; subterm`',
    example: 'Python {index}`Python` is a programming language {index}`programming; languages`.'
  },

  // ============ TYPOGRAPHY & INLINE FEATURES ============
  {
    id: 'abbreviation',
    name: 'Abbreviation',
    category: 'content',
    description: 'Define abbreviations with hover tooltips',
    syntax: '{abbr}`ABBR (Full Expansion)`',
    example: '{abbr}`MyST (Markedly Structured Text)` is a powerful markdown extension.'
  },
  {
    id: 'subscript',
    name: 'Subscript',
    category: 'content',
    description: 'Subscript text for formulas and notation',
    syntax: '{sub}`text`',
    example: 'Water is H{sub}`2`O.'
  },
  {
    id: 'superscript',
    name: 'Superscript',
    category: 'content',
    description: 'Superscript text for exponents and references',
    syntax: '{sup}`text`',
    example: 'The area is 100m{sup}`2`.'
  },
  {
    id: 'keyboard',
    name: 'Keyboard Shortcut',
    category: 'content',
    description: 'Display keyboard keys and shortcuts',
    syntax: '{kbd}`Ctrl+C`',
    example: 'Press {kbd}`Ctrl+C` to copy and {kbd}`Ctrl+V` to paste.'
  },
  {
    id: 'underline',
    name: 'Underline',
    category: 'content',
    description: 'Underlined text',
    syntax: '{u}`underlined text`',
    example: 'This is {u}`underlined` for emphasis.'
  },
  {
    id: 'strikethrough',
    name: 'Strikethrough',
    category: 'content',
    description: 'Strikethrough/deleted text',
    syntax: '{del}`deleted text`',
    example: 'The old value was {del}`100` and is now 200.'
  },
  {
    id: 'smallcaps',
    name: 'Small Caps',
    category: 'content',
    description: 'Small capitals typography',
    syntax: '{sc}`Small Caps Text`',
    example: 'Authored by {sc}`John Smith`.'
  },
  {
    id: 'chemical-formula',
    name: 'Chemical Formula',
    category: 'math',
    description: 'Properly formatted chemical formulas',
    syntax: '{chem}`H2O`',
    example: 'Water ({chem}`H2O`) is essential. Glucose is {chem}`C6H12O6`.'
  },
  {
    id: 'si-units',
    name: 'SI Units',
    category: 'math',
    description: 'Properly formatted SI units with numbers',
    syntax: '{si}`10 m/s`',
    example: 'The speed was {si}`299792458 m/s` (speed of light).'
  },
  {
    id: 'download-link',
    name: 'Download Link',
    category: 'content',
    description: 'Link to download a file',
    syntax: '{download}`filename <path/to/file>`',
    example: 'Download the {download}`sample data <data/sample.csv>` to follow along.'
  },
  {
    id: 'topic',
    name: 'Topic Block',
    category: 'layout',
    description: 'Self-contained topic or sidebar',
    syntax: ':::{topic} Title\nContent here\n:::',
    example: ':::{topic} Key Concept\nThis is an important concept that stands apart from the main text.\n:::'
  },

  // ============ API DOCUMENTATION ============
  {
    id: 'versionadded',
    name: 'Version Added',
    category: 'content',
    description: 'Mark content as added in a specific version',
    syntax: ':::{versionadded} 1.0\nDescription of addition\n:::',
    example: ':::{versionadded} 2.0\nThis feature was added in version 2.0.\n:::'
  },
  {
    id: 'versionchanged',
    name: 'Version Changed',
    category: 'content',
    description: 'Mark content as changed in a specific version',
    syntax: ':::{versionchanged} 1.2\nDescription of change\n:::',
    example: ':::{versionchanged} 1.5\nThe default value changed from `true` to `false`.\n:::'
  },
  {
    id: 'deprecated',
    name: 'Deprecated',
    category: 'content',
    description: 'Mark content as deprecated',
    syntax: ':::{deprecated} 1.0\nDescription\n:::',
    example: ':::{deprecated} 3.0\nThis method will be removed in version 4.0. Use `newMethod()` instead.\n:::'
  },
  {
    id: 'guilabel',
    name: 'GUI Label',
    category: 'content',
    description: 'Reference GUI elements like buttons and menus',
    syntax: '{guilabel}`Label`',
    example: 'Click {guilabel}`File` then {guilabel}`Save As...` to export.'
  },
  {
    id: 'menuselection',
    name: 'Menu Selection',
    category: 'content',
    description: 'Show menu navigation path',
    syntax: '{menuselection}`Menu --> Submenu --> Item`',
    example: 'Navigate to {menuselection}`Settings --> Preferences --> Display`.'
  },
  {
    id: 'file-role',
    name: 'File Path',
    category: 'content',
    description: 'Reference file or directory paths',
    syntax: '{file}`path/to/file`',
    example: 'Edit the configuration in {file}`config/settings.yml`.'
  },
  {
    id: 'command',
    name: 'Command',
    category: 'content',
    description: 'Reference shell commands',
    syntax: '{command}`command-name`',
    example: 'Run {command}`pip install` to install dependencies.'
  },
  {
    id: 'envvar',
    name: 'Environment Variable',
    category: 'content',
    description: 'Reference environment variables',
    syntax: '{envvar}`VAR_NAME`',
    example: 'Set the {envvar}`API_KEY` environment variable before running.'
  },
  {
    id: 'option',
    name: 'Command Option',
    category: 'content',
    description: 'Reference command-line options',
    syntax: '{option}`--flag`',
    example: 'Use {option}`--verbose` for detailed output or {option}`-q` for quiet mode.'
  },
  {
    id: 'regexp',
    name: 'Regular Expression',
    category: 'content',
    description: 'Display regular expression patterns',
    syntax: '{regexp}`pattern`',
    example: 'Match email addresses with {regexp}`[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}`.'
  },

  // ============ CONTENT BLOCKS ============
  {
    id: 'include',
    name: 'Include File',
    category: 'content',
    description: 'Include content from another file',
    syntax: '```{include} path/to/file.md\n```',
    example: '```{include} chapters/intro.md\n```'
  },
  {
    id: 'embed',
    name: 'Embed',
    category: 'content',
    description: 'Embed content from another location',
    syntax: ':::{embed} #label\n:::',
    example: ':::{embed} #my-figure\n:::'
  },
  {
    id: 'toctree',
    name: 'Table of Contents',
    category: 'content',
    description: 'Generate table of contents',
    syntax: '```{toctree}\n:maxdepth: 2\nchapter1\nchapter2\n```',
    example: '```{toctree}\n:maxdepth: 2\n:caption: Contents\n\nintro\ngetting-started\nadvanced\n```'
  },
  {
    id: 'raw',
    name: 'Raw Content',
    category: 'content',
    description: 'Include raw format-specific content',
    syntax: '```{raw} html\n<div>Raw HTML</div>\n```',
    example: '```{raw} html\n<div class="custom-widget">\n  <button>Click me</button>\n</div>\n```'
  },
  {
    id: 'only',
    name: 'Conditional Content',
    category: 'content',
    description: 'Show content only in specific formats',
    syntax: ':::{only} html\nHTML-only content\n:::',
    example: ':::{only} html\nThis interactive widget only works on the web.\n:::'
  },

  // ============ JUPYTER BOOK SPECIFIC ============
  {
    id: 'toggle',
    name: 'Toggle Block',
    category: 'ui-components',
    description: 'Collapsible content that readers can show/hide',
    syntax: '```{toggle}\nHidden content here\n```',
    example: '```{toggle}\nClick to reveal this hidden content!\n\n![Hidden image](image.png)\n```'
  },
  {
    id: 'hide-input',
    name: 'Hide Code Input',
    category: 'interactive-code',
    description: 'Hide code input but show output with reveal button',
    syntax: '```{code-cell} python\n:tags: [hide-input]\ncode here\n```',
    example: '```{code-cell} python\n:tags: [hide-input]\nimport matplotlib.pyplot as plt\nplt.plot([1,2,3])\nplt.show()\n```'
  },
  {
    id: 'hide-output',
    name: 'Hide Code Output',
    category: 'interactive-code',
    description: 'Show code but hide output with reveal button',
    syntax: '```{code-cell} python\n:tags: [hide-output]\ncode here\n```',
    example: '```{code-cell} python\n:tags: [hide-output]\n# Output hidden - click to reveal\nprint("Hidden result!")\n```'
  },
  {
    id: 'hide-cell',
    name: 'Hide Entire Cell',
    category: 'interactive-code',
    description: 'Hide both code and output with reveal button',
    syntax: '```{code-cell} python\n:tags: [hide-cell]\ncode here\n```',
    example: '```{code-cell} python\n:tags: [hide-cell]\n# This entire cell is hidden\nsetup_function()\n```'
  },
  {
    id: 'remove-input',
    name: 'Remove Code Input',
    category: 'interactive-code',
    description: 'Completely remove code input, only show output',
    syntax: '```{code-cell} python\n:tags: [remove-input]\ncode here\n```',
    example: '```{code-cell} python\n:tags: [remove-input]\n# Code is completely removed from output\ncreate_visualization()\n```'
  },
  {
    id: 'remove-output',
    name: 'Remove Code Output',
    category: 'interactive-code',
    description: 'Show code but completely remove output',
    syntax: '```{code-cell} python\n:tags: [remove-output]\ncode here\n```',
    example: '```{code-cell} python\n:tags: [remove-output]\n# Output is completely removed\ninstall_dependencies()\n```'
  },
  {
    id: 'remove-cell',
    name: 'Remove Entire Cell',
    category: 'interactive-code',
    description: 'Completely remove cell from rendered output',
    syntax: '```{code-cell} python\n:tags: [remove-cell]\ncode here\n```',
    example: '```{code-cell} python\n:tags: [remove-cell]\n# Cell is completely removed\ninternal_setup()\n```'
  },
  {
    id: 'glue',
    name: 'Glue Output',
    category: 'interactive-code',
    description: 'Save and reuse code outputs elsewhere in the book',
    syntax: 'from myst_nb import glue\nglue("variable_name", value)',
    example: '```{code-cell} python\nfrom myst_nb import glue\nimport pandas as pd\n\ndf = pd.DataFrame({"A": [1,2,3]})\nglue("my_dataframe", df)\n```\n\nLater reference: {glue:}`my_dataframe`'
  },
  {
    id: 'definition-list',
    name: 'Definition List',
    category: 'content',
    description: 'Terms with their definitions',
    syntax: 'Term\n: Definition',
    example: 'API\n: Application Programming Interface\n\nSDK\n: Software Development Kit'
  },
  {
    id: 'substitution',
    name: 'Substitution Variable',
    category: 'content',
    description: 'Define reusable text variables',
    syntax: '---\nmyst:\n  substitutions:\n    key: value\n---\n\n{{ key }}',
    example: '---\nmyst:\n  substitutions:\n    project_name: "My Book"\n---\n\nWelcome to {{ project_name }}!'
  },
  {
    id: 'badge',
    name: 'Badge',
    category: 'ui-components',
    description: 'Colored badges for labels and status indicators',
    syntax: '{bdg-primary}`text` or {bdg-success}`text`',
    example: '{bdg-primary}`Primary` {bdg-success}`Success` {bdg-warning}`Warning` {bdg-danger}`Danger`'
  },
  {
    id: 'button-link',
    name: 'Button Link',
    category: 'ui-components',
    description: 'Styled button that links to a page',
    syntax: '```{button-link} url\n:color: primary\nButton Text\n```',
    example: '```{button-link} https://jupyterbook.org\n:color: primary\n:shadow:\nVisit Jupyter Book\n```'
  },
  {
    id: 'button-ref',
    name: 'Button Reference',
    category: 'ui-components',
    description: 'Styled button that links to internal content',
    syntax: '```{button-ref} label\n:color: info\nButton Text\n```',
    example: '```{button-ref} getting-started\n:color: info\n:class: stretched-link\nGet Started\n```'
  },
  {
    id: 'grid-item',
    name: 'Grid Item',
    category: 'ui-components',
    description: 'Individual item within a grid layout',
    syntax: ':::{grid-item}\n:columns: 6\nContent\n:::',
    example: '::::{grid}\n:::{grid-item}\n:columns: 4\nLeft column\n:::\n:::{grid-item}\n:columns: 8\nRight column\n:::\n::::'
  },
  {
    id: 'grid-item-card',
    name: 'Grid Item Card',
    category: 'ui-components',
    description: 'Card within a grid layout',
    syntax: ':::{grid-item-card} Title\nCard content\n:::',
    example: '::::{grid}\n:gutter: 3\n:::{grid-item-card} Feature 1\nDescription of feature 1\n:::\n:::{grid-item-card} Feature 2\nDescription of feature 2\n:::\n::::'
  }
];

// Helper to get features by category
export function getFeaturesByCategory(category: MystFeatureCategory): MystFeature[] {
  return mystFeatures.filter(f => f.category === category);
}

// Helper to get all categories with their features
export function getAllCategoriesWithFeatures(): { category: MystFeatureCategory; info: typeof featureCategories[MystFeatureCategory]; features: MystFeature[] }[] {
  return Object.entries(featureCategories).map(([key, info]) => ({
    category: key as MystFeatureCategory,
    info,
    features: getFeaturesByCategory(key as MystFeatureCategory)
  }));
}

// Get feature by ID
export function getFeatureById(id: string): MystFeature | undefined {
  return mystFeatures.find(f => f.id === id);
}

// Alias for backward compatibility
export const MYST_FEATURES_DATA = mystFeatures;
