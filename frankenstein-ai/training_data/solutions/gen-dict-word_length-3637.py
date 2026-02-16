# Task: gen-dict-word_length-3637 | Score: 100% | 2026-02-15T07:53:09.570867

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))