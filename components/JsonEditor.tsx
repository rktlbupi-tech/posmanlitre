import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css'; // Light theme default

interface JsonEditorProps {
    value: string;
    onChange: (value: string) => void;
    isDark?: boolean;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, isDark = false }) => {
    return (
        <div className={`border rounded overflow-hidden ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
            <Editor
                value={value}
                onValueChange={onChange}
                highlight={code => highlight(code, languages.json, 'json')}
                padding={10}
                style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                    backgroundColor: 'transparent',
                    minHeight: '200px',
                    color: isDark ? '#f8f8f2' : '#000', // Basic color adjustment
                }}
                className="min-h-[200px]"
                textareaClassName="focus:outline-none"
            />
            <style>{`
        /* Override Prism styles for dark mode if needed, or rely on global styles */
        /* This is a bit hacky for scoped styles without CSS modules, but works for simple cases */
        ${isDark ? `
          code[class*="language-"], pre[class*="language-"] {
            color: #f8f8f2;
            text-shadow: 0 1px rgba(0, 0, 0, 0.3);
          }
          .token.property { color: #9cdcfe; }
          .token.string { color: #ce9178; }
          .token.number { color: #b5cea8; }
          .token.boolean { color: #569cd6; }
          .token.punctuation { color: #d4d4d4; }
        ` : `
          .token.property { color: #905; }
          .token.string { color: #690; }
          .token.number { color: #905; }
        `}
        
        /* Ensure wrapping */
        pre, code, textarea {
          white-space: pre-wrap !important;
          word-break: break-all;
        }
      `}</style>
        </div>
    );
};

export default JsonEditor;
