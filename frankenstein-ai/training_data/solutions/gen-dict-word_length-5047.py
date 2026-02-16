# Task: gen-dict-word_length-5047 | Score: 100% | 2026-02-13T20:01:42.366034

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))