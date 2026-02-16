# Task: gen-strv-anagram-7734 | Score: 100% | 2026-02-13T21:08:19.828359

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')