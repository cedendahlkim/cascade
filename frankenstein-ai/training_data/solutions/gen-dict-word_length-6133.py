# Task: gen-dict-word_length-6133 | Score: 100% | 2026-02-15T08:14:45.926287

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))