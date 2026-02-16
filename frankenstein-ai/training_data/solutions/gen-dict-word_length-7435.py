# Task: gen-dict-word_length-7435 | Score: 100% | 2026-02-15T13:29:46.680974

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))