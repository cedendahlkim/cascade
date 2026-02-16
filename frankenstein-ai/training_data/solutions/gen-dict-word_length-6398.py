# Task: gen-dict-word_length-6398 | Score: 100% | 2026-02-15T13:30:43.986490

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))