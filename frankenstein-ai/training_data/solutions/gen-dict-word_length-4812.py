# Task: gen-dict-word_length-4812 | Score: 100% | 2026-02-15T10:09:33.470547

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))