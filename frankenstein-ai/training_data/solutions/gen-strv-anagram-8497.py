# Task: gen-strv-anagram-8497 | Score: 100% | 2026-02-14T13:26:14.476217

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')