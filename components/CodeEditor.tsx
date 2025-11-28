import React from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism.css'; // Light theme default

interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    isDark?: boolean;
    language?: 'json' | 'javascript';
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, isDark = false, language = 'json' }) => {
    return (
        <div className={`border rounded overflow-hidden flex flex-col h-full ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
            <div className="flex-1 overflow-auto relative">
                <Editor
                    value={value}
                    onValueChange={onChange}
                    highlight={code => highlight(code, language === 'json' ? languages.json : languages.javascript, language)}
                    padding={10}
                    style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                        fontSize: 12,
                        backgroundColor: 'transparent',
                        minHeight: '100%',
                        color: isDark ? '#f8f8f2' : '#000',
                    }}
                    className="min-h-full"
                    textareaClassName="focus:outline-none"
                />
            </div>
            <style>{`
        /* Override Prism styles for dark mode if needed */
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
          .token.keyword { color: #569cd6; }
          .token.function { color: #dcdcaa; }
          .token.comment { color: #6a9955; }
          .token.operator { color: #d4d4d4; }
          .token.variable { color: #9cdcfe; }
        ` : `
          .token.property { color: #905; }
          .token.string { color: #690; }
          .token.number { color: #905; }
          .token.keyword { color: #07a; }
          .token.function { color: #dd4a68; }
          .token.comment { color: #708090; }
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

export default CodeEditor;
