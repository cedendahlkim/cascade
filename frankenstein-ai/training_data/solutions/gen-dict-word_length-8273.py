# Task: gen-dict-word_length-8273 | Score: 100% | 2026-02-15T07:53:10.294885

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))