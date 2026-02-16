# Task: gen-dict-word_length-9812 | Score: 100% | 2026-02-15T08:14:42.549924

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))