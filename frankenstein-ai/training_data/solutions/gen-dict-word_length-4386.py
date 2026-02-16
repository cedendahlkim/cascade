# Task: gen-dict-word_length-4386 | Score: 100% | 2026-02-15T13:00:29.143489

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))