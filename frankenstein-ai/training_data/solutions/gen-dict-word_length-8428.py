# Task: gen-dict-word_length-8428 | Score: 100% | 2026-02-13T16:07:10.776505

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))