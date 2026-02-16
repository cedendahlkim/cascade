# Task: gen-strv-anagram-9873 | Score: 100% | 2026-02-13T10:13:33.496693

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')