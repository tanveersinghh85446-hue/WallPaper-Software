// Tagging ka hisaab-kitaab (model ke bina). Alag file me hai taaki test ho sake.

export function softmax(values, scale = 100) {
  const max = Math.max(...values);
  const exps = values.map((v) => Math.exp((v - max) * scale));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function normalize(vec) {
  let n = 0;
  for (const v of vec) n += v * v;
  n = Math.sqrt(n) || 1;
  return Float32Array.from(vec, (v) => v / n);
}

export const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

// Image embedding aur ek group ke label embeddings se top labels nikalta hai.
// Sabse upar wala label tab hi aata hai jab uski probability minProb se zyada ho (galat tag se behtar hai tag na ho).
export function pickLabels(
  imageEmb,
  labelEmbs,
  labels,
  { minProb = 0.3, max = 2 } = {},
) {
  const probs = softmax(labelEmbs.map((e) => dot(imageEmb, e)));
  return probs
    .map((p, i) => ({ label: labels[i], prob: p }))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, max)
    .filter((x, i) => x.prob >= minProb && (i === 0 || x.prob >= 0.25));
}

// groups: { color: [{label,prob}], brand: [...] }  titleOrder: ["color","brand","type"]
export function buildTags(groups, titleOrder = []) {
  const title = titleOrder
    .map((g) => groups[g]?.[0]?.label)
    .filter(Boolean)
    .join(" ");
  const tags = [
    ...new Set(Object.values(groups).flatMap((l) => l.map((x) => x.label))),
  ];
  return { title, tags };
}

// Folder ke naam se vocab chunta hai: "cars" / "car" folder -> vocab me "car" key, baaki sab "general"
export function vocabKeyFor(vocab, category) {
  const c = (category || "").toLowerCase();
  return (
    Object.keys(vocab).find((k) => k !== "general" && c.includes(k)) ||
    "general"
  );
}
