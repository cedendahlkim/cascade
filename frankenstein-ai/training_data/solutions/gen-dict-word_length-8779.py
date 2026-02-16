# Task: gen-dict-word_length-8779 | Score: 100% | 2026-02-13T10:03:07.330634

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))