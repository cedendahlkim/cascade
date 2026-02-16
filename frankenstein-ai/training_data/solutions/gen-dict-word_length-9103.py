# Task: gen-dict-word_length-9103 | Score: 100% | 2026-02-13T19:48:17.045937

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))