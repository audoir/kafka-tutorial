"use client";

import { useState } from "react";

interface SendResult {
  partition: number;
  offset: string;
  timestamp: string;
}

export default function ProducerPanel() {
  const [topic, setTopic] = useState("demo-topic");
  const [messageKey, setMessageKey] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SendResult[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  const sendMessage = async () => {
    if (!topic.trim() || !messageValue.trim()) return;
    setLoading(true);
    setError(null);

    const payload = {
      topic: topic.trim(),
      messages: [
        {
          key: messageKey.trim() || undefined,
          value: messageValue.trim(),
        },
      ],
    };

    addLog(`Sending to topic "${topic}"${messageKey ? ` with key="${messageKey}"` : " (no key, round-robin)"}...`);

    try {
      const res = await fetch("/api/produce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newResults: SendResult[] = data.result.map(
        (r: { partition: number; baseOffset: string; logAppendTime: string }) => ({
          partition: r.partition,
          offset: r.baseOffset,
          timestamp: r.logAppendTime,
        })
      );
      setResults((prev) => [...newResults, ...prev].slice(0, 20));
      addLog(
        `✅ Message delivered → Partition ${newResults[0]?.partition}, Offset ${newResults[0]?.offset}`
      );
      setMessageValue("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addLog(`❌ Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const sendBatch = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);

    const batchMessages = [
      { key: "truck-1", value: JSON.stringify({ truckId: "truck-1", lat: 37.7749, lng: -122.4194, speed: 65 }) },
      { key: "truck-2", value: JSON.stringify({ truckId: "truck-2", lat: 34.0522, lng: -118.2437, speed: 72 }) },
      { key: "truck-1", value: JSON.stringify({ truckId: "truck-1", lat: 37.7751, lng: -122.4180, speed: 63 }) },
      { key: "truck-3", value: JSON.stringify({ truckId: "truck-3", lat: 40.7128, lng: -74.0060, speed: 55 }) },
      { key: "truck-2", value: JSON.stringify({ truckId: "truck-2", lat: 34.0525, lng: -118.2440, speed: 70 }) },
    ];

    addLog(`Sending batch of ${batchMessages.length} messages to "${topic}" with keys...`);

    try {
      const res = await fetch("/api/produce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), messages: batchMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const newResults: SendResult[] = data.result.map(
        (r: { partition: number; baseOffset: string; logAppendTime: string }) => ({
          partition: r.partition,
          offset: r.baseOffset,
          timestamp: r.logAppendTime,
        })
      );
      setResults((prev) => [...newResults, ...prev].slice(0, 20));
      addLog(`✅ Batch delivered to ${newResults.length} partition(s). Same key → same partition!`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      addLog(`❌ Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-2">📤 Producer</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Producers write messages to Kafka topics. Each message can have an optional{" "}
          <strong className="text-gray-200">key</strong>. Without a key, messages are distributed
          round-robin across partitions. With a key, all messages sharing the same key always go to the
          same partition — guaranteeing ordering for that key.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-green-400 font-medium mb-1">No Key (null)</div>
            <div className="text-gray-400">Messages distributed round-robin → load balanced across partitions</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-yellow-400 font-medium mb-1">With Key</div>
            <div className="text-gray-400">Same key → same partition → guaranteed ordering per key</div>
          </div>
        </div>
      </div>

      {/* Send Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-md font-semibold text-white mb-4">Send a Message</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="topic name"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">
                Key <span className="text-gray-600">(optional — leave blank for round-robin)</span>
              </label>
              <input
                type="text"
                value={messageKey}
                onChange={(e) => setMessageKey(e.target.value)}
                placeholder="e.g. truck-1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Value</label>
            <textarea
              value={messageValue}
              onChange={(e) => setMessageValue(e.target.value)}
              placeholder='e.g. {"event": "page_view", "userId": "u123"}'
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500 font-mono resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={sendMessage}
              disabled={loading || !topic.trim() || !messageValue.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors"
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
            <button
              onClick={sendBatch}
              disabled={loading || !topic.trim()}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors"
            >
              Send Demo Batch (truck GPS)
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-md font-semibold text-white mb-3">Delivery Receipts</h3>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div
                key={i}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs font-mono flex gap-4"
              >
                <span className="text-green-400">✓</span>
                <span className="text-gray-400">
                  Partition: <span className="text-blue-300">{r.partition}</span>
                </span>
                <span className="text-gray-400">
                  Offset: <span className="text-yellow-300">{r.offset}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      {log.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-md font-semibold text-white mb-3">Activity Log</h3>
          <div className="bg-gray-950 rounded-lg p-3 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
            {log.map((entry, i) => (
              <div key={i} className={entry.includes("❌") ? "text-red-400" : entry.includes("✅") ? "text-green-400" : "text-gray-400"}>
                {entry}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
