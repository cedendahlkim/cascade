# Task: gen-strv-anagram-7615 | Score: 100% | 2026-02-14T12:48:47.482563

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')