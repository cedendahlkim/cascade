# Task: gen-dict-word_length-7143 | Score: 100% | 2026-02-15T10:28:56.499263

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))