# Task: gen-dict-word_length-7949 | Score: 100% | 2026-02-15T10:28:53.474838

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))