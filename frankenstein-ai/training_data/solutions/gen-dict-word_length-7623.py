# Task: gen-dict-word_length-7623 | Score: 100% | 2026-02-13T18:37:35.870270

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))