# Task: gen-dict-word_length-8403 | Score: 100% | 2026-02-13T13:42:59.590744

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))