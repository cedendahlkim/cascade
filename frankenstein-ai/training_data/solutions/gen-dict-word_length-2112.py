# Task: gen-dict-word_length-2112 | Score: 100% | 2026-02-13T10:03:09.450976

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))