# Task: gen-dict-word_length-2941 | Score: 100% | 2026-02-13T11:03:12.397183

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))