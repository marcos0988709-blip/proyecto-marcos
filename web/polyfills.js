if (!Map.groupBy) {
  Map.groupBy = (items, fn) => {
    const m = new Map();
    for (const x of items) {
      const k = fn(x);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(x);
    }
    return m;
  };
}
