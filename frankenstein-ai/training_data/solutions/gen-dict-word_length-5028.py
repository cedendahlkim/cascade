# Task: gen-dict-word_length-5028 | Score: 100% | 2026-02-15T10:29:07.916708

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))