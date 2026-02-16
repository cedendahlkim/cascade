# Task: gen-dict-word_length-9080 | Score: 100% | 2026-02-13T10:03:06.614821

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))