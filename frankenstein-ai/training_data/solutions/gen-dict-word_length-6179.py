# Task: gen-dict-word_length-6179 | Score: 100% | 2026-02-15T11:36:47.181581

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))