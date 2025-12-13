import { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/dist/contrib/auto-render.mjs';

/**
 * Component to render text containing LaTeX formulas using KaTeX.
 * Auto-renders math within delimiters like $...$ or $$...$$.
 */
const MathRenderer = ({ text, block = false }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current && text) {
            // 1. Set the text content
            containerRef.current.textContent = text;

            // 2. Auto-render math in the element
            try {
                renderMathInElement(containerRef.current, {
                    delimiters: [
                        { left: '$$', right: '$$', display: true },
                        { left: '$', right: '$', display: false },
                        { left: '\\(', right: '\\)', display: false },
                        { left: '\\[', right: '\\]', display: true }
                    ],
                    throwOnError: false
                });
            } catch (error) {
                console.error('KaTeX auto-render error:', error);
            }
        }
    }, [text]);

    return <span ref={containerRef} className={block ? 'math-block' : 'math-inline'} />;
};

export default MathRenderer;
