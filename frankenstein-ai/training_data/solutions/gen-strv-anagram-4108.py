# Task: gen-strv-anagram-4108 | Score: 100% | 2026-02-15T13:01:06.179827

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')