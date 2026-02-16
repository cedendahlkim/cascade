# Task: gen-dict-word_length-9864 | Score: 100% | 2026-02-15T10:29:08.735012

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))