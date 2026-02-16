# Task: gen-dict-word_length-4279 | Score: 100% | 2026-02-13T09:22:39.980441

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))