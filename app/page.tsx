"use client";

import { useState, useEffect, useCallback } from "react";
import TopicsPanel from "@/components/TopicsPanel";
import ProducerPanel from "@/components/ProducerPanel";
import ConsumerPanel from "@/components/ConsumerPanel";
import ConsumerGroupsPanel from "@/components/ConsumerGroupsPanel";
import ConceptsPanel from "@/components/ConceptsPanel";

type Tab = "concepts" | "topics" | "producer" | "consumer" | "groups";
type ConnectionStatus = "checking" | "connected" | "disconnected";

interface BrokerInfo {
  nodeId: number;
  host: string;
  port: number;
}

interface HealthData {
  connected: boolean;
  brokers?: BrokerInfo[];
  controllerId?: number;
  clusterId?: string;
  error?: string;
}

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: "concepts", label: "Concepts", emoji: "📚" },
  { id: "topics", label: "Topics", emoji: "📋" },
  { id: "producer", label: "Producer", emoji: "📤" },
  { id: "consumer", label: "Consumer", emoji: "📥" },
  { id: "groups", label: "Consumer Groups", emoji: "👥" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("concepts");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [showHealthDetails, setShowHealthDetails] = useState(false);

  const runHealthCheck = useCallback(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data: HealthData) => {
        setHealthData(data);
        setConnectionStatus(data.connected ? "connected" : "disconnected");
      })
      .catch(() => {
        setHealthData({ connected: false, error: "Failed to reach health endpoint" });
        setConnectionStatus("disconnected");
      });
  }, []);

  // Trigger a manual recheck (sets status to "checking" first for UI feedback)
  const checkHealth = useCallback(() => {
    setConnectionStatus("checking");
    runHealthCheck();
  }, [runHealthCheck]);

  useEffect(() => {
    runHealthCheck();
    // Re-check every 30 seconds
    const interval = setInterval(runHealthCheck, 30000);
    return () => clearInterval(interval);
  }, [runHealthCheck]);

  const statusDot = {
    checking: "bg-yellow-400 animate-pulse",
    connected: "bg-green-400",
    disconnected: "bg-red-400",
  }[connectionStatus];

  const statusLabel = {
    checking: "Connecting…",
    connected: "Connected",
    disconnected: "Disconnected",
  }[connectionStatus];

  const statusTextColor = {
    checking: "text-yellow-400",
    connected: "text-green-400",
    disconnected: "text-red-400",
  }[connectionStatus];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚡</div>
            <div>
              <h1 className="text-2xl font-bold text-white">Apache Kafka Tutorial</h1>
              <p className="text-sm text-gray-400">
                Interactive demo connected to Kafka on{" "}
                <code className="text-green-400 font-mono">localhost:9092</code>
              </p>
            </div>
          </div>

          {/* Connection status badge */}
          <div className="relative">
            <button
              onClick={() => setShowHealthDetails((v) => !v)}
              className="flex items-center gap-2 bg-gray-800 border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-2 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${statusDot}`} />
              <span className={`text-sm font-medium ${statusTextColor}`}>{statusLabel}</span>
              <span className="text-gray-500 text-xs">kafka:9092</span>
              <span className="text-gray-600 text-xs">▾</span>
            </button>

            {/* Dropdown details */}
            {showHealthDetails && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-white">Kafka Connection</span>
                  <button
                    onClick={checkHealth}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    🔄 Recheck
                  </button>
                </div>

                {connectionStatus === "checking" && (
                  <div className="text-yellow-400 text-sm flex items-center gap-2">
                    <span className="animate-spin">⟳</span> Checking connection…
                  </div>
                )}

                {connectionStatus === "connected" && healthData && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                      ✅ Kafka is reachable
                    </div>
                    {healthData.clusterId && (
                      <div className="text-xs text-gray-400">
                        <span className="text-gray-500">Cluster ID: </span>
                        <span className="font-mono text-gray-300 break-all">{healthData.clusterId}</span>
                      </div>
                    )}
                    {healthData.brokers && healthData.brokers.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">
                          Brokers ({healthData.brokers.length})
                        </div>
                        {healthData.brokers.map((b) => (
                          <div
                            key={b.nodeId}
                            className="bg-gray-800 rounded px-2 py-1 text-xs font-mono flex justify-between"
                          >
                            <span className="text-gray-400">
                              {b.host}:{b.port}
                            </span>
                            <span className="text-gray-600">
                              node {b.nodeId}
                              {b.nodeId === healthData.controllerId && (
                                <span className="text-yellow-400 ml-1">(controller)</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {connectionStatus === "disconnected" && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                      ❌ Cannot reach Kafka
                    </div>
                    {healthData?.error && (
                      <div className="bg-red-950 border border-red-800 rounded p-2 text-xs text-red-300 font-mono break-all">
                        {healthData.error}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 leading-relaxed">
                      Make sure Kafka is running on{" "}
                      <code className="text-gray-300">localhost:9092</code>. See the README for
                      Docker setup instructions.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Disconnected banner */}
      {connectionStatus === "disconnected" && (
        <div className="bg-red-950 border-b border-red-800 px-6 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-red-300">
            <span>⚠️</span>
            <span>
              Kafka is not reachable on <code className="font-mono">localhost:9092</code>. Start
              your Kafka container before using the interactive demos.
            </span>
            <button
              onClick={checkHealth}
              className="ml-auto text-xs text-red-400 hover:text-red-200 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6">
        <div className="max-w-6xl mx-auto flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 px-6 py-8" onClick={() => showHealthDetails && setShowHealthDetails(false)}>
        <div className="max-w-6xl mx-auto">
          {activeTab === "concepts" && <ConceptsPanel />}
          {activeTab === "topics" && <TopicsPanel />}
          {activeTab === "producer" && <ProducerPanel />}
          {activeTab === "consumer" && <ConsumerPanel />}
          {activeTab === "groups" && <ConsumerGroupsPanel />}
        </div>
      </main>
    </div>
  );
}
