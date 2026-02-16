# Task: gen-dict-word_length-8841 | Score: 100% | 2026-02-13T10:03:03.500057

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))