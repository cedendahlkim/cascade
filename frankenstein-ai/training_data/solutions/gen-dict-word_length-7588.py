# Task: gen-dict-word_length-7588 | Score: 100% | 2026-02-13T09:12:23.508195

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))