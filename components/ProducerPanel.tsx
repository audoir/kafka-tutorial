"use client";

import { useState } from "react";

interface SentRecord {
  partition: number;
  offset: string;
  timestamp: string;
  key: string | null;
  value: string;
  sentAt: string; // local time string
}

export default function ProducerPanel() {
  const [topic, setTopic] = useState("demo-topic");
  const [messageKey, setMessageKey] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<SentRecord[]>([]);

  const formatTimestamp = (ts: string) => {
    try {
      const n = Number(ts);
      if (n > 0) return new Date(n).toLocaleString();
    } catch {
      // fall through
    }
    return ts;
  };

  const sendMessage = async () => {
    if (!topic.trim() || !messageValue.trim()) return;
    setLoading(true);
    setError(null);

    const key = messageKey.trim() || null;
    const value = messageValue.trim();

    try {
      const res = await fetch("/api/produce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          messages: [{ key: key ?? undefined, value }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const sentAt = new Date().toLocaleTimeString();
      const newRecords: SentRecord[] = data.result.map(
        (r: { partition: number; baseOffset: string; logAppendTime: string }) => ({
          partition: r.partition,
          offset: r.baseOffset,
          timestamp: r.logAppendTime,
          key,
          value,
          sentAt,
        })
      );
      setRecords((prev) => [...newRecords, ...prev].slice(0, 50));
      setMessageValue("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
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

    try {
      const res = await fetch("/api/produce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), messages: batchMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const sentAt = new Date().toLocaleTimeString();
      const newRecords: SentRecord[] = data.result.map(
        (r: { partition: number; baseOffset: string; logAppendTime: string }, i: number) => ({
          partition: r.partition,
          offset: r.baseOffset,
          timestamp: r.logAppendTime,
          key: batchMessages[i]?.key ?? null,
          value: batchMessages[i]?.value ?? "",
          sentAt,
        })
      );
      setRecords((prev) => [...newRecords, ...prev].slice(0, 50));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const partitionColors: Record<number, string> = {};
  const palette = [
    "text-blue-400",
    "text-purple-400",
    "text-teal-400",
    "text-orange-400",
    "text-pink-400",
    "text-cyan-400",
  ];
  records.forEach((r) => {
    if (!(r.partition in partitionColors)) {
      partitionColors[r.partition] = palette[r.partition % palette.length];
    }
  });

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
          <div>
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
            {records.length > 0 && (
              <button
                onClick={() => setRecords([])}
                className="ml-auto px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Sent Records Table */}
      {records.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-md font-semibold text-white">
              Sent Records{" "}
              <span className="text-gray-500 text-sm font-normal">({records.length})</span>
            </h3>
            <span className="text-xs text-gray-500">newest first</span>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[auto_auto_auto_auto_1fr] gap-x-4 px-3 py-1 text-xs text-gray-500 font-medium border-b border-gray-800 mb-1">
            <span>Partition</span>
            <span>Offset</span>
            <span>Key</span>
            <span>Sent At</span>
            <span>Value</span>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {records.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-[auto_auto_auto_auto_1fr] gap-x-4 items-start px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 text-xs font-mono"
              >
                {/* Partition */}
                <span className={`font-bold ${partitionColors[r.partition] ?? "text-blue-400"}`}>
                  P{r.partition}
                </span>

                {/* Offset */}
                <span className="text-yellow-300">{r.offset}</span>

                {/* Key */}
                <span className={r.key ? "text-green-400" : "text-gray-600 italic"}>
                  {r.key ?? "null"}
                </span>

                {/* Sent At */}
                <span className="text-gray-500 whitespace-nowrap">{r.sentAt}</span>

                {/* Value */}
                <span className="text-gray-300 truncate" title={r.value}>
                  {r.value}
                </span>
              </div>
            ))}
          </div>

          {/* Partition legend */}
          <div className="mt-3 pt-3 border-t border-gray-800 flex flex-wrap gap-3">
            {Object.entries(partitionColors).sort(([a], [b]) => Number(a) - Number(b)).map(([p, color]) => (
              <div key={p} className="flex items-center gap-1 text-xs">
                <span className={`font-bold ${color}`}>P{p}</span>
                <span className="text-gray-600">
                  — {records.filter((r) => r.partition === Number(p)).length} msg(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
