# Task: gen-dict-word_length-1077 | Score: 100% | 2026-02-13T12:05:48.696182

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))