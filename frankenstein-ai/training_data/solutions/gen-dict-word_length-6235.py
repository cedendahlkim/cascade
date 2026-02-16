# Task: gen-dict-word_length-6235 | Score: 100% | 2026-02-15T08:14:54.288284

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))