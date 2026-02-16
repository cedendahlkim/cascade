# Task: gen-strv-anagram-9148 | Score: 100% | 2026-02-13T09:51:17.090665

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')