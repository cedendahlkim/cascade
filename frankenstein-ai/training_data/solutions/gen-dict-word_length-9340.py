# Task: gen-dict-word_length-9340 | Score: 100% | 2026-02-13T13:47:28.796381

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))