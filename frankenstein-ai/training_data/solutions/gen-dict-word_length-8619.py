# Task: gen-dict-word_length-8619 | Score: 100% | 2026-02-13T09:22:42.817919

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))