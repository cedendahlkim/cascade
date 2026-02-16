# Task: gen-dict-char_count-2939 | Score: 100% | 2026-02-15T09:02:14.812856

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))