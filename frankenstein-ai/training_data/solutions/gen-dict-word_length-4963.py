# Task: gen-dict-word_length-4963 | Score: 100% | 2026-02-13T09:20:42.094398

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))