# Task: gen-dict-word_length-3976 | Score: 100% | 2026-02-13T18:29:42.332501

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))