# Task: gen-dict-word_length-7959 | Score: 100% | 2026-02-15T08:14:31.563665

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))