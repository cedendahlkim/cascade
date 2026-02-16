# Task: gen-dict-word_length-1019 | Score: 100% | 2026-02-15T08:14:46.215789

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))