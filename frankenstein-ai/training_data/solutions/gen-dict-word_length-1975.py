# Task: gen-dict-word_length-1975 | Score: 100% | 2026-02-13T12:05:47.751473

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))