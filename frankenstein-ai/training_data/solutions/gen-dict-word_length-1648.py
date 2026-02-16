# Task: gen-dict-word_length-1648 | Score: 100% | 2026-02-15T09:17:00.086278

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))