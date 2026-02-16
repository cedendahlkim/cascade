# Task: gen-dict-word_length-8558 | Score: 100% | 2026-02-15T10:29:11.630782

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))