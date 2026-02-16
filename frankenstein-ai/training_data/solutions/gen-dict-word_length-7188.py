# Task: gen-dict-word_length-7188 | Score: 100% | 2026-02-15T08:15:03.560261

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))