import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/HistorySidebar';
import { Button, Input, Select, Badge } from './components/UI';
import { KeyValueEditor } from './components/KeyValueEditor';
import { generateCurl, generateFetch } from './utils/codeGen';
import { ApiRequest, ApiResponse, Collection, KeyValueItem, Tab, ResponseTab, RequestTab, Environment } from './types';
import JsonViewer from './components/JsonViewer';
import JsonEditor from './components/JsonEditor';
import { Send, Save, Download, Copy, Code, Sun, Moon, Menu, AlertCircle, LogIn, LogOut, User as UserIcon, Plus, Settings } from 'lucide-react';
import { ShareModal } from './components/ShareModal';
import { ImportModal } from './components/ImportModal';
import { AuthModal } from './components/AuthModal';
import { SaveRequestModal } from './components/SaveRequestModal';
import { TabList } from './components/TabList';
import { EnvironmentManager } from './components/EnvironmentManager';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { FirestoreService } from './services/firestore';

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
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Tabs State
  const [tabs, setTabs] = useState<RequestTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');

  // Environment State
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvironmentId, setActiveEnvironmentId] = useState<string>('');
  const [envManagerOpen, setEnvManagerOpen] = useState(false);

  const [history, setHistory] = useState<ApiRequest[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showCode, setShowCode] = useState(false);

  // Share/Import State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);

  // UI State for active tab
  const [activeTabSection, setActiveTabSection] = useState<Tab>('params');
  const [activeResponseTab, setActiveResponseTab] = useState<ResponseTab>('body');

  // --- Helpers ---
  const activeTab = tabs.find(t => t.id === activeTabId);
  const activeRequest = activeTab?.request || DEFAULT_REQUEST; // Fallback just in case
  const activeResponse = activeTab?.response || null;
  const isLoading = activeTab?.loading || false;

  const createNewTab = (req?: ApiRequest) => {
    const newTab: RequestTab = {
      id: crypto.randomUUID(),
      title: req?.name || 'New Request',
      request: req ? { ...req } : { ...DEFAULT_REQUEST, id: crypto.randomUUID() }, // Keep original ID if req exists
      response: null,
      isDirty: false,
      savedRequestId: req?.id, // If loading a saved request, track it
      loading: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const updateActiveTab = (updates: Partial<RequestTab> | ((prev: RequestTab) => Partial<RequestTab>)) => {
    setTabs(prev => prev.map(t => {
      if (t.id === activeTabId) {
        const newValues = typeof updates === 'function' ? updates(t) : updates;
        return { ...t, ...newValues, isDirty: true };
      }
      return t;
    }));
  };

  const updateActiveRequest = (updates: Partial<ApiRequest>) => {
    updateActiveTab(prev => ({ request: { ...prev.request, ...updates } }));
  };

  const handleFormatBody = () => {
    try {
      if (activeRequest.body.type === 'json' && activeRequest.body.raw) {
        const parsed = JSON.parse(activeRequest.body.raw);
        const formatted = JSON.stringify(parsed, null, 2);
        updateActiveRequest({ body: { ...activeRequest.body, raw: formatted } });
      }
    } catch (e) {
      alert('Invalid JSON: ' + (e as Error).message);
    }
  };

  const closeTab = (id: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== id);
      if (id === activeTabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        // Ensure at least one tab
        const newTab = {
          id: crypto.randomUUID(),
          title: 'New Request',
          request: { ...DEFAULT_REQUEST, id: crypto.randomUUID() },
          response: null,
          isDirty: false,
          loading: false
        };
        setActiveTabId(newTab.id);
        return [newTab];
      }
      return newTabs;
    });
  };

  const substituteVariables = (text: string): string => {
    if (!activeEnvironmentId) return text;
    const env = environments.find(e => e.id === activeEnvironmentId);
    if (!env) return text;

    let result = text;
    env.variables.forEach(v => {
      if (v.enabled && v.key) {
        result = result.replace(new RegExp(`{{${v.key}}}`, 'g'), v.value);
      }
    });
    return result;
  };

  // --- Effects ---

  // Initial Tab
  useEffect(() => {
    if (tabs.length === 0) {
      createNewTab();
    }
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoaded(false);

      if (currentUser) {
        try {
          const cloudHistory = await FirestoreService.getHistory(currentUser.uid);
          setHistory(cloudHistory);
          const cloudCollections = await FirestoreService.getCollections(currentUser.uid);
          setCollections(cloudCollections);
          const cloudEnvs = await FirestoreService.getEnvironments(currentUser.uid);
          setEnvironments(cloudEnvs);
        } catch (error) {
          console.error("Error loading user data:", error);
        } finally {
          setIsLoaded(true);
        }
      } else {
        // Guest mode
        const savedHistory = localStorage.getItem('postman_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        else setHistory([]);

        const savedCollections = localStorage.getItem('postman_collections');
        if (savedCollections) setCollections(JSON.parse(savedCollections));
        else setCollections([]);

        const savedEnvs = localStorage.getItem('postman_environments');
        if (savedEnvs) setEnvironments(JSON.parse(savedEnvs));
        else setEnvironments([]);

        setIsLoaded(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Theme check
  // useEffect(() => {
  //   if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  //     setDarkMode(true);
  //   }
  //   const params = new URLSearchParams(window.location.search);
  //   const shareId = params.get('share_id');
  //   if (shareId) {
  //     setPendingShareId(shareId);
  //     setImportModalOpen(true);
  //     window.history.replaceState({}, '', window.location.pathname);
  //   }
  // }
  // }, []);

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save to local storage (Guest mode only)
  useEffect(() => {
    if (!isLoaded || user) return;
    localStorage.setItem('postman_history', JSON.stringify(history));
  }, [history, user, isLoaded]);

  useEffect(() => {
    if (!isLoaded || user) return;
    localStorage.setItem('postman_collections', JSON.stringify(collections));
  }, [collections, user, isLoaded]);

  useEffect(() => {
    if (!isLoaded || user) return;
    localStorage.setItem('postman_environments', JSON.stringify(environments));
  }, [environments, user, isLoaded]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleQuickSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, collections, user]); // Dependencies for handleQuickSave context


  // --- Helper for Collection Updates (Same as before) ---
  const addFolderToTree = (col: Collection, parentId: string, newFolder: Collection): Collection => {
    if (col.id === parentId) return { ...col, folders: [...(col.folders || []), newFolder] };
    if (col.folders) return { ...col, folders: col.folders.map(f => addFolderToTree(f, parentId, newFolder)) };
    return col;
  };
  const deleteFolderFromTree = (col: Collection, folderId: string): Collection => {
    if (col.folders) {
      const filtered = col.folders.filter(f => f.id !== folderId);
      if (filtered.length !== col.folders.length) return { ...col, folders: filtered };
      return { ...col, folders: col.folders.map(f => deleteFolderFromTree(f, folderId)) };
    }
    return col;
  };
  const addRequestToTree = (col: Collection, folderId: string | undefined, newRequest: ApiRequest): Collection => {
    if (!folderId) return col; // Should be handled by caller for root
    if (col.id === folderId) return { ...col, requests: [...col.requests, newRequest] };
    if (col.folders) return { ...col, folders: col.folders.map(f => addRequestToTree(f, folderId, newRequest)) };
    return col;
  };
  const deleteRequestFromTree = (col: Collection, requestId: string): Collection => {
    const filteredRequests = col.requests.filter(r => r.id !== requestId);
    let newCol = { ...col, requests: filteredRequests };
    if (newCol.folders) newCol.folders = newCol.folders.map(f => deleteRequestFromTree(f, requestId));
    return newCol;
  };
  const updateRequestInTree = (col: Collection, request: ApiRequest): Collection => {
    const reqIndex = col.requests.findIndex(r => r.id === request.id);
    if (reqIndex !== -1) {
      const newReqs = [...col.requests];
      // Update the request but keep the ID
      newReqs[reqIndex] = { ...request };
      return { ...col, requests: newReqs };
    }
    if (col.folders) {
      return { ...col, folders: col.folders.map(f => updateRequestInTree(f, request)) };
    }
    return col;
  };


  // --- Handlers ---

  const handleSend = async () => {
    if (!activeTab) return;
    updateActiveTab({ loading: true, response: null });
    const startTime = performance.now();

    try {
      // Substitute variables in URL
      const rawUrl = activeRequest.url;
      const urlWithVars = substituteVariables(rawUrl);

      const urlObj = new URL(urlWithVars);
      activeRequest.params.forEach(p => {
        if (p.enabled && p.key) {
          const key = substituteVariables(p.key);
          const val = substituteVariables(p.value);
          urlObj.searchParams.append(key, val);
        }
      });

      const headers: Record<string, string> = {};
      activeRequest.headers.forEach(h => {
        if (h.enabled && h.key) {
          const key = substituteVariables(h.key);
          const val = substituteVariables(h.value);
          headers[key] = val;
        }
      });

      if (activeRequest.auth.type === 'bearer' && activeRequest.auth.token) {
        headers['Authorization'] = `Bearer ${substituteVariables(activeRequest.auth.token)}`;
      } else if (activeRequest.auth.type === 'basic') {
        const u = substituteVariables(activeRequest.auth.username || '');
        const p = substituteVariables(activeRequest.auth.password || '');
        headers['Authorization'] = `Basic ${btoa(`${u}:${p}`)}`;
      }

      let body: any = undefined;
      if (activeRequest.method !== 'GET' && activeRequest.method !== 'HEAD') {
        if (activeRequest.body.type === 'json') {
          body = substituteVariables(activeRequest.body.raw || '');
          headers['Content-Type'] = 'application/json';
        }
      }

      const res = await fetch(urlObj.toString(), {
        method: activeRequest.method,
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

      updateActiveTab({ response: apiResponse, loading: false });
      addToHistory({ ...activeRequest, url: urlObj.toString() });

    } catch (error: any) {
      updateActiveTab({
        loading: false,
        response: {
          status: 0,
          statusText: 'Network Error',
          headers: {},
          data: { error: error.message, hint: 'Check CORS or network connection.' },
          size: 0,
          time: 0,
          timestamp: Date.now(),
          error: error.message
        }
      });
    }
  };

  const addToHistory = (req: ApiRequest) => {
    setHistory(prev => {
      const newHist = [req, ...prev.filter(r => r.id !== req.id)].slice(0, 50);
      if (user) FirestoreService.saveHistory(user.uid, newHist);
      return newHist;
    });
  };

  const handleParamsChange = (newParams: KeyValueItem[]) => {
    // Logic to sync URL params is complex with variables. 
    // For now, just update params state. URL update from params is tricky if URL has variables.
    // Let's keep simple: Update params, and if user wants to update URL they do it manually or we append.
    // The original logic tried to sync URL <-> Params.

    updateActiveRequest({ params: newParams });

    // Optional: Try to update URL query string if it's a simple URL
    try {
      const url = new URL(activeRequest.url);
      // Only if URL is valid and doesn't contain {{ }} in the base part might we want to auto-update
      // But with variables, it's safer to not auto-rewrite the URL field from params to avoid breaking variables.
      // So we skip the reverse sync for now to support variables better.
    } catch (e) { }
  };

  // Collection Handlers
  const handleCreateCollection = (name: string) => {
    const newCol: Collection = { id: crypto.randomUUID(), name, requests: [], folders: [] };
    setCollections(prev => [...prev, newCol]);
    if (user) FirestoreService.saveCollection(user.uid, newCol);
  };

  const handleDeleteCollection = (id: string) => {
    setCollections(prev => prev.filter(c => c.id !== id));
    if (user) FirestoreService.deleteCollection(user.uid, id);
  };

  const handleAddFolder = (collectionId: string, parentId: string | undefined, name: string) => {
    if (!name) return;
    const newFolder: Collection = { id: crypto.randomUUID(), name, requests: [], folders: [] };
    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        let updatedCol = (!parentId || parentId === collectionId)
          ? { ...col, folders: [...(col.folders || []), newFolder] }
          : addFolderToTree(col, parentId, newFolder);
        if (user) FirestoreService.saveCollection(user.uid, updatedCol);
        return updatedCol;
      }
      return col;
    }));
  };

  const handleAddRequest = (collectionId: string, folderId: string | undefined, method: string, name: string) => {
    const newRequest: ApiRequest = {
      ...DEFAULT_REQUEST,
      id: crypto.randomUUID(),
      name: name,
      method: method as any,
      url: ''
    };

    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        let updatedCol = !folderId
          ? { ...col, requests: [...col.requests, newRequest] }
          : addRequestToTree(col, folderId, newRequest);
        if (user) FirestoreService.saveCollection(user.uid, updatedCol);
        return updatedCol;
      }
      return col;
    }));

    // Open the new request
    createNewTab(newRequest);
  };

  const handleDeleteFolder = (collectionId: string, folderId: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;
    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        const updatedCol = deleteFolderFromTree(col, folderId);
        if (user) FirestoreService.saveCollection(user.uid, updatedCol);
        return updatedCol;
      }
      return col;
    }));
  };

  const handleDeleteRequest = (collectionId: string, requestId: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;
    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        const updatedCol = deleteRequestFromTree(col, requestId);
        if (user) FirestoreService.saveCollection(user.uid, updatedCol);
        return updatedCol;
      }
      return col;
    }));
  };

  const handleSaveRequest = (collectionId: string, folderId: string | undefined, name: string) => {
    // Check if we are updating an existing saved request
    // But the modal is usually for "Save As" or "New Save".
    // If we want to overwrite, we need to know.
    // For this MVP, "Save" button opens modal which acts as "Save As" or "Save New".
    // To support "Update Existing", we need to check if activeTab.savedRequestId exists.

    // Wait, the modal calls this.
    // If we want to support "Update", we should have a separate path.

    const newRequest = { ...activeRequest, id: crypto.randomUUID(), name };

    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        let updatedCol = !folderId
          ? { ...col, requests: [...col.requests, newRequest] }
          : addRequestToTree(col, folderId, newRequest);
        if (user) FirestoreService.saveCollection(user.uid, updatedCol);
        return updatedCol;
      }
      return col;
    }));

    // Update tab to show it's saved
    updateActiveTab({ title: name, savedRequestId: newRequest.id, isDirty: false });
  };

  const handleQuickSave = () => {
    if (activeTab?.savedRequestId) {
      // Find where it is and update it
      let found = false;
      const updatedCollections = collections.map(col => {
        // Try to find and update in this collection
        // We need a deep search/update
        const updatedCol = updateRequestInTree(col, activeRequest);
        if (updatedCol !== col) {
          found = true;
          if (user) FirestoreService.saveCollection(user.uid, updatedCol);
        }
        return updatedCol;
      });

      if (found) {
        setCollections(updatedCollections);
        updateActiveTab({ isDirty: false });
        alert('Request updated!');
      } else {
        // ID not found (maybe deleted), treat as new save
        setSaveModalOpen(true);
      }
    } else {
      setSaveModalOpen(true);
    }
  };

  const handleRenameCollection = (id: string, newName: string) => {
    setCollections(prev => prev.map(col => {
      if (col.id === id) {
        const updated = { ...col, name: newName };
        if (user) FirestoreService.saveCollection(user.uid, updated);
        return updated;
      }
      return col;
    }));
  };

  const handleRenameFolder = (collectionId: string, folderId: string, newName: string) => {
    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        const updateFolder = (c: Collection): Collection => {
          if (c.id === folderId) return { ...c, name: newName };
          if (c.folders) return { ...c, folders: c.folders.map(updateFolder) };
          return c;
        };
        const updated = updateFolder(col);
        if (user) FirestoreService.saveCollection(user.uid, updated);
        return updated;
      }
      return col;
    }));
  };

  const handleRenameRequest = (collectionId: string, requestId: string, newName: string) => {
    setCollections(prev => prev.map(col => {
      if (col.id === collectionId) {
        const updateRequest = (c: Collection): Collection => {
          const reqIndex = c.requests.findIndex(r => r.id === requestId);
          if (reqIndex !== -1) {
            const newRequests = [...c.requests];
            newRequests[reqIndex] = { ...newRequests[reqIndex], name: newName };
            return { ...c, requests: newRequests };
          }
          if (c.folders) return { ...c, folders: c.folders.map(updateRequest) };
          return c;
        };
        const updated = updateRequest(col);
        if (user) FirestoreService.saveCollection(user.uid, updated);
        return updated;
      }
      return col;
    }));
  };

  // Environment Handlers
  const handleCreateEnvironment = (name: string) => {
    const newEnv: Environment = { id: crypto.randomUUID(), name, variables: [] };
    setEnvironments(prev => [...prev, newEnv]);
    if (user) FirestoreService.saveEnvironment(user.uid, newEnv);
    setActiveEnvironmentId(newEnv.id);
  };

  const handleUpdateEnvironment = (env: Environment) => {
    setEnvironments(prev => prev.map(e => e.id === env.id ? env : e));
    if (user) FirestoreService.saveEnvironment(user.uid, env);
  };

  const handleDeleteEnvironment = (id: string) => {
    setEnvironments(prev => prev.filter(e => e.id !== id));
    if (activeEnvironmentId === id) setActiveEnvironmentId('');
    if (user) FirestoreService.deleteEnvironment(user.uid, id);
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
  };

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans">

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        history={history}
        collections={collections}
        onLoadRequest={(r) => {
          // Check if already open
          const existingTab = tabs.find(t => t.savedRequestId === r.id || t.id === r.id);
          if (existingTab) {
            setActiveTabId(existingTab.id);
          } else {
            createNewTab(r); // Pass request directly to preserve ID
          }
        }}
        onDeleteHistory={(id) => setHistory(h => h.filter(x => x.id !== id))}
        onCreateCollection={handleCreateCollection}
        onDeleteCollection={handleDeleteCollection}
        onShareCollection={(col) => { setSelectedCollection(col); setShareModalOpen(true); }}
        onAddFolder={handleAddFolder}
        onAddRequest={handleAddRequest}
        onDeleteFolder={handleDeleteFolder}
        onDeleteRequest={handleDeleteRequest}
        onRenameCollection={handleRenameCollection}
        onRenameFolder={handleRenameFolder}
        onRenameRequest={handleRenameRequest}
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
            {/* Environment Selector */}
            <div className="flex items-center mr-2">
              <Select
                value={activeEnvironmentId}
                onChange={(val) => setActiveEnvironmentId(val)}
                options={[
                  { label: 'No Environment', value: '' },
                  ...environments.map(e => ({ label: e.name, value: e.id }))
                ]}
                className="w-40 h-8 text-xs"
              />
              <Button variant="ghost" size="icon" onClick={() => setEnvManagerOpen(true)}>
                <Settings size={16} />
              </Button>
            </div>

            <Button variant="ghost" size="sm" onClick={() => setShowCode(!showCode)}><Code size={16} className="mr-2" /> Code</Button>
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            {user ? (
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-slate-500 hidden sm:inline">{user.email}</span>
                <Button variant="outline" size="sm" onClick={() => signOut(auth)}>
                  <LogOut size={14} className="mr-2" /> Logout
                </Button>
              </div>
            ) : (
              <Button variant="default" size="sm" onClick={() => setAuthModalOpen(true)} className="ml-2">
                <LogIn size={14} className="mr-2" /> Login
              </Button>
            )}
          </div>
        </header>

        {/* Tabs */}
        <TabList
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
          onNewTab={() => createNewTab()}
        />

        {/* Request Builder Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
          {/* URL Bar */}
          <div className="flex gap-2 mb-4">
            <div className="w-32 shrink-0">
              <Select
                value={activeRequest.method}
                onChange={(val) => updateActiveRequest({ method: val as any })}
                options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map(m => ({ label: m, value: m }))}
              />
            </div>
            <div className="flex-1">
              <Input
                placeholder="Enter URL or paste text"
                value={activeRequest.url}
                onChange={(e) => updateActiveRequest({ url: e.target.value })}
              />
            </div>
            <Button onClick={handleSend} disabled={isLoading} className="w-24">
              {isLoading ? 'Sending...' : <><Send size={16} className="mr-2" /> Send</>}
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
            {['params', 'headers', 'auth', 'body'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTabSection(tab as Tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTabSection === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'params' && activeRequest.params.filter(p => p.enabled && p.key).length > 0 && <span className="ml-1 text-[10px] text-primary">●</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="h-48 overflow-y-auto">
            {activeTabSection === 'params' && (
              <KeyValueEditor items={activeRequest.params} onChange={handleParamsChange} />
            )}
            {activeTabSection === 'headers' && (
              <KeyValueEditor items={activeRequest.headers} onChange={(items) => updateActiveRequest({ headers: items })} />
            )}
            {activeTabSection === 'auth' && (
              <div className="p-4 space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium mb-1">Auth Type</label>
                  <Select
                    value={activeRequest.auth.type}
                    onChange={(val) => updateActiveRequest({ auth: { ...activeRequest.auth, type: val as any } })}
                    options={[{ label: 'No Auth', value: 'none' }, { label: 'Bearer Token', value: 'bearer' }, { label: 'Basic Auth', value: 'basic' }]}
                  />
                </div>
                {activeRequest.auth.type === 'bearer' && (
                  <Input
                    placeholder="Token"
                    value={activeRequest.auth.token || ''}
                    onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, token: e.target.value } })}
                  />
                )}
                {activeRequest.auth.type === 'basic' && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Username"
                      value={activeRequest.auth.username || ''}
                      onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, username: e.target.value } })}
                    />
                    <Input
                      placeholder="Password"
                      type="password"
                      value={activeRequest.auth.password || ''}
                      onChange={(e) => updateActiveRequest({ auth: { ...activeRequest.auth, password: e.target.value } })}
                    />
                  </div>
                )}
              </div>
            )}
            {activeTabSection === 'body' && (
              <div className="h-full flex flex-col">
                <div className="flex gap-4 mb-2 px-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={activeRequest.body.type === 'none'} onChange={() => updateActiveRequest({ body: { ...activeRequest.body, type: 'none' } })} />
                    None
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" checked={activeRequest.body.type === 'json'} onChange={() => updateActiveRequest({ body: { ...activeRequest.body, type: 'json' } })} />
                    JSON
                  </label>
                  {activeRequest.body.type === 'json' && (
                    <button
                      onClick={handleFormatBody}
                      className="ml-auto text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300"
                    >
                      Format JSON
                    </button>
                  )}
                </div>
                {activeRequest.body.type === 'json' && (
                  <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                    <JsonEditor
                      value={activeRequest.body.raw || ''}
                      onChange={(val) => updateActiveRequest({ body: { ...activeRequest.body, raw: val } })}
                      isDark={darkMode}
                    />
                  </div>
                )}
                {activeRequest.body.type === 'none' && (
                  <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">This request has no body</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Response Section */}
        <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col min-h-0 overflow-hidden relative">
          {!activeResponse && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center flex-col text-slate-300 dark:text-slate-700">
              <Send size={48} className="mb-4 opacity-50" />
              <p className="text-lg font-medium">Enter URL and click Send</p>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-950/50 z-10 backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <span className="text-sm font-medium">Sending Request...</span>
              </div>
            </div>
          )}

          {activeResponse && (
            <>
              {/* Response Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center gap-4">
                  {renderResponseStatus(activeResponse.status)}
                  <span className="text-xs text-slate-500">Time: <span className="font-semibold text-slate-700 dark:text-slate-300">{activeResponse.time}ms</span></span>
                  <span className="text-xs text-slate-500">Size: <span className="font-semibold text-slate-700 dark:text-slate-300">{(activeResponse.size / 1024).toFixed(2)} KB</span></span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(typeof activeResponse.data === 'object' ? JSON.stringify(activeResponse.data, null, 2) : activeResponse.data)}>
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
                    className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeResponseTab === tab
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
                  <div className="h-full overflow-auto text-slate-800 dark:text-slate-200">
                    {typeof activeResponse.data === 'object' ? (
                      <JsonViewer data={activeResponse.data} isDark={darkMode} />
                    ) : (
                      <pre className="whitespace-pre-wrap break-words p-4">{activeResponse.data}</pre>
                    )}
                  </div>
                )}
                {activeResponseTab === 'headers' && (
                  <div className="grid grid-cols-[1fr_2fr] gap-x-4 gap-y-1 text-xs">
                    {Object.entries(activeResponse.headers).map(([k, v]) => (
                      <React.Fragment key={k}>
                        <div className="font-semibold text-slate-600 dark:text-slate-400">{k}</div>
                        <div className="text-slate-800 dark:text-slate-200 break-all">{v}</div>
                      </React.Fragment>
                    ))}
                  </div>
                )}
                {activeResponse.error && activeResponseTab === 'body' && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded text-red-700 dark:text-red-300 text-sm">
                    <div className="flex items-center gap-2 font-bold mb-1">
                      <AlertCircle size={16} /> Error
                    </div>
                    {activeResponse.data.hint || activeResponse.error}
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
                  <pre>{generateCurl(activeRequest)}</pre>
                  <button onClick={() => copyToClipboard(generateCurl(activeRequest))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white dark:bg-slate-800 rounded shadow"><Copy size={12} /></button>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">JavaScript (Fetch)</h4>
                <div className="bg-slate-100 dark:bg-slate-950 p-3 rounded text-xs font-mono overflow-x-auto relative group">
                  <pre>{generateFetch(activeRequest)}</pre>
                  <button onClick={() => copyToClipboard(generateFetch(activeRequest))} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-white dark:bg-slate-800 rounded shadow"><Copy size={12} /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        collection={selectedCollection}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        shareId={pendingShareId}
        onImport={(col) => {
          setCollections(prev => [...prev, col]);
          setImportModalOpen(false);
          setPendingShareId(null);
          alert(`Collection "${col.name}" imported successfully!`);
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      <SaveRequestModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        collections={collections}
        onSave={handleSaveRequest}
        initialName={activeRequest.name || 'New Request'}
      />

      <EnvironmentManager
        isOpen={envManagerOpen}
        onClose={() => setEnvManagerOpen(false)}
        environments={environments}
        activeEnvironmentId={activeEnvironmentId}
        onSelectEnvironment={setActiveEnvironmentId}
        onUpdateEnvironment={handleUpdateEnvironment}
        onCreateEnvironment={handleCreateEnvironment}
        onDeleteEnvironment={handleDeleteEnvironment}
      />
    </div>
  );
}

export default App;