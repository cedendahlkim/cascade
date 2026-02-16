# Task: gen-dict-word_length-8956 | Score: 100% | 2026-02-13T11:33:41.224471

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))