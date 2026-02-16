# Task: gen-dict-word_length-3827 | Score: 100% | 2026-02-13T16:06:48.524433

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))