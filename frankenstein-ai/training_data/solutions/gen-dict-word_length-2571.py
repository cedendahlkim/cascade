# Task: gen-dict-word_length-2571 | Score: 100% | 2026-02-15T09:18:02.218116

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))