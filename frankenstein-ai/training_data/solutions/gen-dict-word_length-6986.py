# Task: gen-dict-word_length-6986 | Score: 100% | 2026-02-14T12:13:44.180360

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))