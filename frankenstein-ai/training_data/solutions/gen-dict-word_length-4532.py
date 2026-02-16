# Task: gen-dict-word_length-4532 | Score: 100% | 2026-02-13T19:48:19.169233

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))