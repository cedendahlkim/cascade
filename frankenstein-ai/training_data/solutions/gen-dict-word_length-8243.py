# Task: gen-dict-word_length-8243 | Score: 100% | 2026-02-14T12:05:10.461599

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))