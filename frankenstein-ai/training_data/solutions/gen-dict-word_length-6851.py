# Task: gen-dict-word_length-6851 | Score: 100% | 2026-02-14T13:11:52.907806

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))