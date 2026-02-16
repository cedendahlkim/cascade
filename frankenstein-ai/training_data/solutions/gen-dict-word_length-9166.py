# Task: gen-dict-word_length-9166 | Score: 100% | 2026-02-13T16:47:53.199581

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))