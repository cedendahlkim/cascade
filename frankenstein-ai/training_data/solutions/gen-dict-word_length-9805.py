# Task: gen-dict-word_length-9805 | Score: 100% | 2026-02-13T11:09:06.043646

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))