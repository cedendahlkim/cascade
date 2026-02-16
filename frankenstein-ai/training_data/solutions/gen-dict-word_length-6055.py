# Task: gen-dict-word_length-6055 | Score: 100% | 2026-02-15T08:14:41.765510

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))