# Task: gen-dict-word_length-5314 | Score: 100% | 2026-02-15T08:15:23.503671

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))