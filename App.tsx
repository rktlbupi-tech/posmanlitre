import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/HistorySidebar';
import { Button, Input, Select, Badge } from './components/UI';
import { KeyValueEditor } from './components/KeyValueEditor';
import { generateCurl, generateFetch } from './utils/codeGen';
import { ApiRequest, ApiResponse, Collection, KeyValueItem, Tab, ResponseTab } from './types';
import { Send, Save, Download, Copy, Code, Sun, Moon, Menu, AlertCircle } from 'lucide-react';

const DEFAULT_REQUEST: ApiRequest = {
  id: '',
  name: 'New Request',
  method: 'GET',
  url: 'https://jsonplaceholder.typicode.com/todos/1',
  params: [{ id: '1', key: '', value: '', enabled: true }],
  headers: [{ id: '1', key: 'Accept', value: '*/*', enabled: true }],
  auth: { type: 'none' },
  body: { type: 'none', raw: '' },
};

function App() {
  // --- State ---
  const [request, setRequest] = useState<ApiRequest>({ ...DEFAULT_REQUEST, id: crypto.randomUUID() });
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('params');
  const [activeResponseTab, setActiveResponseTab] = useState<ResponseTab>('body');
  
  const [history, setHistory] = useState<ApiRequest[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showCode, setShowCode] = useState(false);
  
  // --- Effects ---

  // Load from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('postman_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedCollections = localStorage.getItem('postman_collections');
    if (savedCollections) setCollections(JSON.parse(savedCollections));

    // Theme check
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('postman_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('postman_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Sync URL Params
  useEffect(() => {
    // Only update params if URL changes and we are not focusing params input
    // This is a simplified one-way sync from Params -> URL to avoid circular loop in this MVP
    // Ideally, we parse URL params into the table when URL changes.
  }, [request.url]);


  // --- Handlers ---

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    const startTime = performance.now();

    try {
      // Prepare URL with params
      const urlObj = new URL(request.url);
      request.params.forEach(p => {
        if (p.enabled && p.key) urlObj.searchParams.append(p.key, p.value);
      });

      // Prepare Headers
      const headers: Record<string, string> = {};
      request.headers.forEach(h => {
        if (h.enabled && h.key) headers[h.key] = h.value;
      });

      // Auth headers
      if (request.auth.type === 'bearer' && request.auth.token) {
        headers['Authorization'] = `Bearer ${request.auth.token}`;
      } else if (request.auth.type === 'basic') {
        headers['Authorization'] = `Basic ${btoa(`${request.auth.username}:${request.auth.password}`)}`;
      }

      // Prepare Body
      let body: any = undefined;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        if (request.body.type === 'json') {
          body = request.body.raw;
          headers['Content-Type'] = 'application/json';
        }
        // Multipart/Form-data would go here (requires FormData object)
      }

      const res = await fetch(urlObj.toString(), {
        method: request.method,
        headers,
        body,
      });

      const endTime = performance.now();
      const size = res.headers.get('content-length') ? parseInt(res.headers.get('content-length')!) : 0;
      
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      // Convert Headers to record
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => { resHeaders[key] = val; });

      const apiResponse: ApiResponse = {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        data,
        size,
        time: Math.round(endTime - startTime),
        timestamp: Date.now(),
      };

      setResponse(apiResponse);
      addToHistory({ ...request, url: urlObj.toString() });

    } catch (error: any) {
      setResponse({
        status: 0,
        statusText: 'Network Error',
        headers: {},
        data: { error: error.message, hint: 'Check CORS or network connection.' },
        size: 0,
        time: 0,
        timestamp: Date.now(),
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (req: ApiRequest) => {
    setHistory(prev => {
        const newHist = [req, ...prev.filter(r => r.id !== req.id)].slice(0, 50); // Keep last 50
        return newHist;
    });
  };

  const handleParamsChange = (newParams: KeyValueItem[]) => {
    setRequest(prev => {
        // Update URL based on params
        try {
            const url = new URL(prev.url);
            // Clear existing
            const keys = Array.from(url.searchParams.keys());
            keys.forEach(key => url.searchParams.delete(key));
            
            newParams.forEach(p => {
                if (p.enabled && p.key) url.searchParams.append(p.key, p.value);
            });
            return { ...prev, params: newParams, url: url.toString() };
        } catch (e) {
            // If URL is invalid, just update params
            return { ...prev, params: newParams };
        }
    });
  };

  // --- Render Helpers ---

  const renderResponseStatus = (status: number) => {
    if (status === 0) return <Badge variant="error">Error</Badge>;
    if (status >= 200 && status < 300) return <Badge variant="success">{status} OK</Badge>;
    if (status >= 400) return <Badge variant="error">{status}</Badge>;
    return <Badge variant="warning">{status}</Badge>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add toast here
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        history={history}
        collections={collections}
        onLoadRequest={(r) => { setRequest({ ...r, id: crypto.randomUUID() }); setResponse(null); }}
        onDeleteHistory={(id) => setHistory(h => h.filter(x => x.id !== id))}
        onCreateCollection={() => {
            const name = prompt("Collection Name:");
            if (name) setCollections([...collections, { id: crypto.randomUUID(), name, requests: [] }]);
        }}
        onDeleteCollection={(id) => setCollections(c => c.filter(x => x.id !== id))}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                <Menu size={18} />
            </button>
            <h1 className="font-bold text-lg tracking-tight">Postman<span className="text-primary">Lite</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowCode(!showCode)}><Code size={16} className="mr-2" /> Code</Button>
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </header>

        {/* Request Builder Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            {/* URL Bar */}
            <div className="flex gap-2 mb-4">
                <div className="w-32 shrink-0">
                    <Select 
                        value={request.method} 
                        onChange={(val) => setRequest({ ...request, method: val as any })}
                        options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map(m => ({ label: m, value: m }))}
                    />
                </div>
                <div className="flex-1">
                    <Input 
                        placeholder="Enter URL or paste text" 
                        value={request.url} 
                        onChange={(e) => setRequest({ ...request, url: e.target.value })} 
                    />
                </div>
                <Button onClick={handleSend} disabled={loading} className="w-24">
                   {loading ? 'Sending...' : <><Send size={16} className="mr-2" /> Send</>}
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
                {['params', 'headers', 'auth', 'body'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as Tab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab 
                            ? 'border-primary text-primary' 
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {tab === 'params' && request.params.filter(p => p.enabled && p.key).length > 0 && <span className="ml-1 text-[10px] text-primary">●</span>}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="h-48 overflow-y-auto">
                {activeTab === 'params' && (
                    <KeyValueEditor items={request.params} onChange={handleParamsChange} />
                )}
                {activeTab === 'headers' && (
                    <KeyValueEditor items={request.headers} onChange={(items) => setRequest({ ...request, headers: items })} />
                )}
                {activeTab === 'auth' && (
                    <div className="p-4 space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium mb-1">Auth Type</label>
                            <Select 
                                value={request.auth.type} 
                                onChange={(val) => setRequest({ ...request, auth: { ...request.auth, type: val as any } })}
                                options={[{label: 'No Auth', value: 'none'}, {label: 'Bearer Token', value: 'bearer'}, {label: 'Basic Auth', value: 'basic'}]}
                            />
                        </div>
                        {request.auth.type === 'bearer' && (
                            <Input 
                                placeholder="Token" 
                                value={request.auth.token || ''} 
                                onChange={(e) => setRequest({ ...request, auth: { ...request.auth, token: e.target.value } })}
                            />
                        )}
                        {request.auth.type === 'basic' && (
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Username" 
                                    value={request.auth.username || ''} 
                                    onChange={(e) => setRequest({ ...request, auth: { ...request.auth, username: e.target.value } })}
                                />
                                <Input 
                                    placeholder="Password" 
                                    type="password"
                                    value={request.auth.password || ''} 
                                    onChange={(e) => setRequest({ ...request, auth: { ...request.auth, password: e.target.value } })}
                                />
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'body' && (
                    <div className="h-full flex flex-col">
                         <div className="flex gap-4 mb-2 px-1">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="radio" checked={request.body.type === 'none'} onChange={() => setRequest({...request, body: {...request.body, type: 'none'}})} />
                                None
                            </label>
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                <input type="radio" checked={request.body.type === 'json'} onChange={() => setRequest({...request, body: {...request.body, type: 'json'}})} />
                                JSON
                            </label>
                        </div>
                        {request.body.type === 'json' && (
                            <textarea
                                className="flex-1 w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 font-mono text-xs focus:outline-none resize-none"
                                value={request.body.raw}
                                onChange={(e) => setRequest({ ...request, body: { ...request.body, raw: e.target.value } })}
                                placeholder="{ 'key': 'value' }"
                            />
                        )}
                         {request.body.type === 'none' && (
                             <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">This request has no body</div>
                         )}
                    </div>
                )}
            </div>
        </div>

        {/* Response Section */}
        <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col min-h-0 overflow-hidden relative">
            {!response && !loading && (
                <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-300 dark:text-slate-700">
                    <Send size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Enter URL and click Send</p>
                </div>
            )}
            
            {loading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 z-10 backdrop-blur-sm">
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <span className="text-sm font-medium">Sending Request...</span>
                    </div>
                </div>
            )}

            {response && (
                <>
                    {/* Response Header */}
                    <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="flex items-center gap-4">
                            {renderResponseStatus(response.status)}
                            <span className="text-xs text-slate-500">Time: <span className="font-semibold text-slate-700 dark:text-slate-300">{response.time}ms</span></span>
                            <span className="text-xs text-slate-500">Size: <span className="font-semibold text-slate-700 dark:text-slate-300">{(response.size / 1024).toFixed(2)} KB</span></span>
                        </div>
                        <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={() => copyToClipboard(typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data)}>
                                <Copy size={14} />
                             </Button>
                        </div>
                    </div>

                    {/* Response Tabs */}
                     <div className="flex border-b border-slate-200 dark:border-slate-800">
                        {['body', 'headers'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveResponseTab(tab as ResponseTab)}
                                className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
                                    activeResponseTab === tab 
                                    ? 'border-primary text-primary' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                }`}
                            >
                                {tab.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Response Content */}
                    <div className="flex-1 overflow-auto p-4 font-mono text-sm relative">
                        {activeResponseTab === 'body' && (
                            <pre className="whitespace-pre-wrap break-words text-slate-800 dark:text-slate-200">
                                {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data}
                            </pre>
                        )}
                        {activeResponseTab === 'headers' && (
                             <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-1 text-xs">
                                {Object.entries(response.headers).map(([k, v]) => (
                                    <React.Fragment key={k}>
                                        <div className="font-semibold text-slate-600 dark:text-slate-400">{k}</div>
                                        <div className="text-slate-800 dark:text-slate-200 break-all">{v}</div>
                                    </React.Fragment>
                                ))}
                             </div>
                        )}
                        {response.error && activeResponseTab === 'body' && (
                             <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded text-red-700 dark:text-red-300 text-sm">
                                <div className="flex items-center gap-2 font-bold mb-1">
                                    <AlertCircle size={16} /> Error
                                </div>
                                {response.data.hint || response.error}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>

      {/* Code Snippet Modal (Simplified as Overlay) */}
      {showCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold">Code Snippets</h3>
                    <button onClick={() => setShowCode(false)} className="text-slate-500 hover:text-slate-900">&times;</button>
                </div>
                <div className="p-4 overflow-auto flex-1 space-y-4">
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">cURL</h4>
                        <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded text-xs font-mono overflow-x-auto relative group">
                             <pre>{generateCurl(request)}</pre>
                             <button onClick={() => copyToClipboard(generateCurl(request))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white dark:bg-slate-800 rounded shadow"><Copy size={12} /></button>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">JavaScript (Fetch)</h4>
                        <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded text-xs font-mono overflow-x-auto relative group">
                             <pre>{generateFetch(request)}</pre>
                             <button onClick={() => copyToClipboard(generateFetch(request))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white dark:bg-slate-800 rounded shadow"><Copy size={12} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;