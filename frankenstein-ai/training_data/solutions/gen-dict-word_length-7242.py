# Task: gen-dict-word_length-7242 | Score: 100% | 2026-02-13T16:07:12.630074

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))