# Task: gen-dict-word_length-9348 | Score: 100% | 2026-02-15T12:30:09.490580

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))