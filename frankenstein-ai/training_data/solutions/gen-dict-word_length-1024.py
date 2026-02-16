# Task: gen-dict-word_length-1024 | Score: 100% | 2026-02-15T12:30:01.665901

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))