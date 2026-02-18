# Task: gen-dict-word_length-2553 | Score: 100% | 2026-02-17T19:57:40.966261

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))