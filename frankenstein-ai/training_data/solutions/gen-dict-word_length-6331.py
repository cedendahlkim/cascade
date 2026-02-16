# Task: gen-dict-word_length-6331 | Score: 100% | 2026-02-13T21:07:39.086940

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))