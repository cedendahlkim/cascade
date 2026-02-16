# Task: gen-dict-word_length-1246 | Score: 100% | 2026-02-13T20:17:07.921871

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))