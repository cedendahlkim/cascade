# Task: gen-dict-word_length-9603 | Score: 100% | 2026-02-13T19:05:38.577071

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))