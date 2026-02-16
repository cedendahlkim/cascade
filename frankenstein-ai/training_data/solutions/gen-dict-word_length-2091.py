# Task: gen-dict-word_length-2091 | Score: 100% | 2026-02-13T13:47:27.357792

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))