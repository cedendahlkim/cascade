# Task: gen-strv-anagram-4719 | Score: 100% | 2026-02-14T13:26:14.995147

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')