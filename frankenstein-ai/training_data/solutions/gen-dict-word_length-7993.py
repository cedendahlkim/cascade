# Task: gen-dict-word_length-7993 | Score: 100% | 2026-02-13T10:39:37.191640

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))