# Task: gen-dict-word_length-8741 | Score: 100% | 2026-02-14T12:20:55.095813

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))