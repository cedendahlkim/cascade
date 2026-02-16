# Task: gen-dict-word_length-3013 | Score: 100% | 2026-02-13T14:30:20.355821

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))