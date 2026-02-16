# Task: gen-dict-word_length-6094 | Score: 100% | 2026-02-15T08:24:09.861100

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))