# Task: gen-dict-word_length-6289 | Score: 100% | 2026-02-13T14:42:11.877131

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))