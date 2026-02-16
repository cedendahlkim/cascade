# Task: gen-dict-word_length-2058 | Score: 100% | 2026-02-13T18:58:06.453866

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))