# Task: gen-dict-char_count-8843 | Score: 100% | 2026-02-13T20:17:17.296105

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))