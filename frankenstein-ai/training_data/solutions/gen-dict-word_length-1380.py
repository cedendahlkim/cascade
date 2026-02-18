# Task: gen-dict-word_length-1380 | Score: 100% | 2026-02-17T20:35:40.033768

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))