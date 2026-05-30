# 🌐 portfolio-device-sync

> **A Secure, Cloud-Relayed Remote Camera Reverse-Tunneling Architecture designed to orchestrate Edge Devices using Hybrid Protocols (WebSockets ⇄ AMQP/MQTT) and WebRTC.**
>
> This repository showcases a high-performance network orchestration layer that solves the inherent constraints of headless edge nodes, focusing on reliable device pairing, robust signaling routing, and low-latency video streaming.

[![Medium](https://img.shields.io/badge/Medium-Deep_Dive_Series-12100E?style=for-the-badge&logo=medium&logoColor=white)](https://medium.com/@devmemorydh)
---

## 🚀 Key Engineering Focus (Interviewer's Guide)

This project is a deep dive into edge computing constraints, protocol selection trade-offs, and WebRTC NAT traversal. Instead of choosing "easy" out-of-the-box setups, it addresses core distributed systems bottlenecks.

### 1. Edge Device Pairing Constraints & Solutions
* **The BLE Bottleneck:** While Bluetooth Low Energy (BLE) is ideal for headless device provisioning, strict web browser security and fragmented Web Bluetooth API support pose significant adoption barriers. This architecture mitigates this by utilizing a native **Mobile App provisioning** wrapper.
* **mDNS Hostname Collision:** Deploying multiple identical edge devices on the same local network causes mDNS hostname conflicts. To ensure unique local discovery, the system dynamically registers **distinct hostnames suffixed with device-specific hardware serial numbers**.

### 2. Protocol Architecture: Why AMQP + MQTT?
The signaling control plane splits responsibilities between the Client and the Edge Node by bridging **MQTT** and **AMQP** via RabbitMQ, leveraging the unique strengths of both protocols:
* **MQTT (Client/Pub-Sub):** Operates without persistent message queues, providing an extremely lightweight, zero-overhead Pub/Sub topic architecture for fast client-side signaling events.
* **AMQP (Edge/Queue-Based):** Acts as a resilient "mailbox." Unlike MQTT, AMQP manages actual persistent message queues. Even if the edge node temporarily drops its connection, the signaling broker holds the packets until the subscriber explicitly retrieves and acknowledges (`ACK`) them. Additionally, the edge node can subscribe directly to its dedicated queue without needing to guess or know complex topic strings beforehand.

### 3. Secure Signaling & SDP Strictness
* **Mitigating Account Leaks:** Provisioning temporary MQTT accounts per pairing session poses a severe security risk and resource leaks. Instead, all signaling traffic is routed through a secure, permanent hub: **Client ⇄ WebSockets (Socket.IO) ⇄ Cloud Gateway (NestJS) ⇄ AMQP/MQTT ⇄ Local Agent**, isolating edge credentials.
* **Strict SDP Coordination:** Web browsers feature highly forgiving hidden abstraction layers to match SDP configurations easily. However, a headless Node.js media server must be **exceptionally strict** during the WebRTC handshake, requiring manual, precise alignment of media descriptions to prevent handshake termination.

### 4. High-Performance Camera Handling (FFmpeg)
* Capturing raw video frames directly from the edge hardware requires direct OS-level media pipeline control via an optimized **FFmpeg spawn process**.
* The core challenge here lies in resolving **codec mismatching** between the OS-specific hardware capture drivers (e.g., V4L2 on Linux, AVFoundation on macOS) and the strict WebRTC media pipeline, forcing precise target configuration (VP8/H.264) during runtime ingestion.

### 5. WebRTC NAT Traversal & Connectivity
* Due to complex local router configurations, Symmetric NATs, and strict firewalls, standard Peer-to-Peer STUN handshakes frequently fail in real-world deployment networks.
* To guarantee 100% connectivity, the infrastructure integrates a dedicated, optimized **CoTURN (TURN/STUN) server**, fallback-routing encrypted media streams over a relay whenever direct hole-punching fails.

---

## 🏗️ System Architecture



### Client (React 19 / Vite)
- Authenticates sessions and triggers pairing requests using secure mobile app/web layers.
- Establishes a standard Socket.IO connection to the cloud control plane for real-time signaling.
- Drives the WebRTC frontend layer, translating media channel configurations for browser rendering.

### Cloud (NestJS 11 Core Control Plane)
- Manages User/Device relations (PostgreSQL 16) and handles temporary pairing validation lookups (Redis 7).
- Acts as a bidirectional signaling translator: Converts WebSockets payload data into secure, tenant-isolated RabbitMQ exchange/queue pipelines.
- Issues dynamic CoTURN credentials for fallback NAT traversal.

### Local Agent (Node.js / Express)
- Secures hardware integrity using a unique identifier via `node-machine-id` combined with serial-suffixed mDNS.
- Maintains an outbound-only persistent AMQP connection to RabbitMQ, consuming signaling packets securely with zero inbound network exposure.
- Drives the `FFmpeg` pipeline to capture camera frames and streams real-time media to the browser via `werift`.

---

## 🔒 Security & Sandbox Isolation Strategy

To prevent the exposure of live production credentials, home server paths, or Hetzner Master API keys, this repository operates as a **fully isolated development (`dev`) sandbox**.

---

## 📂 Folder Structure

```text
.
├── client/                    # React 19 / Vite web dashboard
│   ├── public/                # Static assets
│   ├── src/
│   │   ├── components/        # Shared UI components
│   │   ├── constants/         # Client-side constants
│   │   ├── hooks/             # Reusable React hooks
│   │   ├── models/            # Frontend data models
│   │   ├── routes/            # Auth, device, connection, and app routes
│   │   ├── services/          # REST, Socket.IO, and WebRTC clients
│   │   └── utils/             # Client utilities
│   ├── package.json
│   └── vite.config.ts
├── cloud/                     # NestJS 11 control plane and signaling bridge
│   ├── src/
│   │   ├── common/            # Guards, filters, DTOs, responses, and utilities
│   │   ├── infrastructure/    # MQTT and Redis integration modules
│   │   ├── modules/           # Device and user domain modules
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── package.json
├── local/                     # Node.js edge agent controller
│   ├── src/
│   │   ├── constants/         # Local agent constants
│   │   ├── controller/        # Device, lifecycle, message, and WebRTC controllers
│   │   ├── models/            # MQ, result, and WebRTC models
│   │   ├── routes/            # Local HTTP routes
│   │   ├── util/              # FFmpeg utilities
│   │   └── index.ts
│   └── package.json
├── document/                  # Database design documents
│   ├── ddl
│   └── erd.vuerd.json
└── README.md
```

## 💻 Quick Start

### 1. Install Dependencies
Install dependencies within each isolated workspace directory:
```bash
cd cloud && yarn install
cd ../client && yarn install
cd ../local && yarn install
```

### 2. Cloud Infrastructure & API Setup
Move to the cloud directory and spin up the core infrastructure:
cd cloud
```
# Build and run PostgreSQL, Redis, RabbitMQ, and Coturn in the background
docker compose up -d --build
```

💡 Database Initialization: > TypeORM is configured with synchronize: false. After the database container is healthy, connect to PostgreSQL and execute the DDL scripts located in the document directory to initialize the schema.

💡 RabbitMQ Management Plugin:
Wait a few seconds for the RabbitMQ node to initialize completely, then run the following command to enable the Management UI:
```
docker exec -it rabbitmq rabbitmq-plugins enable rabbitmq_management
```
Access the Cloud API via http://localhost:8080 and RabbitMQ Management via http://localhost:15672.

### 3. Local Agent Setup (Edge Device)
The Local Agent requires mDNS (Bonjour) daemon support to broadcast its local presence.

- For Linux (Ubuntu/Debian): Install and activate avahi-daemon before running the agent.
```
sudo apt update && sudo apt install -y avahi-daemon avahi-utils
sudo systemctl enable avahi-daemon
sudo systemctl start avahi-daemon
```

- For macOS: No additional setup needed (Bonjour is natively supported by the OS).

Ensure FFmpeg is installed and available on your system PATH, then start the agent: