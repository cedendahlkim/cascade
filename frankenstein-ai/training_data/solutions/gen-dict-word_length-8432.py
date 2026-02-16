# Task: gen-dict-word_length-8432 | Score: 100% | 2026-02-13T10:39:38.426541

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))