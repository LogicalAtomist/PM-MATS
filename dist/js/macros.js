const principiaMacros = {
  // Logical Symbols
  pmthm: "{\\vdash}",
  pmimp: "{\\supset}",
  pmnot: "{\\sim}",
  pmand: "{\\cdot}",
  pmor: "{\\lor}",
  pmequiv: "{\\equiv}",
  pmuniv: "{\\forall}",
  pmexist: "{\\exists}",
  pmid: "{\\mid}",
  pmiff: "{\\leftrightarrow}",
  pmthen: "{\\rightarrow}",
  pmproves: "{\\vdash}",

  // Dots and Punctuation
  pmd: "{\\rule{.3ex}{.3ex}}",
  pmdd: "{\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}",
  pmdot: "{\\mathinner{\\rule{.3ex}{.3ex}}}",
  pmdott: "{\\mathinner{\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}}",
  pmdottt: "{\\mathinner{\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}\\hspace{1pt}\\rule{.3ex}{.3ex}}}",
  pmdotttt: "{\\mathinner{\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}\\hspace{1pt}\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}}",
  pmdottttt: "{\\mathinner{\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}\\hspace{1pt}\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}\\hspace{1pt}\\rule{.3ex}{.3ex}}}",
  pmdotttttt: "{\\mathinner{\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}\\hspace{1pt}\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}\\hspace{1pt}\\overset{\\rule{.3ex}{.3ex}}{\\rule{.3ex}{.3ex}}}}",

  // Using Unicode for pmast and pmcdot
  pmast: "{\\text{❋}}",
  pmcdot: "{\\text{˙}}",

  pmcomma: "{\\,,}",
  pmsemicolon: "{\\,;\\,}",
  pmcolon: "{\\,:\\,}",
  pmquad: "{\\quad}",

  // Substitution Macros
  pmsub: ["{\\bigg[ \\small \\begin{array}{c} #1 \\\\ \\hline #2 \\end{array} \\bigg]}", 2],
  pmsubb: ["{\\bigg[ \\small \\begin{array}{cc} #1 & #3 \\\\ \\hline #2 & #4 \\end{array} \\bigg]}", 4],

  // Mathematical Operators
  pmplus: "{+}",
  pmminus: "{-}",
  pmtimes: "{\\times}",
  pmdiv: "{\\div}",
  pmleq: "{\\leq}",
  pmgeq: "{\\geq}",
  pmelement: "{\\in}",
  pmnotelement: "{\\notin}",
  pmsubset: "{\\subset}",
  pmsupset: "{\\supset}",
  pmemptyset: "{\\emptyset}",

  // Greek Letters
  pmalpha: "{\\alpha}",
  pmbeta: "{\\beta}",
  pmgamma: "{\\gamma}",
  pmdelta: "{\\delta}",
  pmvarepsilon: "{\\varepsilon}",
  pmtheta: "{\\theta}",
  pmlambda: "{\\lambda}",
  pmxi: "{\\xi}",
  pmrho: "{\\rho}",
  pmphi: "{\\phi}",
  pmpsi: "{\\psi}",
  pmomega: "{\\omega}",

  // Miscellaneous Symbols
  pmperp: "{\\perp}",
  pmangle: "{\\angle}",
  pminfty: "{\\infty}",
  pmdegree: "{^\\circ}",
  pmprime: "{^\\prime}",
  pmnabla: "{\\nabla}",
  pmpartial: "{\\partial}",

  // Delimiters
  pmabs: ["{\\left| #1 \\right|}", 1],
  pmnorm: ["{\\left\\| #1 \\right\\|}", 1],
  pmfloor: ["{\\left\\lfloor #1 \\right\\rfloor}", 1],
  pmceil: ["{\\left\\lceil #1 \\right\\rceil}", 1],

  // Functions
  pmsin: "{\\sin}",
  pmcos: "{\\cos}",
  pmtan: "{\\tan}",
  pmlog: "{\\log}",
  pmln: "{\\ln}",
  pmexp: "{\\exp}",

  // Arrows
  pmrightarrow: "{\\rightarrow}",
  pmleftarrow: "{\\leftarrow}",
  pmleftrightarrow: "{\\leftrightarrow}",
  pmuparrow: "{\\uparrow}",
  pmdownarrow: "{\\downarrow}",
  pmmapsto: "{\\mapsto}",

  // Sets and Logic
  pmset: ["{\\left\\{ #1 \\right\\}}", 1],
  pmfunc: ["{#1\\colon #2 \\rightarrow #3}", 3],

  // Formatting Macros
  pmbf: ["{\\mathbf{#1}}", 1],
  pmit: ["{\\mathit{#1}}", 1],
  pmsf: ["{\\mathsf{#1}}", 1],
  pmmathbb: ["{\\mathbb{#1}}", 1],
  pmmathcal: ["{\\mathcal{#1}}", 1],

  // Special Macros
  pmtext: ["{\\text{#1}}", 1],
  pmfrac: ["{\\dfrac{#1}{#2}}", 2],
  pmsqrt: ["{\\sqrt{#1}}", 1],
  pmoverline: ["{\\overline{#1}}", 1],
  pmunderline: ["{\\underline{#1}}", 1],

  // Limits and Integrals
  pmsum: ["{\\sum_{#1}^{#2}}", 2],
  pmintegral: ["{\\int_{#1}^{#2}}", 2],
  pmlim: ["{\\lim_{#1 \\to #2}}", 2],

  // Accents
  pmhat: ["{\\hat{#1}}", 1],
  pmtilde: ["{\\tilde{#1}}", 1],
  pmbar: ["{\\bar{#1}}", 1],
  pmdotaccent: ["{\\dot{#1}}", 1],
  pmdoublehat: ["{\\widehat{#1}}", 1],

  // Brackets
  pmparen: ["{\\left( #1 \\right)}", 1],
  pmbracket: ["{\\left[ #1 \\right]}", 1],
  pmbraces: ["{\\left\\{ #1 \\right\\}}", 1],

  // Matrix and Arrays
  pmmatrix: ["{\\begin{matrix} #1 \\end{matrix}}", 1],
  pmbmatrix: ["{\\begin{bmatrix} #1 \\end{bmatrix}}", 1],
  pmvmatrix: ["{\\begin{vmatrix} #1 \\end{vmatrix}}", 1],
  pmpmatrix: ["{\\begin{pmatrix} #1 \\end{pmatrix}}", 1],

  // Additional Logical Symbols
  pmnand: "{\\barwedge}",
  pmnor: "{\\barvee}",
  pmxor: "{\\veebar}",

  // Miscellaneous
  pmtriangle: "{\\triangle}",
  pmcircle: "{\\circ}",
  pmbullet: "{\\bullet}",
  pmstar: "{\\star}",
  pmclubsuit: "{\\clubsuit}",
  pmheartsuit: "{\\heartsuit}",
  pmspadesuit: "{\\spadesuit}",
  pmdiamondsuit: "{\\diamondsuit}"
}
