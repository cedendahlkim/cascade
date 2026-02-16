# Task: gen-dict-word_length-3037 | Score: 100% | 2026-02-15T08:36:24.524499

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))