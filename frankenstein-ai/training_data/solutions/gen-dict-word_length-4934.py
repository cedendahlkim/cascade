# Task: gen-dict-word_length-4934 | Score: 100% | 2026-02-13T18:19:27.647852

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))