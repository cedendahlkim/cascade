# Task: gen-dict-word_length-7452 | Score: 100% | 2026-02-13T09:34:35.146098

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))