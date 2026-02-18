# Task: gen-dict-word_length-8736 | Score: 100% | 2026-02-17T20:03:23.594701

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))