# Task: gen-dict-word_length-6142 | Score: 100% | 2026-02-13T18:19:35.707412

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))