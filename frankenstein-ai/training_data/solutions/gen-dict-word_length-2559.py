# Task: gen-dict-word_length-2559 | Score: 100% | 2026-02-13T10:01:49.136607

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))