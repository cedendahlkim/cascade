# Task: gen-dict-word_length-5859 | Score: 100% | 2026-02-13T10:03:05.316631

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))