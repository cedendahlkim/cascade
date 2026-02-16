# Task: gen-dict-word_length-1950 | Score: 100% | 2026-02-13T11:42:57.752243

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))