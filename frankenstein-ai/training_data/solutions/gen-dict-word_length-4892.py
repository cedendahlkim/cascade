# Task: gen-dict-word_length-4892 | Score: 100% | 2026-02-15T08:24:26.444031

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))