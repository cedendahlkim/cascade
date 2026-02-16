# Task: gen-dict-word_length-5360 | Score: 100% | 2026-02-14T13:11:51.351728

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))