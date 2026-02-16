# Task: gen-dict-word_length-5413 | Score: 100% | 2026-02-13T21:48:45.400745

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))