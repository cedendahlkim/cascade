# Task: gen-dict-word_length-9069 | Score: 100% | 2026-02-15T09:34:44.057115

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))