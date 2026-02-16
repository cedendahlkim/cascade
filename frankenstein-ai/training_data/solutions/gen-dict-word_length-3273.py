# Task: gen-dict-word_length-3273 | Score: 100% | 2026-02-14T12:03:08.802875

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))