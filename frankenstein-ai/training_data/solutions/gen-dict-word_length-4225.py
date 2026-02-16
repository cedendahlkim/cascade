# Task: gen-dict-word_length-4225 | Score: 100% | 2026-02-15T13:59:58.775492

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))