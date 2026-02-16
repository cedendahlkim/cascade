# Task: gen-dict-word_length-3263 | Score: 100% | 2026-02-14T12:02:41.027528

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))