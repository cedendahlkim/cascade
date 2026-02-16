# Task: gen-dict-word_length-2290 | Score: 100% | 2026-02-15T08:24:11.573191

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))