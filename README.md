# Remote Edge Camera Platform

> Designing a distributed edge platform for secure remote access to edge devices under real-world network constraints.

Blog: https://medium.com/@devmemorydh  
Live demo: https://www.devmemory.xyz/  
- This server is deployed in Hetzner cloud(Germany). RTT is longer if you test in other continent
- If you want to test with your own pc, you can ask me to get local server file

---

### Architecture

<img src="./document/flow_chart.jpg" />

---

### Examples
#### Pairing, WebRTC, AI chatting
<img src="./document/examples/pairing.gif"/>

<img src="./document/examples/webrtc.gif"/>
<img src="./document/examples/ai.gif"/>

---

## Overview

This project is a distributed edge platform designed to securely connect to edge devices deployed inside private networks.

Unlike platforms that rely on inbound connectivity, this platform adopts an **outbound-only architecture** where every edge device initiates communication with the cloud.

The cloud is responsible for authentication, device management, and signaling.

Although the implementation uses technologies such as RabbitMQ, WebRTC, FFmpeg, Redis, and CoTURN, the project is primarily an exploration of distributed system design under real operational constraints rather than a demonstration of individual technologies.

---

# Why This Project Exists

This project originated from a real engineering problem encountered during a previous project.

AI inference and media processing using FFmpeg had to run directly on edge devices.

However, the deployment environment introduced several constraints.
- Network routers could not be configured.
- Port forwarding was unavailable.
- Devices could not expose inbound services.
- The solution had to work without requiring changes to infrastructure.

Traditional approaches such as port forwarding or VPN quickly became impractical.

Instead of forcing connectivity through the network infrastructure, I redesigned the communication model.

Every edge device establishes its own outbound connection to the cloud.

The cloud authenticates users, routes signaling messages while keeping edge devices inaccessible from the public Internet.

The cloud never becomes part of the media path.

The goal was to design a system capable of operating reliably in environments where network infrastructure could not be modified.

---

# Architecture Philosophy

The architecture intentionally separates **control traffic** from **media traffic**.

The cloud is responsible for

- Authentication
- Authorization
- Device Management
- Signaling
- TURN credential generation

Media never traverses the cloud.

Once signaling completes, browsers communicate directly with edge devices using WebRTC whenever peer-to-peer connectivity is available.

Separating these responsibilities provides several benefits.

- Lower cloud bandwidth consumption
- Independent evolution of control and media components
- Clear service boundaries
- Reduced coupling between distributed components

---

# Engineering Decisions

Rather than selecting technologies because they were popular, every component was introduced to solve a specific engineering problem.

---

## Decision 1 — Outbound-only Connectivity

### Context

Edge devices operate inside restricted private networks where router configuration is unavailable.

### Alternatives

- Port Forwarding
- VPN
- Reverse Proxy

### Decision

Every edge device establishes an outbound connection to the cloud.

### Trade-offs

**Pros**

- No router configuration
- Reduced attack surface
- Simplified deployment
- Works across customer environments

**Cons**

- Requires persistent connectivity between edge devices and the cloud
- Cloud availability becomes part of the communication path

### Outcome

Remote access became independent of customer network configuration.

---

## Decision 2 — Separate Signaling from Media

### Context

Control messages and media streams have fundamentally different requirements.

### Decision

RabbitMQ transports signaling.

WebRTC transports media.

### Trade-offs

**Pros**

- Independent scaling
- Simpler responsibilities
- Lower cloud bandwidth
- Cleaner architecture

**Cons**

- Two communication pipelines
- More protocol coordination

### Outcome

The cloud coordinates communication while media bypasses the cloud whenever possible.

---

## Decision 3 — RabbitMQ instead of Direct Device WebSockets

### Context

The cloud needs to communicate with many independently connected edge devices.

### Decision

RabbitMQ with device-specific queues.

### Trade-offs

**Pros**

- Loose coupling
- Asynchronous messaging
- Queue durability
- Retry support
- Better operational visibility

**Cons**

- Additional infrastructure
- Operational complexity

### Outcome

Device communication became independent from cloud service instances while reducing coupling between services.

RabbitMQ was selected not because it is universally better than MQTT,
but because reliable signaling and persistent message delivery were more important for this project's requirements.

---

## Decision 4 — mDNS instead of Manual Pairing

### Context

Users should not manually configure local devices before use.

### Alternatives

- QR Pairing
- Pairing Code
- BLE
- Manual Registration

### Decision

Automatic discovery using mDNS.

### Trade-offs

**Pros**

- Zero user interaction
- Immediate discovery
- No additional infrastructure

**Cons**

- Discovery is limited to a single broadcast domain

### Outcome

Devices become immediately discoverable after startup inside local networks.

Future versions may introduce additional pairing strategies for routed environments.

---

## Decision 5 — Temporary TURN Credentials

### Context

Persisting TURN passwords increases operational risk.

### Decision

Generate temporary TURN credentials using CoTURN Shared Secret Authentication.

### Trade-offs

**Pros**

- Short-lived credentials
- No password persistence
- Reduced credential exposure

**Cons**

- Credential generation depends on synchronized server time

### Outcome

TURN credentials automatically expire without requiring database storage.

---

# Technical Challenges

Implementing WebRTC outside the browser also exposed implementation details that are usually hidden behind browser APIs.

The implementation required manually coordinating

- SDP negotiation
- RTP payload alignment
- VP8 compatibility
- ICE candidate ordering
- FFmpeg integration

Synchronizing FFmpeg-generated VP8 streams with werift's SDP expectations required multiple iterations before stable media sessions could be established.

This experience significantly deepened my understanding of WebRTC internals beyond browser APIs.

---

# Security

Security was primarily achieved through architectural decisions rather than network restrictions alone.

Authentication is separated according to transport.

| Component | Authentication |
|-----------|----------------|
| REST API | JWT |
| WebSocket | JWT |
| RabbitMQ | Device-specific credentials |
| TURN | Temporary Shared-Secret Credentials |

Edge devices never expose inbound ports to the Internet.

TURN credentials expire automatically.

The cloud never relays media.

---

# Lessons Learned

The most valuable lesson from this project was that technologies rarely determine architecture.

Constraints do.

Many implementation decisions that initially appeared unrelated eventually became tightly connected.

Separating signaling from media simplified both scaling and operational complexity.

Generating temporary TURN credentials eliminated the need to persist relay passwords.

Implementing WebRTC outside the browser exposed protocol behavior that browser implementations normally abstract away.

Most importantly, I learned that solving real engineering problems begins with understanding operational constraints rather than selecting technologies.

---

# What I Would Improve

If this project continued beyond its current scope, I would prioritize the following improvements.

- RTSP camera support
- Recording pipeline
- Distributed device discovery
- Device health monitoring
- Prometheus and Grafana integration
- OpenTelemetry tracing
- Horizontal scaling of signaling services
- AI inference pipeline integration
- Automated integration testing
- AI-assisted edge workflows

---

# Final Thoughts

This project is not intended to showcase proficiency in individual technologies.

Instead, it documents how a distributed edge platform can be designed by balancing architectural constraints, protocol behavior, and engineering trade-offs.

Rather than asking **"Which technologies should be used?"**, this project attempts to answer a more fundamental engineering question:

> **How do we design a reliable distributed system when the network itself cannot be changed?**