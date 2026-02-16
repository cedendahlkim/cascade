# Task: gen-dict-word_length-5532 | Score: 100% | 2026-02-14T12:13:35.120175

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))