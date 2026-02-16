# Task: gen-dict-word_length-6897 | Score: 100% | 2026-02-13T17:36:14.180202

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))