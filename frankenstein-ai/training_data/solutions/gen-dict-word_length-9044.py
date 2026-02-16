# Task: gen-dict-word_length-9044 | Score: 100% | 2026-02-13T14:56:44.085486

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))