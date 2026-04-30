"use client";

import { useState } from "react";

interface ConsumerGroup {
  groupId: string;
  protocolType: string;
}

export default function ConsumerGroupsPanel() {
  const [groups, setGroups] = useState<ConsumerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consumer-groups");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGroups(data.groups);
      setFetched(true);
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
        <h2 className="text-lg font-semibold text-white mb-2">👥 Consumer Groups</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Consumer groups allow multiple consumers to share the work of reading a topic. Each partition
          is assigned to exactly one consumer within a group. This enables horizontal scaling of
          consumption. Multiple independent groups can read the same topic simultaneously — each group
          maintains its own offset tracking.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-md font-semibold text-white mb-4">How Consumer Groups Work</h3>
        <div className="space-y-4">
          {/* Scenario 1 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-400 mb-3">
              Scenario 1: 3 partitions, 3 consumers (ideal)
            </div>
            <div className="font-mono text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300 w-20 text-center">P0</div>
                <div className="text-gray-500">→</div>
                <div className="bg-orange-900 border border-orange-700 rounded px-2 py-1 text-orange-300">Consumer A</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300 w-20 text-center">P1</div>
                <div className="text-gray-500">→</div>
                <div className="bg-orange-900 border border-orange-700 rounded px-2 py-1 text-orange-300">Consumer B</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300 w-20 text-center">P2</div>
                <div className="text-gray-500">→</div>
                <div className="bg-orange-900 border border-orange-700 rounded px-2 py-1 text-orange-300">Consumer C</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">✅ Each consumer handles one partition — maximum parallelism</div>
          </div>

          {/* Scenario 2 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm font-medium text-yellow-400 mb-3">
              Scenario 2: 3 partitions, 2 consumers (uneven)
            </div>
            <div className="font-mono text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300">P0</div>
                  <div className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300">P1</div>
                </div>
                <div className="text-gray-500">→</div>
                <div className="bg-yellow-900 border border-yellow-700 rounded px-2 py-1 text-yellow-300">Consumer A</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300 w-20 text-center">P2</div>
                <div className="text-gray-500">→</div>
                <div className="bg-yellow-900 border border-yellow-700 rounded px-2 py-1 text-yellow-300">Consumer B</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">⚠️ Consumer A handles 2 partitions — uneven load</div>
          </div>

          {/* Scenario 3 */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm font-medium text-red-400 mb-3">
              Scenario 3: 3 partitions, 4 consumers (one idle)
            </div>
            <div className="font-mono text-xs space-y-1">
              {["A", "B", "C"].map((c, i) => (
                <div key={c} className="flex items-center gap-2">
                  <div className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300 w-20 text-center">P{i}</div>
                  <div className="text-gray-500">→</div>
                  <div className="bg-red-900 border border-red-700 rounded px-2 py-1 text-red-300">Consumer {c}</div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <div className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-500 w-20 text-center">—</div>
                <div className="text-gray-500">→</div>
                <div className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-500">Consumer D (idle)</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">❌ Consumer D is inactive — more consumers than partitions</div>
          </div>

          {/* Multiple groups */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm font-medium text-teal-400 mb-3">
              Multiple Groups: Independent consumption
            </div>
            <div className="font-mono text-xs space-y-2">
              <div className="flex items-center gap-2">
                <div className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300">Topic</div>
                <div className="text-gray-500">→</div>
                <div className="space-y-1">
                  <div className="bg-teal-900 border border-teal-700 rounded px-2 py-1 text-teal-300">Group: analytics-service</div>
                  <div className="bg-teal-900 border border-teal-700 rounded px-2 py-1 text-teal-300">Group: notification-service</div>
                  <div className="bg-teal-900 border border-teal-700 rounded px-2 py-1 text-teal-300">Group: audit-service</div>
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">✅ Each group reads all messages independently — pub/sub pattern</div>
          </div>
        </div>
      </div>

      {/* Rebalancing */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-md font-semibold text-white mb-3">⚖️ Rebalancing</h3>
        <p className="text-gray-400 text-sm mb-3">
          When consumers join or leave a group, Kafka triggers a <strong className="text-gray-200">rebalance</strong> to
          redistribute partitions.
        </p>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-red-400 font-medium mb-1">Eager Rebalance (default)</div>
            <div className="text-gray-400">All consumers stop, all partitions revoked, then reassigned. Causes a brief pause in consumption.</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-green-400 font-medium mb-1">Cooperative (Incremental) Rebalance</div>
            <div className="text-gray-400">Only a subset of partitions are moved. Consumers continue reading unaffected partitions during rebalance.</div>
          </div>
        </div>
      </div>

      {/* Offset Semantics */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-md font-semibold text-white mb-3">📍 Offset Commit Semantics</h3>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-blue-400 font-medium mb-1">At Most Once</div>
            <div className="text-gray-400">Commit before processing. If crash occurs, message is lost. No duplicates.</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-green-400 font-medium mb-1">At Least Once ✓</div>
            <div className="text-gray-400">Commit after processing. If crash occurs, message is reprocessed. Preferred — make processing idempotent.</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-yellow-400 font-medium mb-1">Exactly Once</div>
            <div className="text-gray-400">Requires transactions. Complex but guarantees no loss and no duplicates.</div>
          </div>
        </div>
      </div>

      {/* Live Groups */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-white">Live Consumer Groups</h3>
          <button
            onClick={fetchGroups}
            disabled={loading}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-gray-200 text-sm rounded-lg transition-colors"
          >
            {loading ? "Loading..." : "🔄 Fetch Groups"}
          </button>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-300 text-sm mb-3">
            ❌ {error}
          </div>
        )}

        {!fetched ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            Click &quot;Fetch Groups&quot; to list active consumer groups from Kafka.
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <div className="text-3xl mb-2">👻</div>
            No consumer groups found. Try consuming some messages first!
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((g) => (
              <div
                key={g.groupId}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="font-mono text-sm text-orange-300">{g.groupId}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">
                  {g.protocolType || "consumer"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
