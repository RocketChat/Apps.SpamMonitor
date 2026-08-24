![banner](https://res.cloudinary.com/dsdgpiinw/image/upload/v1787151435/gsoc_demo_day.jpg)

# Contributing

ThankYou for considering contributing to Apps.SpamMonitor. Before your contribution can be integrated into the main codebase, it goes through a few standard stages. This document walks you through them.

---

## The Contribution Flow

**1. Fork & Clone**
Fork the project on GitHub and clone it to your local environment so you can work without affecting the main project.

**2. Create a Branch**
Create a new branch per feature or bug fix. This keeps your changes isolated and easy to track.

**3. Implement Your Changes**
Follow Rocket.Chat's coding standards and guidelines. Keep your code clean, well-commented, and thoroughly tested.

**4. Commit**
Each commit should represent a single logical change. Write commit messages that explain *what* changed, *why*, and any implications.

**5. Submit a Pull Request**
Your PR should include a clear description, the reasoning behind the change, a changeset (for fixes/features), any issues it addresses, and relevant documentation updates.

**6. Code Review**
The team reviews your PR for quality, alignment with coding standards, and correctness. Expect discussion — be ready to answer questions and revise based on feedback.

**7. Acceptance or Rejection**
The team decides whether to merge. If accepted, it's merged. If rejected, you'll receive feedback explaining why. Merging is at the sole discretion of the maintainers.

---

## A Note on Expectations

As an open-source project, we value and respect every community member. That said, contributing code doesn't guarantee it will be merged. Decisions are influenced by code quality, alignment with the project's goals, impact on stability, and the resources required to support the change long-term.

---

## Architecture Overview

![architecture](https://res.cloudinary.com/dsdgpiinw/image/upload/v1787151441/gsoc_demo_day_1.jpg)


A quick primer on how the app is put together, so you know where a change is likely to land before you start.

**Detection layer** — Six gates run on every incoming message: exact duplicate (hash matching), fuzzy/polymorphic (cosine similarity), cross-channel spread, rate flood, room spread, and URL spam. Thresholds for each gate are exposed as admin settings rather than hardcoded, so tuning detection sensitivity shouldn't require a code change.

**Caching** — An in-memory sliding-window message cache sits in front of persistence, so duplicate and flood checks resolve without a database round trip on every message.

**Flagging and state** — A persistent `UserStatusStore` tracks each new user's flag history and level, backed by a `FlagLogStore` for auditability. Writes to these stores go through a per-key async mutex to avoid read-modify-write races under concurrent messages, since the Apps Engine persistence API has no atomic increment or upsert.

**Restriction** — The four-tier Moderation Level system is driven by a `RestrictionManager` that reads per-level actions, cooldown durations, and notification messages from an admin-configurable `LevelConfigStore`, so escalation behavior can be tuned without touching code.

This is why the disclaimer below matters: the detection gates, the cache, and the concurrency-safe stores are all tightly coupled pieces that were tuned and load-tested together. A change in one can quietly break assumptions in another.

---

## ⚠️ Disclaimer — Core Module Changes

Based on the project structure below, **we strongly advise against implementing features or changes directly within the core of the application**:

```
src/core/
├── cache/
│   └── messageCache.ts
├── restrictionsManager.ts
├── scheduleCron.ts
└── spamProcessor.ts
```

Changes to these files directly affect the running application and can hinder the scope and stability the project was built around.

**If you have an idea for a core change** — whether a security fix or a detection-logic improvement — please **open an issue first** and describe it in detail to the maintainers. Only once it has been reviewed and approved by the maintainers/mentors should implementation begin.

---

Outside of core changes, feel free to open issues, start discussions, and contribute freely.

Happy coding!
