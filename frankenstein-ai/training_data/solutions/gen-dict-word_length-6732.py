# Task: gen-dict-word_length-6732 | Score: 100% | 2026-02-15T07:53:07.770549

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))