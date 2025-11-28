import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonViewerProps {
    data: any;
    isDark?: boolean;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, isDark = false }) => {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    return (
        <SyntaxHighlighter
            language="json"
            style={isDark ? vscDarkPlus : vs}
            customStyle={{
                margin: 0,
                padding: '1rem',
                background: 'transparent',
                fontSize: '0.875rem', // text-sm
                lineHeight: '1.5',
            }}
            wrapLongLines={true}
        >
            {jsonString}
        </SyntaxHighlighter>
    );
};

export default JsonViewer;
