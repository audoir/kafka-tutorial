"use client";

const concepts = [
  {
    title: "Topics & Partitions",
    icon: "📋",
    color: "blue",
    description:
      "A topic is a named stream of data — like a table in a database. Topics are split into partitions, and each message in a partition gets an incremental ID called an offset.",
    points: [
      "Topics are identified by name",
      "Split into one or more partitions",
      "Messages within a partition are ordered",
      "Each message gets an offset (immutable ID)",
      "Data is kept for a limited time (default: 1 week)",
      "Order is guaranteed only within a partition",
    ],
    diagram: (
      <div className="mt-3 font-mono text-xs space-y-1">
        <div className="text-gray-400">Topic: &quot;truck-gps&quot;</div>
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="text-gray-500 mb-1">Partition 0</div>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300">
                  {i}
                </div>
              ))}
              <div className="text-gray-600 self-center">→</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="text-gray-500 mb-1">Partition 1</div>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-blue-900 border border-blue-700 rounded px-2 py-1 text-blue-300">
                  {i}
                </div>
              ))}
              <div className="text-gray-600 self-center">→</div>
            </div>
          </div>
        </div>
        <div className="text-gray-600 text-xs">↑ offsets (per partition)</div>
      </div>
    ),
  },
  {
    title: "Producers & Message Keys",
    icon: "📤",
    color: "green",
    description:
      "Producers write data to topics. They can optionally include a key with each message. If no key is provided, messages are distributed round-robin across partitions. If a key is provided, all messages with that key always go to the same partition — guaranteeing ordering for that key.",
    points: [
      "Producers know which partition to write to",
      "Can automatically recover on failure",
      "No key → round-robin (load balancing)",
      "With key → same key always → same partition",
      "Use keys when you need message ordering",
      "Messages contain: key, value, headers, timestamp",
    ],
    diagram: (
      <div className="mt-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="bg-green-900 border border-green-700 rounded px-3 py-2 text-green-300">
            Producer
          </div>
          <div className="text-gray-500">→</div>
          <div className="space-y-1">
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs">
              <span className="text-yellow-400">key=&quot;truck-1&quot;</span>{" "}
              <span className="text-gray-400">→ Partition 0</span>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs">
              <span className="text-yellow-400">key=&quot;truck-2&quot;</span>{" "}
              <span className="text-gray-400">→ Partition 1</span>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs">
              <span className="text-gray-500">key=null</span>{" "}
              <span className="text-gray-400">→ round-robin</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Consumers & Deserialization",
    icon: "📥",
    color: "purple",
    description:
      "Consumers read data from topics using a pull model. They read messages in order from low to high offset within each partition. Consumers use deserializers to convert bytes back into usable data.",
    points: [
      "Pull model: consumers request data from brokers",
      "Reads in order within each partition",
      "Knows which broker/partition to read from",
      "Can recover from failure",
      "Deserializes bytes → objects (string, int, etc.)",
    ],
    diagram: (
      <div className="mt-3 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1">
              <span className="text-blue-400">Partition 0</span>{" "}
              <span className="text-gray-500">[0,1,2,3]</span>
            </div>
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1">
              <span className="text-blue-400">Partition 1</span>{" "}
              <span className="text-gray-500">[0,1,2]</span>
            </div>
          </div>
          <div className="text-gray-500">→</div>
          <div className="bg-purple-900 border border-purple-700 rounded px-3 py-2 text-purple-300">
            Consumer
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Consumer Groups & Offsets",
    icon: "👥",
    color: "orange",
    description:
      "Consumers in the same group share the work of reading a topic — each consumer reads from exclusive partitions. Kafka tracks the offset each group has read up to in a special topic called __consumer_offsets, so consumers can resume after failure.",
    points: [
      "All consumers in a group share partitions",
      "Each partition is read by only one consumer per group",
      "More consumers than partitions → some are idle",
      "Multiple groups can read the same topic independently",
      "Offsets stored in __consumer_offsets topic",
      "Consumers commit offsets periodically",
    ],
    diagram: (
      <div className="mt-3 font-mono text-xs space-y-2">
        <div className="text-gray-400">Group: &quot;my-app&quot; (3 partitions, 2 consumers)</div>
        <div className="flex gap-3">
          <div className="space-y-1">
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs">P0 → Consumer A</div>
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs">P1 → Consumer A</div>
            <div className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs">P2 → Consumer B</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Brokers & Replication",
    icon: "🖥️",
    color: "red",
    description:
      "A Kafka cluster is made of multiple brokers (servers). Topics are replicated across brokers for fault tolerance. Only one broker is the leader for a given partition at a time — producers write to the leader, and consumers (by default) read from the leader.",
    points: [
      "Each broker has a unique ID",
      "Connecting to any broker connects you to the cluster",
      "Replication factor > 1 for high availability",
      "One leader per partition, others are followers (ISR)",
      "Producers write to the leader only",
      "Since Kafka 2.4: consumers can read from nearest replica",
    ],
    diagram: (
      <div className="mt-3 font-mono text-xs space-y-1">
        <div className="flex gap-2">
          {["Broker 1\n(Leader P0)", "Broker 2\n(Leader P1)", "Broker 3\n(Replica)"].map((b, i) => (
            <div
              key={i}
              className={`flex-1 border rounded px-2 py-2 text-center text-xs ${
                i < 2
                  ? "bg-red-900 border-red-700 text-red-300"
                  : "bg-gray-800 border-gray-700 text-gray-400"
              }`}
            >
              {b.split("\n").map((line, j) => (
                <div key={j}>{line}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "KRaft: No More ZooKeeper",
    icon: "🚀",
    color: "teal",
    description:
      "Historically, Kafka used ZooKeeper to manage brokers and leader election. Kafka 3.x introduced KRaft (Kafka Raft), making ZooKeeper optional. Kafka 4.x removes ZooKeeper entirely. Never use ZooKeeper in your client configuration.",
    points: [
      "ZooKeeper managed brokers and metadata",
      "Kafka 2.x required ZooKeeper",
      "Kafka 3.x: KRaft is production-ready (since 3.3.1)",
      "Kafka 4.x: ZooKeeper removed entirely",
      "KRaft uses Raft consensus protocol internally",
      "Never configure ZooKeeper in Kafka clients",
    ],
    diagram: (
      <div className="mt-3 font-mono text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-gray-500 line-through">
            ZooKeeper
          </div>
          <div className="text-gray-600">→ deprecated</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-teal-900 border border-teal-700 rounded px-2 py-1 text-teal-300">
            KRaft (Raft)
          </div>
          <div className="text-gray-400">→ built-in, Kafka 3.3.1+</div>
        </div>
      </div>
    ),
  },
];

const colorMap: Record<string, string> = {
  blue: "border-blue-800 bg-blue-950/30",
  green: "border-green-800 bg-green-950/30",
  purple: "border-purple-800 bg-purple-950/30",
  orange: "border-orange-800 bg-orange-950/30",
  red: "border-red-800 bg-red-950/30",
  teal: "border-teal-800 bg-teal-950/30",
};

const titleColorMap: Record<string, string> = {
  blue: "text-blue-400",
  green: "text-green-400",
  purple: "text-purple-400",
  orange: "text-orange-400",
  red: "text-red-400",
  teal: "text-teal-400",
};

export default function ConceptsPanel() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">What is Apache Kafka?</h2>
        <p className="text-gray-300 leading-relaxed">
          Apache Kafka is a <strong className="text-white">distributed event streaming platform</strong> designed
          to receive and send data at massive scale. It decouples data producers from consumers, acting as a
          high-throughput, fault-tolerant transportation layer. Originally created by LinkedIn and now open source,
          Kafka is used for messaging, activity tracking, log aggregation, stream processing, and more.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Distributed", "Fault Tolerant", "Horizontally Scalable", "High Performance", "Real-time"].map(
            (tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300"
              >
                {tag}
              </span>
            )
          )}
        </div>
        <div className="mt-4 p-4 bg-gray-800 rounded-lg font-mono text-sm">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-green-900 border border-green-700 rounded px-3 py-2 text-green-300 text-xs">
              Sources<br/>(DBs, Apps, IoT)
            </div>
            <div className="text-gray-500">→</div>
            <div className="bg-yellow-900 border border-yellow-700 rounded px-3 py-2 text-yellow-300 text-xs font-bold">
              ⚡ Kafka
            </div>
            <div className="text-gray-500">→</div>
            <div className="bg-blue-900 border border-blue-700 rounded px-3 py-2 text-blue-300 text-xs">
              Targets<br/>(DBs, Apps, ML)
            </div>
          </div>
          <div className="mt-2 text-gray-500 text-xs">
            Kafka is only a transportation mechanism — it doesn&apos;t transform data
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {concepts.map((concept) => (
          <div
            key={concept.title}
            className={`border rounded-xl p-5 ${colorMap[concept.color]}`}
          >
            <h3 className={`text-lg font-semibold mb-2 ${titleColorMap[concept.color]}`}>
              {concept.icon} {concept.title}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">{concept.description}</p>
            <ul className="space-y-1">
              {concept.points.map((point) => (
                <li key={point} className="text-gray-400 text-xs flex gap-2">
                  <span className="text-gray-600 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            {concept.diagram}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">🎯 Common Use Cases</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "💬", label: "Messaging System" },
            { icon: "🔍", label: "Activity Tracking" },
            { icon: "📊", label: "Metrics & Monitoring" },
            { icon: "📝", label: "Log Aggregation" },
            { icon: "🌊", label: "Stream Processing" },
            { icon: "🔗", label: "System Decoupling" },
            { icon: "🔄", label: "Event Sourcing" },
            { icon: "📡", label: "Pub/Sub Messaging" },
          ].map((uc) => (
            <div
              key={uc.label}
              className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-center"
            >
              <div className="text-2xl mb-1">{uc.icon}</div>
              <div className="text-xs text-gray-300">{uc.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
