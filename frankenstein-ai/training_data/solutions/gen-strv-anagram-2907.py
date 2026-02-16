# Task: gen-strv-anagram-2907 | Score: 100% | 2026-02-15T08:24:35.966818

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')