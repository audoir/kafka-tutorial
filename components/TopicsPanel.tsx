"use client";

import { useState, useCallback } from "react";

interface Partition {
  partitionId: number;
  leader: number;
  replicas: number[];
  isr: number[];
}

interface Topic {
  name: string;
  partitions: Partition[];
}

export default function TopicsPanel() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form
  const [newTopic, setNewTopic] = useState("");
  const [numPartitions, setNumPartitions] = useState(1);
  const [replicationFactor, setReplicationFactor] = useState(1);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/topics");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTopics(data.topics);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const createTopic = async () => {
    if (!newTopic.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: newTopic.trim(),
          numPartitions,
          replicationFactor,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(`Topic "${newTopic}" created successfully!`);
      setNewTopic("");
      await fetchTopics();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const deleteTopic = async (topic: string) => {
    if (!confirm(`Delete topic "${topic}"?`)) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/topics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(`Topic "${topic}" deleted.`);
      await fetchTopics();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-2">📋 Topics</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Topics are the fundamental unit of organization in Kafka — like a named stream or a database table.
          Each topic is split into <strong className="text-gray-200">partitions</strong> for parallelism and
          scalability. Messages within a partition are strictly ordered by their{" "}
          <strong className="text-gray-200">offset</strong>.
        </p>
      </div>

      {/* Create Topic */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-md font-semibold text-white mb-4">Create a Topic</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs text-gray-400 mb-1">Topic Name</label>
            <input
              type="text"
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="e.g. my-topic"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              onKeyDown={(e) => e.key === "Enter" && createTopic()}
            />
          </div>
          <div className="w-32">
            <label className="block text-xs text-gray-400 mb-1">Partitions</label>
            <input
              type="number"
              min={1}
              max={10}
              value={numPartitions}
              onChange={(e) => setNumPartitions(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-400 mb-1">Replication Factor</label>
            <input
              type="number"
              min={1}
              max={3}
              value={replicationFactor}
              onChange={(e) => setReplicationFactor(Number(e.target.value))}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={createTopic}
            disabled={loading || !newTopic.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-lg transition-colors"
          >
            Create Topic
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          💡 Use multiple partitions for parallelism. Replication factor &gt; 1 requires multiple brokers.
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-950 border border-green-800 rounded-lg p-3 text-green-300 text-sm">
          ✅ {success}
        </div>
      )}

      {/* List Topics */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-white">Topic List</h3>
          <button
            onClick={fetchTopics}
            disabled={loading}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-gray-200 text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              "🔄"
            )}{" "}
            Refresh
          </button>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📭</div>
            <p className="text-sm">No topics loaded. Click Refresh to fetch from Kafka.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <div
                key={topic.name}
                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-blue-300 font-medium">{topic.name}</span>
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">
                      {topic.partitions.length} partition{topic.partitions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {!topic.name.startsWith("__") && (
                    <button
                      onClick={() => deleteTopic(topic.name)}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      🗑 Delete
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {topic.partitions.map((p) => (
                    <div
                      key={p.partitionId}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                    >
                      <span className="text-gray-400">P{p.partitionId}</span>
                      <span className="text-gray-600 mx-1">|</span>
                      <span className="text-yellow-400">leader: {p.leader}</span>
                      <span className="text-gray-600 mx-1">|</span>
                      <span className="text-gray-500">replicas: [{p.replicas.join(",")}]</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
