"use client";

import { useState } from "react";
import TopicsPanel from "@/components/TopicsPanel";
import ProducerPanel from "@/components/ProducerPanel";
import ConsumerPanel from "@/components/ConsumerPanel";
import ConsumerGroupsPanel from "@/components/ConsumerGroupsPanel";
import ConceptsPanel from "@/components/ConceptsPanel";

type Tab = "concepts" | "topics" | "producer" | "consumer" | "groups";

const tabs: { id: Tab; label: string; emoji: string }[] = [
  { id: "concepts", label: "Concepts", emoji: "📚" },
  { id: "topics", label: "Topics", emoji: "📋" },
  { id: "producer", label: "Producer", emoji: "📤" },
  { id: "consumer", label: "Consumer", emoji: "📥" },
  { id: "groups", label: "Consumer Groups", emoji: "👥" },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("concepts");

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="text-3xl">⚡</div>
          <div>
            <h1 className="text-2xl font-bold text-white">Apache Kafka Tutorial</h1>
            <p className="text-sm text-gray-400">
              Interactive demo connected to Kafka on{" "}
              <code className="text-green-400 font-mono">localhost:9092</code>
            </p>
          </div>
        </div>
      </header>

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
      <main className="flex-1 px-6 py-8">
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
