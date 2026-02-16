# Task: gen-dict-word_length-6217 | Score: 100% | 2026-02-13T09:22:40.310459

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))