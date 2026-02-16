# Task: gen-dict-word_length-9928 | Score: 100% | 2026-02-13T09:20:44.020556

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))