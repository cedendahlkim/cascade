# Task: gen-dict-char_count-9820 | Score: 100% | 2026-02-13T14:56:51.885666

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))