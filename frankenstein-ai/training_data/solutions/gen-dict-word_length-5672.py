# Task: gen-dict-word_length-5672 | Score: 100% | 2026-02-13T18:33:47.571396

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))