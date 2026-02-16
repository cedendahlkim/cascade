# Task: gen-dict-word_length-9338 | Score: 100% | 2026-02-13T16:07:11.133885

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))