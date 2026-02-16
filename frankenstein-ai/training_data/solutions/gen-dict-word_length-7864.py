# Task: gen-dict-word_length-7864 | Score: 100% | 2026-02-13T19:48:16.756707

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))