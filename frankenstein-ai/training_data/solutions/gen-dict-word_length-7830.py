# Task: gen-dict-word_length-7830 | Score: 100% | 2026-02-13T20:17:14.559954

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))