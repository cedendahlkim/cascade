# Task: gen-dict-word_length-8452 | Score: 100% | 2026-02-13T11:09:06.970830

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))