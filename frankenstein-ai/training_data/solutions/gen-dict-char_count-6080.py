# Task: gen-dict-char_count-6080 | Score: 100% | 2026-02-13T14:30:20.698395

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))