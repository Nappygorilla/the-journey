# The Journey ✝️

A completely free Christian website for Scripture, prayer, Bible study, learning, and spiritual growth.

## Current build

The Journey includes a premium, responsive dark interface with:

- Local account registration/login experience
- Personalized onboarding through selected struggles
- Personalized Daily Bible Verse
- Daily reflection and prayer flow
- Bible reading experience and Scripture search
- Bible study hub, topics, cross-references, dictionaries, concordance and word-study entry points
- Reading plans and progress
- Private prayer journal
- Devotionals
- Bible learning games and quizzes
- Personal Journey dashboard
- Saved verses and private notes
- Community feed UI with moderation-aware messaging
- Notifications center and user notification preferences
- Responsive mobile navigation
- Animated premium visual system
- Persistent local data through browser localStorage

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints in the terminal.

## Production build

```bash
npm run build
npm run preview
```

## Important implementation note

This repository currently provides a **working frontend-first build**. Account data, saved Scripture, notes, prayer entries, progress, and notifications are persisted locally in the browser.

A production release still needs real backend services for cross-device authentication, secure user storage, full Bible/content licensing or approved Scripture APIs, real audio sources, browser push delivery, community persistence/moderation, and other external integrations. Those services should be connected without putting private API keys in the frontend.

## Brand

**The Journey**

> Scripture. Prayer. Learning. Growth. Your Journey with God.

Everything on the site is intended to remain free for users.
