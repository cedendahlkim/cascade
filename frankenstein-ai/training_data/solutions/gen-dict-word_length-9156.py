# Task: gen-dict-word_length-9156 | Score: 100% | 2026-02-14T12:20:42.591769

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))