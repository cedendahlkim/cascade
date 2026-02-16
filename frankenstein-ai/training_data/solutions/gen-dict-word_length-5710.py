# Task: gen-dict-word_length-5710 | Score: 100% | 2026-02-13T12:26:40.826874

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))