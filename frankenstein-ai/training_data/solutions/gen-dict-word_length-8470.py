# Task: gen-dict-word_length-8470 | Score: 100% | 2026-02-15T13:30:45.066329

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))