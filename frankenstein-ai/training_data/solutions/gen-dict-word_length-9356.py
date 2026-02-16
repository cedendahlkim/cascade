# Task: gen-dict-word_length-9356 | Score: 100% | 2026-02-15T08:14:24.018808

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))