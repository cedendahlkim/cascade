# Task: gen-dict-word_length-3251 | Score: 100% | 2026-02-13T11:33:44.007868

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))