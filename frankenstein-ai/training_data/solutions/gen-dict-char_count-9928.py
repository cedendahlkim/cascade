# Task: gen-dict-char_count-9928 | Score: 100% | 2026-02-13T14:18:52.084007

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))