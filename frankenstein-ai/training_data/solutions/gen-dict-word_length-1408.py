# Task: gen-dict-word_length-1408 | Score: 100% | 2026-02-13T14:30:21.703577

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))