# Task: gen-dict-word_length-5195 | Score: 100% | 2026-02-13T18:19:30.544557

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))