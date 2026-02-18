# Task: gen-dict-word_length-2791 | Score: 100% | 2026-02-17T19:57:40.392201

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))