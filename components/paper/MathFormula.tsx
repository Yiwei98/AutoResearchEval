import katex from "katex";

interface MathFormulaProps {
  expression: string;
  label: string;
  className?: string;
  displayMode?: boolean;
}

export function MathFormula({
  expression,
  label,
  className,
  displayMode = false,
}: MathFormulaProps) {
  const markup = katex.renderToString(expression, {
    displayMode,
    output: "htmlAndMathml",
    strict: "error",
    throwOnError: true,
    trust: false,
  });

  const Element = displayMode ? "div" : "span";

  return (
    <Element
      className={className}
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
