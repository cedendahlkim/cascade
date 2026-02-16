# Task: gen-dict-word_length-9420 | Score: 100% | 2026-02-13T21:08:24.078570

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))