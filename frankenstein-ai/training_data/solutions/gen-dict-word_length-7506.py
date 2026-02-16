# Task: gen-dict-word_length-7506 | Score: 100% | 2026-02-15T13:59:50.144278

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))