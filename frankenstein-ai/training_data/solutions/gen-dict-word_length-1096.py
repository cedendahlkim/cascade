# Task: gen-dict-word_length-1096 | Score: 100% | 2026-02-15T08:49:21.121745

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))