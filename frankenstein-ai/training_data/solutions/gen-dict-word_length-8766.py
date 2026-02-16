# Task: gen-dict-word_length-8766 | Score: 100% | 2026-02-13T09:22:36.696533

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))