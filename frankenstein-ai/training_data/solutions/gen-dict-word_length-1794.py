# Task: gen-dict-word_length-1794 | Score: 100% | 2026-02-15T09:34:53.628638

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))