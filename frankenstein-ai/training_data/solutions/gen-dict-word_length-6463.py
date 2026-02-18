# Task: gen-dict-word_length-6463 | Score: 100% | 2026-02-17T20:09:05.045535

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))