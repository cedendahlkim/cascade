# Task: gen-dict-word_length-3334 | Score: 100% | 2026-02-15T09:18:02.595822

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))