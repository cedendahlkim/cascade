# Task: gen-dict-word_length-6821 | Score: 100% | 2026-02-13T18:23:00.699021

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))