# Task: gen-dict-word_length-6842 | Score: 100% | 2026-02-13T21:48:42.850640

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))