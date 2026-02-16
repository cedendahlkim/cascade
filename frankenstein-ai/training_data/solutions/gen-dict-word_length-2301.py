# Task: gen-dict-word_length-2301 | Score: 100% | 2026-02-13T09:22:34.220821

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))