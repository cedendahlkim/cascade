# Task: gen-dict-word_length-5876 | Score: 100% | 2026-02-13T11:03:59.106446

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))