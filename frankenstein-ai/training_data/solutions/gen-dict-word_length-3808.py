# Task: gen-dict-word_length-3808 | Score: 100% | 2026-02-13T16:06:59.899176

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))