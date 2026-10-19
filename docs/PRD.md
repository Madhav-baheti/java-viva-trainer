# VivaPilot: Product Requirements Document

| | |
|---|---|
| **Product** | VivaPilot, an AI Java Viva Trainer |
| **Owner** | Madhav (github.com/Madhav-baheti) |
| **Event** | Devpost "Build With AI: Basics" (submit by Mon, Oct 26, 2026) |
| **Status** | v1.0, build scope locked |

---

## 1. Overview

VivaPilot helps Java students prepare for lab vivas. A student pastes Java code and gets it explained, is quizzed viva-style one question at a time, has weak concepts tracked and drilled, and can turn notes into flashcards.

It merges two ideas: a **Study Buddy** (quiz, track, revise) and a **Code Explainer** (explain, find bugs, give complexity).

## 2. Problem

In Java lab exams, writing the program is half the test. The viva is the other half, where the examiner asks why the code works. Students usually prepare by re-reading their code. They have no way to:

- practise being questioned on their own code,
- see which concepts they keep getting wrong,
- revise quickly from their notes.

## 3. Target users

- **Primary:** B.Tech / BCA students taking a Java or OOP lab course (for example, ES201 OOP using Java).
- **Secondary:** self-learners preparing for Java interviews.

## 4. Goals and non-goals

**Goals**
1. A student can go from pasted code to a scored viva in under 60 seconds.
2. The app visibly remembers weak topics and uses them to choose the next question.
3. Everything works end to end in a 2-minute demo.

**Non-goals (out of scope for this hackathon)**
- User accounts, login, or a database
- Languages other than Java
- Running or compiling the pasted code
- Mobile app, teacher dashboards, leaderboards
- Voice-based viva

## 5. User stories

| # | As a student, I want to... | So that... |
|---|---|---|
| U1 | paste a Java snippet and get a plain-language explanation | I understand what my code does |
| U2 | see likely bugs and the code's complexity | I can fix mistakes and answer "what is the complexity?" |
| U3 | be asked one viva question at a time about my code | I practise like the real viva |
| U4 | get a score and the model answer after each answer | I know how well I did and what a good answer looks like |
| U5 | see which topics I'm weak in | I know what to revise |
| U6 | be drilled on my weak topics automatically | I improve where it matters |
| U7 | paste my notes and get flashcards and a summary | I can revise quickly before the exam |

## 6. Features and acceptance criteria

### F1. Explain mode (P0)
**Input:** Java code (up to 6,000 characters).
**Output:** a summary in plain language, a step-by-step walkthrough, likely bugs or bad practices, time and space complexity, and the Java concepts used (tagged from the topic list).

Acceptance criteria:
- Empty input shows a clear message and makes no API call.
- Output shows four labelled sections: Summary, Walkthrough, Bugs/Issues, Complexity.
- If there are no bugs, it says so instead of inventing some.
- A loading state shows while waiting, and a readable error shows on failure.

### F2. Viva mode (P0)
**Flow:** the student picks a source (their pasted code, a topic, or "drill my weak topics") and starts a session of 5 questions.

Acceptance criteria:
- Exactly one question is shown at a time.
- After the student answers, the app shows a **score out of 10**, a short verdict, the **model answer**, and what the student missed.
- Every question and evaluation carries a **topic tag** from the fixed topic list.
- Questions do not repeat within a session.
- Difficulty goes up if the last score was 8 or more, and down if it was 4 or less.
- A final screen shows the session total and the per-topic results.

### F3. Weak-topic tracker (P0)
Acceptance criteria:
- Every evaluated answer saves its topic and score in the browser (`localStorage`).
- The Weak Topics tab lists topics by average score, weakest first, with the number of attempts.
- A topic is marked **weak** if its average over the last 5 attempts is below 6.
- "Drill weak topics" starts a viva session focused on the weakest topics.
- Data survives a page refresh. A "Reset progress" button clears it.

### F4. Revision pack (P1, cut first if time runs short)
**Input:** the student's notes (up to 6,000 characters).
**Output:** 8 to 10 flashcards (question and answer, each tagged with a topic) and a summary of 5 to 7 bullet points.

Acceptance criteria:
- Flashcards can be flipped one by one (click to reveal the answer).
- The summary is shown above the cards.

## 7. UX flow

One page with four tabs: **Explain, Viva, Weak Topics, Revision.**

```
Explain: paste code -> [Explain] -> result
            |
            +-> [Quiz me on this code] -> Viva tab (code pre-loaded)

Viva: choose source -> question -> answer -> score + model answer -> next -> summary
                                                   |
                                                   +-> saves topic + score

Weak Topics: ranked list -> [Drill weak topics] -> Viva tab

Revision: paste notes -> [Generate] -> summary + flip cards
```

The "Quiz me on this code" button is what ties the app together for the demo.

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Each AI response in under 10 seconds on a normal connection |
| Reliability | If the AI returns invalid JSON, retry once, then show a friendly error |
| Security | The API key lives only on the server (`.env`), never in the frontend or the repo |
| Abuse limits | Input length caps and a per-IP rate limit |
| Privacy | No accounts and no server-side storage. Progress stays in the user's browser |
| Usability | Works on a laptop screen. No setup needed beyond opening the page |
| Accessibility | Keyboard-usable controls and readable contrast |

## 9. Priorities and scope cuts

| Priority | Item | Cut rule |
|---|---|---|
| P0 | Explain, Viva, Weak-topic tracker | Never cut. These are the demo story |
| P1 | Revision pack | Cut first if there's no working core by Saturday night |
| P2 | Syntax highlighting, dark/light toggle, export progress | Only if everything else is done |

## 10. Success criteria (the demo)

A 2-minute demo shows this flow without errors:
1. Paste a Java inheritance example into Explain and show the explanation, bug and complexity.
2. Click "Quiz me on this code" and answer 2 questions, one badly and one well.
3. Open Weak Topics and show that the weak topic is now listed.
4. Click "Drill weak topics" and show that the next question targets it.
5. (If built) Paste notes and show the flashcards.

## 11. Timeline

| When | Milestone |
|---|---|
| Tue, Oct 20 (tonight) | Repo and setup done, docs committed, server runs |
| Sat, Oct 24 | Explain mode and Viva mode working end to end |
| Sun, Oct 25 | Weak-topic tracker, then Revision pack, then README, screenshots and demo video |
| Mon, Oct 26 (evening) | Submit on Devpost (deadline Oct 27, 2:30 AM IST) |

Wed to Fri are college days, so no work is planned.

## 12. Risks

| Risk | Mitigation |
|---|---|
| Little build time | Strict scope, with Revision pack as the first cut |
| AI returns messy or non-JSON output | A strict JSON-only prompt, a validator, one retry |
| Inconsistent topic names break the tracker | A fixed topic list that the model must choose from |
| API key leaks | `.env` in `.gitignore`, server-side calls only |
| API errors or rate limits during the demo | Clear error messages, and record the demo video early |

## 13. Open questions

- Does the hackathon require a specific AI model, API or coding agent? Check the Devpost rules and the "Learn Skill Pack" page.
- Will the app be hosted live, or only shown through the repo and demo video?
