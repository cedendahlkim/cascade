# Task: gen-dict-word_length-7913 | Score: 100% | 2026-02-15T09:18:00.621643

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))