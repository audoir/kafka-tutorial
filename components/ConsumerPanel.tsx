"use client";

import { useState } from "react";

interface KafkaMessage {
  partition: number;
  offset: string;
  key: string | null;
  value: string | null;
  timestamp: string;
}

export default function ConsumerPanel() {
  const [topic, setTopic] = useState("demo-topic");
  const [groupId, setGroupId] = useState("tutorial-consumer-group");
  const [maxMessages, setMaxMessages] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<KafkaMessage[]>([]);
  const [consumed, setConsumed] = useState(false);

  const consume = async () => {
    setLoading(true);
    setError(null);
    setMessages([]);
    setConsumed(false);

    try {
      const res = await fetch("/api/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, groupId, maxMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(data.messages);
      setConsumed(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(Number(ts)).toLocaleString();
    } catch {
      return ts;
    }
  };

  const tryParseJson = (val: string | null) => {
    if (!val) return null;
    try {
      return JSON.stringify(JSON.parse(val), null, 2);
    } catch {
      return val;
    }
  };

  // Group messages by partition for visualization
  const byPartition = messages.reduce<Record<number, KafkaMessage[]>>((acc, msg) => {
    if (!acc[msg.partition]) acc[msg.partition] = [];
    acc[msg.partition].push(msg);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-2">📥 Consumer</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Consumers use a <strong className="text-gray-200">pull model</strong> — they request data from
          Kafka brokers. Messages are read in order from low to high offset within each partition. Each
          consumer belongs to a <strong className="text-gray-200">consumer group</strong>, and Kafka tracks
          which offsets have been read per group in the{" "}
          <code className="text-purple-400 font-mono text-xs">__consumer_offsets</code> topic.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-purple-400 font-medium mb-1">Pull Model</div>
            <div className="text-gray-400">Consumer requests data — not pushed by broker</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-blue-400 font-medium mb-1">Ordered per Partition</div>
            <div className="text-gray-400">Messages read low→high offset within each partition</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-yellow-400 font-medium mb-1">Offset Tracking</div>
            <div className="text-gray-400">Group offsets committed to __consumer_offsets</div>
          </div>
        </div>
      </div>

      {/* How offsets work */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-md font-semibold text-white mb-2">📍 How Offsets Work</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-3">
          Kafka tracks the last-read position for each consumer group in a special internal topic called{" "}
          <code className="text-purple-400 font-mono text-xs">__consumer_offsets</code>. Once a group
          has committed an offset, it will always resume from that position — even if you pass{" "}
          <code className="text-gray-300 font-mono text-xs">fromBeginning: true</code> in code.
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-green-400 font-medium mb-1">New Group ID</div>
            <div className="text-gray-400">
              No committed offsets → reads from the beginning of the topic (all existing messages).
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-yellow-400 font-medium mb-1">Existing Group ID</div>
            <div className="text-gray-400">
              Committed offsets exist → resumes from where it left off (only new messages since last read).
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-500">
          💡 To re-read all messages, use a <strong className="text-gray-400">different Group ID</strong> — that group has no committed offsets yet.
        </p>
      </div>

      {/* Consume Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-md font-semibold text-white mb-4">Consume Messages</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="topic name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">
                Consumer Group ID{" "}
                <span className="text-gray-600">(use a new ID to read from the beginning)</span>
              </label>
              <input
                type="text"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="group id"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Max messages:</label>
              <input
                type="number"
                min={1}
                max={100}
                value={maxMessages}
                onChange={(e) => setMaxMessages(Number(e.target.value))}
                className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <button
            onClick={consume}
            disabled={loading || !topic.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin inline-block">⟳</span> Consuming (up to 4s)...
              </span>
            ) : (
              "Consume Messages"
            )}
          </button>
          <p className="text-xs text-gray-500">
            💡 The consumer waits up to 4 seconds for messages. Change the Group ID to read from the beginning again.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Results */}
      {consumed && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-white">
              Messages Consumed{" "}
              <span className="text-gray-500 text-sm font-normal">({messages.length} total)</span>
            </h3>
            {messages.length > 0 && (
              <span className="text-xs text-gray-500">
                {Object.keys(byPartition).length} partition(s)
              </span>
            )}
          </div>

          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No new messages for this group.</p>
              <p className="text-xs mt-1 text-gray-600">
                This group has already read all messages. Use a different Group ID to start fresh.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Partition visualization */}
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-2">Partition Distribution</div>
                <div className="flex gap-3 flex-wrap">
                  {Object.entries(byPartition).map(([partition, msgs]) => (
                    <div key={partition} className="flex items-center gap-2">
                      <div className="bg-purple-900 border border-purple-700 rounded px-2 py-1 text-xs text-purple-300">
                        P{partition}
                      </div>
                      <span className="text-gray-400 text-xs">{msgs.length} msg{msgs.length !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message list */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs"
                  >
                    <div className="flex gap-4 mb-2 font-mono">
                      <span className="text-purple-400">P{msg.partition}</span>
                      <span className="text-gray-500">offset: <span className="text-yellow-400">{msg.offset}</span></span>
                      {msg.key && (
                        <span className="text-gray-500">key: <span className="text-green-400">{msg.key}</span></span>
                      )}
                      <span className="text-gray-600">{formatTimestamp(msg.timestamp)}</span>
                    </div>
                    <pre className="text-gray-300 whitespace-pre-wrap break-all font-mono text-xs bg-gray-900 rounded p-2">
                      {tryParseJson(msg.value) ?? "(null)"}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
