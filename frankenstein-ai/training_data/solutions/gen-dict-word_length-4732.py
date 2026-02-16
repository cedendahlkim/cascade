# Task: gen-dict-word_length-4732 | Score: 100% | 2026-02-15T09:01:49.618572

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))