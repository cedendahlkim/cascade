# Task: gen-dict-word_length-3058 | Score: 100% | 2026-02-15T12:29:59.639546

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))