# Task: gen-dict-word_length-7755 | Score: 100% | 2026-02-13T14:18:54.752130

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))