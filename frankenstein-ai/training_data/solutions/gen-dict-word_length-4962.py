# Task: gen-dict-word_length-4962 | Score: 100% | 2026-02-15T08:15:03.863532

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))