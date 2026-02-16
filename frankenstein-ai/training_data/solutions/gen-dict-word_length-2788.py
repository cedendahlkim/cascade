# Task: gen-dict-word_length-2788 | Score: 100% | 2026-02-15T07:45:50.513784

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))