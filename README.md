# Apache Kafka Tutorial

An interactive web app for learning Apache Kafka fundamentals, built with Next.js and [KafkaJS](https://kafka.js.org/). The app connects to a live Kafka broker and lets you create topics, produce messages, consume them, and inspect consumer groups — all from the browser.

---

## Prerequisites

- [Docker](https://www.docker.com/get-started) (for running Kafka)
- [Node.js](https://nodejs.org/) v18+ and npm

---

## Step 1 — Start Kafka in Docker

This tutorial uses a single-broker Kafka setup via Docker Compose. The easiest way is to use the [conduktor-kafka-single.yml](https://github.com/conduktor/kafka-stack-docker-compose) stack, which starts Kafka (accessible on `localhost:9092`) and an optional web UI.

### Option A: Minimal single-broker Kafka (no UI)

Create a file called `docker-compose.yml` in any directory:

```yaml
version: "3"
services:
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    container_name: kafka1
    ports:
      - "9092:9092"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_LOG_DIRS: /var/lib/kafka/data
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
```

Then start it:

```bash
docker compose up -d
```

Verify Kafka is running:

```bash
docker ps
# You should see a container named "kafka1"
```

### Option B: Kafka + Conduktor UI (recommended for visual exploration)

```bash
# Clone the docker-compose repo
git clone https://github.com/conduktor/kafka-stack-docker-compose.git
cd kafka-stack-docker-compose

# Start single-broker Kafka + Conduktor web UI
docker compose -f conduktor-kafka-single.yml up -d
```

- Kafka broker: `localhost:9092`
- Conduktor UI: [http://localhost:8080](http://localhost:8080) (login with the credentials in the yml file)

---

## Step 2 — Install Dependencies & Run the App

```bash
# Clone this repo (if you haven't already)
git clone <repo-url>
cd kafka-tutorial

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Step 3 — Tutorial Walkthrough

The app has five tabs. Work through them in order for the best learning experience.

---

### 📚 Tab 1: Concepts

**What to do:** Read through the concept cards before touching anything else.

This tab covers all the core Kafka theory you need:

| Concept | Key Takeaway |
|---|---|
| **Topics & Partitions** | A topic is a named stream split into partitions. Each message gets an immutable offset per partition. |
| **Producers & Message Keys** | No key → round-robin across partitions. With a key → same key always lands on the same partition (ordering guarantee). |
| **Consumers & Deserialization** | Pull model. Reads messages in offset order within each partition. |
| **Consumer Groups & Offsets** | A group shares partitions among its consumers. Kafka tracks progress in `__consumer_offsets`. |
| **Brokers & Replication** | A cluster of brokers. Each partition has one leader broker. Replication factor > 1 = fault tolerance. |
| **KRaft (No ZooKeeper)** | Kafka 3.3.1+ uses the built-in Raft protocol. ZooKeeper is gone in Kafka 4.x. Never put ZooKeeper in your client config. |

The bottom of the page shows 8 common Kafka use cases (messaging, activity tracking, log aggregation, stream processing, etc.).

---

### 📋 Tab 2: Topics

**What to do:** Create a topic, then inspect it.

1. **Create a topic**
   - Enter a name like `demo-topic`
   - Set **Partitions** to `3` (this will let you see key-based routing later)
   - Leave **Replication Factor** at `1` (single broker setup)
   - Click **Create Topic**

2. **Refresh the topic list**
   - Click **🔄 Refresh** to fetch all topics from Kafka
   - You'll see your new topic along with internal topics like `__consumer_offsets`
   - Each topic shows its partitions, the leader broker ID, and replica list

3. **Experiment**
   - Try creating a topic with 1 partition vs. 5 partitions
   - Notice that `__consumer_offsets` is a system topic — it's where Kafka stores consumer progress
   - Delete a topic you no longer need with the 🗑 button

> 💡 **Key insight:** More partitions = more parallelism for both producers and consumers, but you can't reduce partition count after creation.

---

### 📤 Tab 3: Producer

**What to do:** Send messages to your topic and observe partition routing.

#### Experiment 1 — No key (round-robin)

1. Set **Topic** to `demo-topic`
2. Leave **Key** blank
3. Enter any **Value** (e.g. `{"event": "page_view", "userId": "u1"}`)
4. Click **Send Message** several times
5. Watch the **Delivery Receipts** — the partition number will vary (round-robin distribution)

#### Experiment 2 — With a key (sticky routing)

1. Set **Key** to `user-123`
2. Enter a value and click **Send Message** multiple times
3. Notice the partition number in the receipts is always the same — same key → same partition

#### Experiment 3 — Demo batch (truck GPS)

1. Click **Send Demo Batch (truck GPS)**
2. This sends 5 messages with keys `truck-1`, `truck-2`, `truck-3`
3. Check the receipts — messages for the same truck ID always land on the same partition

> 💡 **Key insight:** Message keys are how you guarantee ordering for a specific entity (user, device, order, etc.) across multiple messages.

---

### 📥 Tab 4: Consumer

**What to do:** Read messages back from Kafka and observe offset/partition behavior.

#### Experiment 1 — Read from beginning

1. Set **Topic** to `demo-topic`
2. Set **Consumer Group ID** to `group-a`
3. Check **From beginning**
4. Click **Consume Messages** (waits up to 3 seconds)
5. You'll see all messages you produced, grouped by partition with their offsets

#### Experiment 2 — Observe partition distribution

- Look at the **Partition Distribution** summary — messages with the same key are clustered in the same partition
- Messages within each partition are in offset order (low → high)
- Messages across partitions may appear out of chronological order — this is expected!

#### Experiment 3 — Consumer group offset tracking

1. Consume with `group-a` (from beginning) — you get all messages
2. Consume again with `group-a` (uncheck "From beginning") — you get 0 messages (offsets already committed)
3. Change the Group ID to `group-b` and consume from beginning — you get all messages again
4. This demonstrates that **each consumer group tracks its own offsets independently**

> 💡 **Key insight:** Kafka doesn't delete messages when they're consumed. Multiple independent consumer groups can each read the full topic at their own pace.

---

### 👥 Tab 5: Consumer Groups

**What to do:** Understand partition assignment and fetch live groups.

#### Read the visual scenarios

The tab shows four illustrated scenarios:

| Scenario | What happens |
|---|---|
| 3 partitions, 3 consumers | Perfect — one partition per consumer |
| 3 partitions, 2 consumers | Consumer A gets 2 partitions, Consumer B gets 1 |
| 3 partitions, 4 consumers | Consumer D is idle — more consumers than partitions |
| Multiple groups on same topic | Each group reads independently (pub/sub pattern) |

#### Read about rebalancing

- **Eager rebalance:** All consumers stop, all partitions revoked, then reassigned. Brief pause.
- **Cooperative rebalance:** Only affected partitions move. Other consumers keep reading.

#### Read about offset commit semantics

- **At most once:** Commit before processing → possible message loss, no duplicates
- **At least once (preferred):** Commit after processing → possible reprocessing, no loss
- **Exactly once:** Requires transactions → complex but perfect delivery

#### Fetch live groups

1. Click **🔄 Fetch Groups**
2. You'll see the consumer groups created during your experiments (e.g. `group-a`, `group-b`, `tutorial-consumer-group`)
3. Each group shows its protocol type

> 💡 **Key insight:** Design your consumer group IDs intentionally. Each unique group ID represents an independent subscriber to the topic.

---

## Project Structure

```
kafka-tutorial/
├── app/
│   ├── api/
│   │   ├── health/route.ts          # GET — ping Kafka, return broker/cluster info
│   │   ├── topics/route.ts          # GET list, POST create, DELETE topic
│   │   ├── produce/route.ts         # POST send messages
│   │   ├── consume/route.ts         # POST consume messages
│   │   └── consumer-groups/route.ts # GET list groups
│   ├── layout.tsx
│   └── page.tsx                     # Main tabbed UI + connection status badge
├── components/
│   ├── ConceptsPanel.tsx            # Theory reference with diagrams
│   ├── TopicsPanel.tsx              # Create/list/delete topics
│   ├── ProducerPanel.tsx            # Send messages with/without keys
│   ├── ConsumerPanel.tsx            # Consume and inspect messages
│   └── ConsumerGroupsPanel.tsx      # Group scenarios + live group list
└── lib/
    └── kafka.ts                     # KafkaJS client singleton (broker: localhost:9092)
```

---

## How the Code Works

### `lib/kafka.ts` — The KafkaJS Client

This file is the single source of truth for all Kafka connections in the app. It creates one `Kafka` instance (configured with `clientId` and the broker address) and exports three things:

```ts
// A shared admin client — used for topic management and cluster inspection
export const admin = kafka.admin();

// A shared producer — used to send messages to topics
export const producer = kafka.producer();

// A factory function — creates a new consumer with a given group ID
export function createConsumer(groupId: string) {
  return kafka.consumer({ groupId });
}
```

**Why singletons for admin and producer?** KafkaJS clients maintain persistent TCP connections to the broker. Reusing a single instance avoids the overhead of creating a new connection on every API request. Each API route calls `.connect()` before use and `.disconnect()` after, so the connection is only held open for the duration of the request.

**Why a factory for consumers?** Each consumer must belong to a specific group (`groupId`), and different tutorial experiments use different group IDs. A factory function lets each API call create a fresh consumer with the right group ID.

---

### API Routes

All routes live under `app/api/` and follow the Next.js App Router [Route Handler](https://nextjs.org/docs/app/api-reference/file-conventions/route) convention. Each file exports named HTTP method functions (`GET`, `POST`, `DELETE`). All routes set `export const dynamic = "force-dynamic"` to opt out of caching.

#### `GET /api/health`

Calls `admin.describeCluster()` to verify the broker is reachable. Returns:

```json
{
  "connected": true,
  "clusterId": "abc123",
  "controllerId": 1,
  "brokers": [{ "nodeId": 1, "host": "localhost", "port": 9092 }]
}
```

On failure, returns `{ "connected": false, "error": "..." }` with HTTP 503. Used by the connection status badge in the header.

#### `GET /api/topics`

Lists all topics via `admin.listTopics()`, then fetches partition metadata (leader, replicas, ISR) via `admin.fetchTopicMetadata()`.

#### `POST /api/topics`

Creates a topic. Body: `{ topic, numPartitions, replicationFactor }`.

#### `DELETE /api/topics`

Deletes a topic. Body: `{ topic }`.

#### `POST /api/produce`

Sends one or more messages to a topic. Body:

```json
{
  "topic": "demo-topic",
  "messages": [
    { "key": "truck-1", "value": "{\"speed\": 65}" },
    { "value": "no key — round robin" }
  ]
}
```

Returns the delivery receipts from KafkaJS (partition + baseOffset per message).

#### `POST /api/consume`

Subscribes a consumer to a topic, collects messages for up to 3 seconds (or until `maxMessages` is reached), then disconnects. Body:

```json
{
  "topic": "demo-topic",
  "groupId": "group-a",
  "fromBeginning": true,
  "maxMessages": 20
}
```

Returns an array of `{ partition, offset, key, value, timestamp }` objects.

> **Note on offset tracking:** Because the consumer commits offsets after each batch, calling this endpoint twice with the same `groupId` and `fromBeginning: false` will return 0 messages the second time — the group has already read everything. Use a different `groupId` to read from the beginning again.

#### `GET /api/consumer-groups`

Lists all consumer groups via `admin.listGroups()`. Returns group IDs and protocol types.

---

## Stopping Kafka

```bash
# If using the minimal setup
docker compose down

# If using conduktor
docker compose -f conduktor-kafka-single.yml down
```
