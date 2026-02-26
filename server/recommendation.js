function computeMatch(answersA = {}, answersB = {}) {
  const keys = Object.keys(answersA);
  if (!keys.length) {
    return { score: 0, overlap: 0, total: 0 };
  }

  let matches = 0;
  let overlap = 0;

  for (const key of keys) {
    if (answersB[key] == null) {
      continue;
    }
    overlap += 1;
    if (answersA[key] === answersB[key]) {
      matches += 1;
    }
  }

  if (!overlap) {
    return { score: 0, overlap: 0, total: keys.length };
  }

  const score = Math.round((matches / overlap) * 100);
  return { score, overlap, total: keys.length };
}

module.exports = { computeMatch };
