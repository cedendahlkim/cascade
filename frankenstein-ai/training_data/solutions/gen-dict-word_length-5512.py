# Task: gen-dict-word_length-5512 | Score: 100% | 2026-02-13T12:13:22.451795

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))