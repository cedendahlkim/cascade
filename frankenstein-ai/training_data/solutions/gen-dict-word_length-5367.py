# Task: gen-dict-word_length-5367 | Score: 100% | 2026-02-15T07:53:20.164188

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))