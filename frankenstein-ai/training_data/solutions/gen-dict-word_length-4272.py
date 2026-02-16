# Task: gen-dict-word_length-4272 | Score: 100% | 2026-02-13T18:37:35.629443

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))