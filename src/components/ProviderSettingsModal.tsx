import React, { useState } from 'react';
import {
  X,
  Key,
  Globe,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  ShieldCheck,
  Keyboard,
  RotateCcw,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { AppSettings, ProviderConfig } from '../types/chat';
import { PROVIDER_PRESETS } from '../lib/presets';

interface ProviderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => void;
}

export const ProviderSettingsModal: React.FC<ProviderSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>(settings.provider);
  const [sendShortcut, setSendShortcut] = useState(settings.sendShortcut);
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Auto-fetch models state
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setProviderConfig((prev) => ({
      ...prev,
      id: preset.id,
      name: preset.name,
      baseUrl: preset.defaultBaseUrl,
      model: preset.models[0] || '',
      apiKey: preset.id === 'ollama' || preset.id === 'lmstudio' ? 'not-needed' : prev.apiKey,
    }));
    setTestResult(null);
    setFetchedModels([]);
    setFetchError(null);
  };

  const handleFetchModels = async () => {
    if (!providerConfig.baseUrl) return;
    setIsFetchingModels(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUrl: providerConfig.baseUrl,
          apiKey: providerConfig.apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch models from provider');
      }

      if (data.models && Array.isArray(data.models) && data.models.length > 0) {
        setFetchedModels(data.models);
        // If current model is not in list or default, select the first one
        if (!data.models.includes(providerConfig.model)) {
          setProviderConfig((prev) => ({ ...prev, model: data.models[0] }));
        }
      } else {
        throw new Error('No models found at this provider endpoint.');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Could not fetch models');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      // Test the endpoint with a minimal completion ping
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerConfig,
          messages: [{ role: 'user', content: 'Respond with the single word: "READY"' }],
          stream: false,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }

      setTestResult({
        success: true,
        message: `Successfully connected to ${providerConfig.name} (${providerConfig.model})!`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed. Check your Base URL and API Key.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      provider: providerConfig,
      sendShortcut,
    });
    onClose();
  };

  const selectedPreset = PROVIDER_PRESETS.find((p) => p.id === providerConfig.id);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-stone-900 dark:text-stone-100">
                AI Provider & Model Settings
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Connect any OpenAI-compatible API (BYOK)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Choose Provider Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PROVIDER_PRESETS.map((preset) => {
                const isSelected = providerConfig.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    <span className="text-xs font-semibold">{preset.name}</span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 truncate w-full mt-0.5">
                      {preset.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Form */}
          <div className="space-y-4">
            {/* Base URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-400" />
                API Base URL
              </label>
              <input
                type="text"
                value={providerConfig.baseUrl}
                onChange={(e) =>
                  setProviderConfig({ ...providerConfig, baseUrl: e.target.value.trim() })
                }
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm font-mono bg-stone-100 dark:bg-stone-800/70 border border-stone-300/80 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[11px] text-stone-400">
                Must support the standard OpenAI <code className="text-amber-600 font-mono">POST /chat/completions</code> endpoint.
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-stone-400" />
                  API Key
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Stored locally
                </span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={providerConfig.apiKey}
                  onChange={(e) =>
                    setProviderConfig({ ...providerConfig, apiKey: e.target.value.trim() })
                  }
                  placeholder={selectedPreset?.placeholderKey || 'Paste secret API key...'}
                  className="w-full px-3 py-2 pr-10 rounded-xl text-xs sm:text-sm font-mono bg-stone-100 dark:bg-stone-800/70 border border-stone-300/80 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model Name & Presets */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300">
                  Model Identifier
                </label>
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={isFetchingModels || !providerConfig.baseUrl}
                  className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium disabled:opacity-40 transition-colors"
                  title="Query the provider /models endpoint to discover available models"
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`} />
                  <span>{isFetchingModels ? 'Fetching...' : 'Auto-Fetch Models'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={providerConfig.model}
                  onChange={(e) =>
                    setProviderConfig({ ...providerConfig, model: e.target.value.trim() })
                  }
                  placeholder="e.g. gpt-4o, llama-3.3-70b-versatile, deepseek-r1"
                  className="flex-1 px-3 py-2 rounded-xl text-xs sm:text-sm font-mono bg-stone-100 dark:bg-stone-800/70 border border-stone-300/80 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-500"
                />

                {/* If models were fetched, show quick dropdown selector */}
                {fetchedModels.length > 0 && (
                  <select
                    value={providerConfig.model}
                    onChange={(e) =>
                      setProviderConfig({ ...providerConfig, model: e.target.value })
                    }
                    className="px-2.5 py-2 rounded-xl text-xs font-mono bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none max-w-[160px] truncate"
                  >
                    <option value="" disabled>Select fetched model...</option>
                    {fetchedModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status of fetched models */}
              {fetchedModels.length > 0 && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Successfully discovered {fetchedModels.length} models from {providerConfig.baseUrl}
                </p>
              )}

              {fetchError && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  {fetchError}
                </p>
              )}

              {/* Preset / discovered model chips */}
              {((fetchedModels.length > 0 ? fetchedModels.slice(0, 8) : selectedPreset?.models) || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {((fetchedModels.length > 0 ? fetchedModels.slice(0, 8) : selectedPreset?.models) || []).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setProviderConfig({ ...providerConfig, model: m })}
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border transition-colors ${
                        providerConfig.model === m
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 font-semibold'
                          : 'bg-stone-200/50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-400 border-stone-300/40 dark:border-stone-700 hover:text-stone-900 dark:hover:text-stone-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Temperature & Token Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    Temperature: <span className="font-mono text-amber-500">{providerConfig.temperature}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={providerConfig.temperature}
                  onChange={(e) =>
                    setProviderConfig({
                      ...providerConfig,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Send Shortcut (Mobile & Windows setting) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-700 dark:text-stone-300 flex items-center gap-1">
                  <Keyboard className="w-3.5 h-3.5 text-stone-400" />
                  Keyboard Send Behavior
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSendShortcut('enter')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                      sendShortcut === 'enter'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Enter to send
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendShortcut('ctrl-enter')}
                    className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-colors ${
                      sendShortcut === 'ctrl-enter'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                        : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    Ctrl+Enter to send
                  </button>
                </div>
              </div>
            </div>

            {/* Test Connection Result Box */}
            {testResult && (
              <div
                className={`p-3 rounded-xl flex items-start gap-2 text-xs border ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{testResult.success ? 'Connection Successful' : 'Connection Failed'}</p>
                  <p className="text-[11px] mt-0.5 whitespace-pre-wrap">{testResult.message}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-all"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
