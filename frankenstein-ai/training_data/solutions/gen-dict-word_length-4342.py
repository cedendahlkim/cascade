# Task: gen-dict-word_length-4342 | Score: 100% | 2026-02-13T14:42:22.034706

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))