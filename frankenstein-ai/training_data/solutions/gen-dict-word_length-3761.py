# Task: gen-dict-word_length-3761 | Score: 100% | 2026-02-14T12:59:44.354320

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))