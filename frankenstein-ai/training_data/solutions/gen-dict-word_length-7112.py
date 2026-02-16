# Task: gen-dict-word_length-7112 | Score: 100% | 2026-02-13T16:47:50.605975

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))