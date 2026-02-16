# Task: gen-dict-word_length-8218 | Score: 100% | 2026-02-15T09:16:29.188008

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))