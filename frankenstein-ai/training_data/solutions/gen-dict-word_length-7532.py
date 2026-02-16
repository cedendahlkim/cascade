# Task: gen-dict-word_length-7532 | Score: 100% | 2026-02-15T11:36:46.597156

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))