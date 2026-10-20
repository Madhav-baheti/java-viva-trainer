// src/topics.js
// Fixed topic list as per ARCHITECTURE.md
const topics = [
  "java-basics",
  "strings",
  "arrays",
  "loops-control-flow",
  "classes-objects",
  "constructors",
  "encapsulation",
  "inheritance",
  "polymorphism",
  "abstraction-interfaces",
  "exceptions",
  "collections",
  "generics",
  "file-io",
  "multithreading",
];

/**
 * Normalizes a topic tag to one of the fixed topics.
 * Returns the tag if it exists in the list; otherwise attempts a simple fuzzy match.
 * If no match is found, returns "java-basics".
 */
function normalizeTopic(tag) {
  if (!tag) return "java-basics";
  const lower = tag.toLowerCase();
  if (topics.includes(lower)) return lower;
  for (const t of topics) {
    if (t.includes(lower) || lower.includes(t)) return t;
  }
  return "java-basics";
}

module.exports = { topics, normalizeTopic };
