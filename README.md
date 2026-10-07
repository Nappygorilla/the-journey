# The Journey ✝️

A completely free Christian website for Scripture, prayer, Bible study, learning, community, and spiritual growth.

## What is included

The current build tracks **142 requested feature entries** in \`src/data.js\` and exposes a **Feature Audit** screen so the inventory can be reviewed inside the website.

The working frontend includes:

- Personalized registration/onboarding with name + current struggles
- Daily Verse and Night Verse flows
- Daily spiritual + mood check-ins
- Prayer journal, categories, people-to-pray-for entries, reminders, guided prayer, Scripture-shaped prayer, and answered-prayer archive
- Scripture memory list + review counts
- Gratitude, God-moment, and “What did God teach you?” journals
- Spiritual goals and 30/60/90-day challenges
- Day 1 / 7 / 30 / 100 / 365 milestones and non-competitive Journey scoring
- Bible reader with book/chapter selection, KJV + WEB side-by-side view, search, highlight, notes, saved references, and browser speech audio
- Bible study explorer for context, timelines, maps, people, places, family trees, genealogies, prophecy, miracles, parables, Jesus’ teachings, Paul’s journeys, kings, archaeology, word studies, and cross-references
- Local Study Assistant for simpler explanations, historical-context prompts, passage comparison, difficult-passage study prompts, questions, devotionals, related Scripture, quizzes, and study plans
- 13 Bible game modes plus daily 5-question mode, weekly tournament mode, XP, levels, achievements, badges, and local high scores
- Morning/evening devotionals and browser-based devotional audio
- Community composer, encouragement/testimony/prayer-request/group-challenge categories, reactions, anonymous posting, reporting, blocking/muting, guidelines, verified ministry sample, and group discovery UI
- Notification center with controls for Daily Verse, reading reminders, evening reflection, prayer, memory review, and community activity
- Journey Map from Start → Scripture → Prayer → Learning → Growth → Challenges → Milestones
- Audio toolkit with Bible audio, background Scripture, sleep Scripture, guided prayer, devotional speech, audio timer, Bible podcast link, and worship playlist link
- Seven interface language packs: English, Spanish, French, Portuguese, German, Korean, Chinese
- Family Mode with Parent/Guardian, Teen/Youth, and Child-safe profiles plus family plan, prayer board, kids games, family challenges, shared goals, and privacy/safety toggles
- Responsive premium dark UI with mobile navigation and animations
- Local persistence across the main Journey features

## Run locally

\`\`\`bash
npm install
npm run dev
\`\`\`

Then open the local URL Vite prints.

## Production build

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Important implementation boundary

This is currently a **frontend-first, local-persistence build**. User data is kept in the browser on the current device.

The UI includes the full requested feature inventory, but a real production service still needs a secure backend for cross-device authentication, account recovery, synchronized user data, browser push delivery, true multi-user community storage/moderation, and any external AI/audio/content services. The Study Assistant is explicitly a local study tool in this version and does not pretend to be God or a substitute for Scripture or pastoral guidance.

The Bible reader currently uses the public-domain KJV and an available WEB endpoint where the source responds; it falls back gracefully when the network/source is unavailable.

## In-site verification

Open **More → Run feature audit**. The audit screen is generated from the same feature manifest used to track the requested list, so the displayed count and feature names can be reviewed in the app itself.

## Brand

**The Journey**

> Scripture. Prayer. Learning. Growth. Your Journey with God.

Everything is designed around a free-first experience with no subscription gate in this frontend build.


<!-- CI visual verification branch -->
