# Task: gen-dict-word_length-7543 | Score: 100% | 2026-02-14T13:26:47.526852

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))