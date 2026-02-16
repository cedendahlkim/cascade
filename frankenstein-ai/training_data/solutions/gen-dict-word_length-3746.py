# Task: gen-dict-word_length-3746 | Score: 100% | 2026-02-15T10:10:08.524489

s = input()
for w in sorted(set(s.split())):
    print(w, len(w))