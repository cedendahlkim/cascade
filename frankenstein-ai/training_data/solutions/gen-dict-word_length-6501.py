# Task: gen-dict-word_length-6501 | Score: 100% | 2026-02-13T14:56:37.917849

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))