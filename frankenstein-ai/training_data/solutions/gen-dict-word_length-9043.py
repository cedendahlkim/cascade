# Task: gen-dict-word_length-9043 | Score: 100% | 2026-02-13T10:39:31.272852

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))