# Task: gen-dict-word_length-9237 | Score: 100% | 2026-02-13T17:36:05.995707

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))