import React, { useState, useEffect, useRef } from 'react';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/themes/prism.css';
import { KeyValueItem } from '../types';

interface VariableInputProps {
    value: string;
    onChange: (value: string) => void;
    variables: KeyValueItem[];
    placeholder?: string;
    className?: string;
    isDark?: boolean;
}

const VariableInput: React.FC<VariableInputProps> = ({ value, onChange, variables, placeholder, className, isDark }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionQuery, setSuggestionQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Custom highlighting for {{variable}}
    const highlightWithVariables = (code: string) => {
        // We can use a simple regex replacement for highlighting since we just want to color {{...}}
        // But to play nice with Prism, we can define a custom grammar or just wrap matches in spans manually if simple enough.
        // Let's use a simple manual approach for this specific use case as it's lighter than full Prism grammar for just one token type.

        return code.split(/(\{\{[^}]*\}\}|\{\{[^}]*$)/g).map((part, i) => {
            if (part.startsWith('{{')) {
                return `<span class="variable-token" style="color: #3b82f6;">${part}</span>`;
            }
            // Escape HTML entities for the rest
            return part.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        }).join('');
    };

    const handleChange = (newValue: string) => {
        onChange(newValue);
    };

    // Handle cursor position to show suggestions
    // This is a bit tricky with react-simple-code-editor as it doesn't expose cursor position in onChange directly easily without ref access to textarea.
    // We can use onKeyUp/onClick to track cursor.
    const handleSelectionChange = (e: any) => {
        const target = e.target as HTMLTextAreaElement;
        const pos = target.selectionStart;
        setCursorPosition(pos);

        // Check if we are inside a {{ block that isn't closed or just opened
        const textBeforeCursor = value.substring(0, pos);
        const lastOpenBraces = textBeforeCursor.lastIndexOf('{{');
        const lastCloseBraces = textBeforeCursor.lastIndexOf('}}');

        if (lastOpenBraces !== -1 && (lastCloseBraces === -1 || lastCloseBraces < lastOpenBraces)) {
            // We are inside {{
            const query = textBeforeCursor.substring(lastOpenBraces + 2);
            // Check if query contains newline, if so, probably not a variable
            if (!query.includes('\n')) {
                setSuggestionQuery(query);
                setShowSuggestions(true);
                return;
            }
        }
        setShowSuggestions(false);
    };

    const handleSuggestionClick = (variableName: string) => {
        const textBeforeCursor = value.substring(0, cursorPosition);
        const textAfterCursor = value.substring(cursorPosition);

        const lastOpenBraces = textBeforeCursor.lastIndexOf('{{');
        const prefix = textBeforeCursor.substring(0, lastOpenBraces);

        const newValue = `${prefix}{{${variableName}}}${textAfterCursor}`;
        onChange(newValue);
        setShowSuggestions(false);

        // We'd ideally move cursor to end of inserted variable, but that requires ref to editor instance which is hard with simple-code-editor wrapper.
        // User will have to click or type again, which is acceptable for MVP.
    };

    // Filter variables
    const filteredVariables = variables.filter(v =>
        v.key.toLowerCase().includes(suggestionQuery.toLowerCase()) && v.enabled
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className={`border rounded-md overflow-hidden flex items-center ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                <Editor
                    value={value}
                    onValueChange={handleChange}
                    highlight={highlightWithVariables}
                    padding={8}
                    style={{
                        fontFamily: 'inherit',
                        fontSize: 14,
                        minHeight: '38px', // Match standard input height
                        lineHeight: '20px',
                        color: isDark ? '#f8f8f2' : '#0f172a',
                    }}
                    textareaClassName="focus:outline-none"
                    onKeyUp={handleSelectionChange}
                    onClick={handleSelectionChange}
                    placeholder={placeholder}
                />
            </div>

            {showSuggestions && filteredVariables.length > 0 && (
                <div className={`absolute z-50 left-0 mt-1 w-64 max-h-48 overflow-y-auto rounded-md shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    {filteredVariables.map(v => (
                        <button
                            key={v.id}
                            className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center hover:bg-slate-100 dark:hover:bg-slate-700 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                            onClick={() => handleSuggestionClick(v.key)}
                        >
                            <span className="font-medium">{v.key}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[100px]">{v.value}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VariableInput;
