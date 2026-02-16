# Task: gen-dict-word_length-3579 | Score: 100% | 2026-02-13T18:46:42.379336

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))